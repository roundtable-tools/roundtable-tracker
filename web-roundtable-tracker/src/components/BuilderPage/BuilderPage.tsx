import { useState, useEffect, useMemo } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSavedEncountersStore } from '@/store/savedEncounterInstance';
import { useSavedEncountersStore } from '@/store/savedEncounterInstance';
import type { ConcreteEncounter } from '@/store/data';
import encounterTemplates from '@/store/Encounters/migratedEncounterTemplates';
import { ThreatTracker } from './ThreatTracker';
import {
	EVENT_SLOT_TYPES,
	PARTICIPANT_SLOT_TYPES,
	SlotRow,
} from './SlotRow.tsx';
import type { AdditionalDataBlockKey } from './SlotRow.tsx';
import { SaveSuccessModal } from './SaveSuccessModal';
import { computeEncounterXpUsage, type SlotType } from './builderXp';
import { useNavigate } from '@tanstack/react-router';
import {
	deleteImportedEncounterDraft,
	getImportedEncounterDraft,
} from '@/store/importedEncounterDraft';
import {
	defaultFormValues,
	defaultSlot,
	fromEncounterTemplate,
	fromConcreteEncounter,
	toConcreteEncounter,
	templateVariantToFormPartial,
	type BuilderFormValues,
	type BuilderVariantSnapshot,
} from './builderConvert';
import { v4 as uuidv4 } from 'uuid';
import { RotateCcw, Trash2 } from 'lucide-react';
import {
	getEventSectionSummary,
	getParticipantSectionSummary,
	getSlotSectionIndices,
} from './slotSections';

function hasAdditionalBlock(
	slot: BuilderFormValues['slots'][number],
	key: AdditionalDataBlockKey
): boolean {
	if (slot.type !== 'creature' && slot.type !== 'hazard') {
		return false;
	}

	if (key === 'hp') {
		return (
			typeof slot.maxHealth === 'number' ||
			(slot.type === 'hazard' && typeof slot.hardness === 'number')
		);
	}

	if (key === 'dcs') {
		return (slot.dcs?.length ?? 0) > 0;
	}

	if (key === 'initiative') {
		return typeof slot.initiativeBonus === 'number';
	}

	if (key === 'adjustment') {
		return (
			slot.type === 'creature' &&
			(slot.adjustment !== 'none' ||
				(slot.adjustmentDescription?.trim().length ?? 0) > 0 ||
				typeof slot.adjustmentLevelModifier === 'number')
		);
	}

	return false;
}

interface BuilderPageProps {
	encounterId?: string;
	importDraftId?: string;
	templateId?: string;
	templateVariantId?: string;
	templateLevel?: number;
	templatePartySize?: number;
}

export function BuilderPage({
	encounterId,
	importDraftId,
	templateId,
	templateVariantId,
	templateLevel,
	templatePartySize,
}: BuilderPageProps) {
	const navigate = useNavigate();
	const [activeEncounterId, setActiveEncounterId] = useState<
		string | undefined
	>(encounterId);
	const [savedEncounter, setSavedEncounter] =
		useState<ConcreteEncounter | null>(null);
	const attritionRatePercent = 5;
	const maxRounds = 20;
	const basePartyOutputPerRound = 20;

	const addEncounter = useSavedEncountersStore((s) => s.addEncounter);
	const updateEncounter = useSavedEncountersStore((s) => s.updateEncounter);
	const removeEncounter = useSavedEncountersStore((s) => s.removeEncounter);

	const form = useForm<BuilderFormValues>({
		defaultValues: defaultFormValues(),
	});

	const { control, handleSubmit, reset, formState } = form;

	const { fields, append, remove, update } = useFieldArray({
		control,
		name: 'slots',
	});

	const slots = useWatch({ control, name: 'slots' });
	const partyLevel = useWatch({ control, name: 'partyLevel' });
	const partySize = useWatch({ control, name: 'partySize' });

	useEffect(() => {
		setActiveEncounterId(encounterId);
	}, [encounterId]);

	// Hydrate form when editing an existing encounter
	useEffect(() => {
		if (activeEncounterId) {
			const store = getSavedEncountersStore().getState();
			const existing = store.savedEncounters.find(
				(e) => e.id === activeEncounterId
			);

			if (existing) {
				reset(fromConcreteEncounter(existing));
			}
		}
	}, [activeEncounterId, reset]);

	useEffect(() => {
		if (!importDraftId || activeEncounterId) {
			return;
		}

		const importedDraft = getImportedEncounterDraft(importDraftId);

		if (!importedDraft) {
			return;
		}

		reset(fromConcreteEncounter(importedDraft));
		deleteImportedEncounterDraft(importDraftId);
	}, [importDraftId, activeEncounterId, reset]);

	// Initialize from template when templateId is provided and no encounterId
	useEffect(() => {
		if (!templateId || activeEncounterId || importDraftId) return;

		const template = encounterTemplates.find((t) => t.id === templateId);

		if (!template) {
			console.warn(`Template ${templateId} not found`);

			return;
		}

		// Initialize form with template defaults
		const defaultVariant = template.variants.find(
			(v) => v.id === template.defaultVariantId
		);
		const selectedVariant = templateVariantId
			? template.variants.find((variant) => variant.id === templateVariantId)
			: undefined;
		const variantToUse = selectedVariant ?? defaultVariant;

		if (!variantToUse) {
			console.warn(`No usable variant found in template ${templateId}`);

			return;
		}

		const initialFormValues: BuilderFormValues = fromEncounterTemplate(
			template,
			variantToUse,
			{
				partyLevel: templateLevel,
				partySize: templatePartySize,
			}
		);

		reset(initialFormValues);
	}, [
		templateId,
		templateVariantId,
		activeEncounterId,
		importDraftId,
		templateLevel,
		templatePartySize,
		reset,
	]);

	const safePartyLevel =
		typeof partyLevel === 'number' && Number.isFinite(partyLevel)
			? partyLevel
			: 1;
	const safePartySize =
		typeof partySize === 'number' && Number.isFinite(partySize) && partySize > 0
			? partySize
			: 4;
	const xpUsage = computeEncounterXpUsage(
		slots ?? [],
		safePartyLevel,
		safePartySize,
		{
			attritionRate: Math.max(0, attritionRatePercent) / 100,
			maxRounds: Math.max(1, maxRounds),
			basePartyOutputPerRound: Math.max(0, basePartyOutputPerRound),
		}
	);
	const resolvedSlots = slots ?? [];
	const participantIndices = getSlotSectionIndices(
		resolvedSlots,
		'participants'
	);
	const eventIndices = getSlotSectionIndices(resolvedSlots, 'events');
	const participantSummary = getParticipantSectionSummary(resolvedSlots);
	const eventSummary = getEventSectionSummary(resolvedSlots);
	const variants = useWatch({ control, name: 'variants' }) ?? [];
	const usedAdditionalDataBlocks = useMemo(() => {
		const keys: AdditionalDataBlockKey[] = [
			'hp',
			'dcs',
			'initiative',
			'adjustment',
		];

		return keys.filter((key) =>
			resolvedSlots.some((slot) => hasAdditionalBlock(slot, key))
		);
	}, [resolvedSlots]);

	const templateShadowVariants = templateId
		? (encounterTemplates.find((t) => t.id === templateId)?.variants ?? [])
		: [];

	const onSubmit = (values: BuilderFormValues) => {
		const encounter = toConcreteEncounter(values, activeEncounterId);

		if (activeEncounterId) {
			updateEncounter(activeEncounterId, encounter);
		} else {
			addEncounter(encounter);
			setActiveEncounterId(encounter.id);
			navigate({
				to: '/builder',
				search: { encounterId: encounter.id },
				replace: true,
			});
		}
		setSavedEncounter(encounter);
	};

	const onDelete = () => {
		if (!activeEncounterId) return;

		const confirmed = window.confirm(
			'This will permanently remove this saved encounter. Continue?'
		);

		if (!confirmed) return;

		removeEncounter(activeEncounterId);
		navigate({ to: '/encounters' });
	};

	const renderSlotRows = (indices: number[], allowedTypes: SlotType[]) => {
		if (indices.length === 0) {
			return (
				<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground flex">
					No entries in this section yet.
				</div>
			);
		}

		return indices.map((slotIndex) => {
			const field = fields[slotIndex];

			if (!field) {
				return null;
			}

			return (
				<SlotRow
					key={field.id}
					index={slotIndex}
					form={form}
					remove={remove}
					update={update}
					allowedTypes={allowedTypes}
					usedAdditionalDataBlocks={usedAdditionalDataBlocks}
				/>
			);
		});
	};

	return (
		<Form {...form}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4"
			>
				<section className="sticky top-0 z-20 space-y-2 rounded-md border bg-background/95 p-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
					<h2 className="mb-2 text-xl font-semibold">Encounter Builder</h2>
					<h3 className="mb-2 text-sm font-medium">Encounter Threat</h3>
					<ThreatTracker
						budget={xpUsage.effectiveXp}
						comparisonBudget={xpUsage.rawXp}
						primaryBudgetLabel="Effective XP"
						comparisonBudgetLabel="Raw XP"
						partySize={safePartySize}
						waveInteraction={xpUsage.waveInteraction}
						simulation={xpUsage.simulation}
					/>
					<div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
						<span className="rounded border px-2 py-1">
							Effective: {xpUsage.effectiveXp.valueOf()} XP
						</span>
						<span className="rounded border px-2 py-1">
							Raw: {xpUsage.rawXp.valueOf()} XP
						</span>
						<span className="rounded border px-2 py-1">
							Wave 1 base XP: {xpUsage.effectiveReinforcementXp.valueOf()} /{' '}
							{xpUsage.rawReinforcementXp.valueOf()} XP
						</span>
					</div>
				</section>

				<Tabs defaultValue="details" className="w-full space-y-4">
					<TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-md bg-muted/50 p-1">
						<TabsTrigger value="details">Details</TabsTrigger>
						<TabsTrigger value="participants">
							Participants ({participantSummary.count})
						</TabsTrigger>
						<TabsTrigger value="events">
							Events ({eventSummary.count})
						</TabsTrigger>
						<TabsTrigger value="variants">
							Variants ({variants.length})
						</TabsTrigger>
					</TabsList>

					<TabsContent value="details" className="space-y-3">
						<section>
							<h3 className="mb-2 text-sm font-medium">Encounter Details</h3>
							<div className="space-y-3">
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>Encounter Name</FormLabel>
											<FormControl>
												<Input
													placeholder="Training Grounds"
													type="text"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className="grid grid-cols-2 gap-3">
									<FormField
										control={form.control}
										name="partyLevel"
										render={({ field }) => (
											<FormItem className="space-y-1">
												<FormLabel>Party Level</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														max={20}
														value={field.value ?? ''}
														onChange={(event) => {
															const value = event.target.value;
															field.onChange(
																value === '' ? undefined : Number(value)
															);
														}}
														onBlur={field.onBlur}
														name={field.name}
														ref={field.ref}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="partySize"
										render={({ field }) => (
											<FormItem className="space-y-1">
												<FormLabel>Party Size</FormLabel>
												<FormControl>
													<Input
														type="number"
														min={1}
														value={field.value ?? ''}
														onChange={(event) => {
															const value = event.target.value;
															field.onChange(
																value === '' ? undefined : Number(value)
															);
														}}
														onBlur={field.onBlur}
														name={field.name}
														ref={field.ref}
													/>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>Description</FormLabel>
											<FormControl>
												<textarea
													className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													placeholder="Brief setup description..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="gmNotes"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>GM Notes</FormLabel>
											<FormControl>
												<textarea
													className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													placeholder="Private GM information..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="monsterNotes"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>Monster Notes</FormLabel>
											<FormControl>
												<textarea
													className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													placeholder="Information for monster side..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="playerNotes"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>Player Notes</FormLabel>
											<FormControl>
												<textarea
													className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
													placeholder="Information for players..."
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</section>
					</TabsContent>

					<TabsContent value="participants" className="space-y-3">
						<section className="min-w-0 space-y-3">
							<div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-medium">Participants</h3>
									<span className="text-xs text-muted-foreground">
										{participantSummary.count} total
									</span>
								</div>
								<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<span>{participantSummary.breakdown}</span>
									<span>Levels: {participantSummary.values}</span>
								</div>
							</div>
							<div className="mb-3 flex justify-end">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => append(defaultSlot())}
								>
									Add Participant
								</Button>
							</div>
							<div className="w-full space-y-2">
								{renderSlotRows(participantIndices, PARTICIPANT_SLOT_TYPES)}
							</div>
						</section>
					</TabsContent>

					<TabsContent value="events" className="space-y-3">
						<section className="min-w-0 space-y-3">
							<div className="flex min-w-0 flex-1 flex-col gap-1 pr-2">
								<div className="flex items-center justify-between gap-3">
									<h3 className="text-sm font-medium">Events</h3>
									<span className="text-xs text-muted-foreground">
										{eventSummary.count} total
									</span>
								</div>
								<div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
									<span>{eventSummary.breakdown}</span>
									<span>Accomplishment tiers: {eventSummary.values}</span>
								</div>
							</div>
							<div className="mb-3 flex justify-end">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() =>
										append({
											...defaultSlot(),
											type: 'narrative',
										})
									}
								>
									Add Event
								</Button>
							</div>
							<div className="w-full space-y-2">
								{renderSlotRows(eventIndices, EVENT_SLOT_TYPES)}
							</div>
						</section>
					</TabsContent>

					<TabsContent value="variants" className="space-y-4">
						<section className="space-y-3">
							<div className="flex items-center justify-between gap-3">
								<div>
									<h3 className="text-sm font-medium">Saved Variants</h3>
									<p className="text-xs text-muted-foreground">
										Snapshot the current builder state as a reusable variant.
									</p>
								</div>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										const label =
											window.prompt(
												'Variant description:',
												`Variant ${variants.length + 1} (${safePartySize} players, level ${safePartyLevel})`
											) ?? `Variant ${variants.length + 1}`;
										const snapshot: BuilderVariantSnapshot = {
											id: uuidv4(),
											description: label,
											partyLevel: safePartyLevel,
											partySize: safePartySize,
											slots: form.getValues('slots').map((s) => ({ ...s })),
										};
										form.setValue('variants', [...variants, snapshot], {
											shouldDirty: true,
										});
									}}
								>
									Create Variant
								</Button>
							</div>

							{variants.length === 0 ? (
								<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
									No variants saved yet. Create one to store a reusable
									snapshot.
								</div>
							) : (
								<div className="space-y-2">
									{variants.map((snapshot, idx) => (
										<div
											key={snapshot.id}
											className="rounded-md border p-3 space-y-2"
										>
											<div className="flex items-center gap-2">
												<Input
													className="h-7 text-sm"
													value={snapshot.description}
													onChange={(e) => {
														const updated = variants.map((v, i) =>
															i === idx
																? { ...v, description: e.target.value }
																: v
														);
														form.setValue('variants', updated, {
															shouldDirty: true,
														});
													}}
												/>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													title="Restore this snapshot"
													onClick={() => {
														const confirmed = window.confirm(
															`Restore "${snapshot.description}"? This will overwrite the current party size, party level, and participants.`
														);

														if (!confirmed) return;
														form.setValue('partyLevel', snapshot.partyLevel, {
															shouldDirty: true,
														});
														form.setValue('partySize', snapshot.partySize, {
															shouldDirty: true,
														});
														form.setValue(
															'slots',
															snapshot.slots.map((s) => ({ ...s })),
															{ shouldDirty: true }
														);
													}}
												>
													<RotateCcw className="h-4 w-4" />
												</Button>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													title="Remove variant"
													onClick={() => {
														const updated = variants.filter(
															(_, i) => i !== idx
														);
														form.setValue('variants', updated, {
															shouldDirty: true,
														});
													}}
												>
													<Trash2 className="h-4 w-4 text-destructive" />
												</Button>
											</div>
											<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
												<span className="rounded border px-2 py-1">
													Party size: {snapshot.partySize}
												</span>
												<span className="rounded border px-2 py-1">
													Party level: {snapshot.partyLevel}
												</span>
												<span className="rounded border px-2 py-1">
													Participants:{' '}
													{
														snapshot.slots.filter(
															(s) =>
																s.type === 'creature' || s.type === 'hazard'
														).length
													}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</section>

						{templateShadowVariants.length > 0 && (
							<section className="space-y-3">
								<div>
									<h3 className="text-sm font-medium text-muted-foreground">
										From template
									</h3>
									<p className="text-xs text-muted-foreground">
										These are the original template variants. Load one to apply
										it to the current form, or load and save to create a
										concrete variant snapshot.
									</p>
								</div>
								<div className="space-y-2">
									{templateShadowVariants.map((tv) => {
										const isCurrentVariant = tv.id === templateVariantId;

										return (
											<div
												key={tv.id}
												className="rounded-md border border-dashed bg-muted/30 p-3 space-y-2"
											>
												<div className="flex items-center justify-between gap-2">
													<span className="text-sm text-muted-foreground italic">
														{tv.description ?? `Party of ${tv.partySize}`}
														{isCurrentVariant ? ' (current)' : ''}
													</span>
													<div className="flex gap-1">
														<Button
															type="button"
															variant="outline"
															size="sm"
															className="text-xs"
															onClick={() => {
																const partial = templateVariantToFormPartial(
																	tv,
																	safePartyLevel
																);
																form.setValue('partySize', partial.partySize, {
																	shouldDirty: true,
																});
																form.setValue('slots', partial.slots, {
																	shouldDirty: true,
																});
															}}
														>
															Load
														</Button>
														<Button
															type="button"
															variant="outline"
															size="sm"
															className="text-xs"
															onClick={() => {
																const partial = templateVariantToFormPartial(
																	tv,
																	safePartyLevel
																);
																form.setValue('partySize', partial.partySize, {
																	shouldDirty: true,
																});
																form.setValue('slots', partial.slots, {
																	shouldDirty: true,
																});
																const label =
																	window.prompt(
																		'Variant description:',
																		tv.description ?? `Party of ${tv.partySize}`
																	) ??
																	tv.description ??
																	`Party of ${tv.partySize}`;
																const snapshot: BuilderVariantSnapshot = {
																	id: uuidv4(),
																	description: label,
																	partyLevel: safePartyLevel,
																	partySize: partial.partySize,
																	slots: partial.slots.map((s) => ({ ...s })),
																};
																form.setValue(
																	'variants',
																	[...form.getValues('variants'), snapshot],
																	{ shouldDirty: true }
																);
															}}
														>
															Load &amp; Save
														</Button>
													</div>
												</div>
												<div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
													<span className="rounded border border-dashed px-2 py-1">
														Party size: {tv.partySize}
													</span>
													{tv.partyLevel && (
														<span className="rounded border border-dashed px-2 py-1">
															Party level: {tv.partyLevel}
														</span>
													)}
													<span className="rounded border border-dashed px-2 py-1">
														Participants: {tv.participants.length}
													</span>
												</div>
											</div>
										);
									})}
								</div>
							</section>
						)}
					</TabsContent>
				</Tabs>

				<div className="sticky bottom-0 z-20 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
					<div className="mx-auto flex w-full max-w-7xl justify-end gap-2">
						{activeEncounterId ? (
							<Button
								type="button"
								variant="destructive"
								onClick={onDelete}
								disabled={formState.isSubmitting}
							>
								Delete Encounter
							</Button>
						) : null}
						<Button type="submit" disabled={formState.isSubmitting}>
							{activeEncounterId ? 'Update Encounter' : 'Save Encounter'}
						</Button>
					</div>
				</div>

				<SaveSuccessModal
					encounter={savedEncounter}
					onClose={() => setSavedEncounter(null)}
				/>
			</form>
		</Form>
	);
}
