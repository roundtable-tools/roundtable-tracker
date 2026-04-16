import { useState, useEffect } from 'react';
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
import { EVENT_SLOT_TYPES, PARTICIPANT_SLOT_TYPES, SlotRow } from './SlotRow';
import { SaveSuccessModal } from './SaveSuccessModal';
import { computeEncounterXpUsage, type SlotType } from './builderXp';
import { useNavigate } from '@tanstack/react-router';
import {
	defaultFormValues,
	defaultSlot,
	fromEncounterTemplate,
	fromConcreteEncounter,
	toConcreteEncounter,
	type BuilderFormValues,
} from './builderConvert';
import {
	getEventSectionSummary,
	getParticipantSectionSummary,
	getSlotSectionIndices,
} from './slotSections';

interface BuilderPageProps {
	encounterId?: string;
	templateId?: string;
	templateLevel?: number;
	templatePartySize?: number;
}

export function BuilderPage({
	encounterId,
	templateId,
	templateLevel,
	templatePartySize,
}: BuilderPageProps) {
	const navigate = useNavigate();
	const [activeEncounterId, setActiveEncounterId] = useState<string | undefined>(
		encounterId
	);
	const [savedEncounter, setSavedEncounter] =
		useState<ConcreteEncounter | null>(null);
	const [showAdvancedThreatOptions, setShowAdvancedThreatOptions] =
		useState(false);
	const [attritionRatePercent, setAttritionRatePercent] = useState(5);
	const [maxRounds, setMaxRounds] = useState(20);
	const [basePartyOutputPerRound, setBasePartyOutputPerRound] = useState(20);

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

	// Initialize from template when templateId is provided and no encounterId
	useEffect(() => {
		if (!templateId || activeEncounterId) return;

		const template = encounterTemplates.find((t) => t.id === templateId);

		if (!template) {
			console.warn(`Template ${templateId} not found`);

			return;
		}

		// Initialize form with template defaults
		const defaultVariant = template.variants.find(
			(v) => v.id === template.defaultVariantId
		);

		if (!defaultVariant) {
			console.warn(
				`Default variant ${template.defaultVariantId} not found in template ${templateId}`
			);

			return;
		}

		const initialFormValues: BuilderFormValues = fromEncounterTemplate(
			template,
			defaultVariant,
			{
				partyLevel: templateLevel,
				partySize: templatePartySize,
			}
		);

		reset(initialFormValues);
	}, [templateId, activeEncounterId, templateLevel, templatePartySize, reset]);

	const safePartyLevel =
		typeof partyLevel === 'number' && Number.isFinite(partyLevel)
			? partyLevel
			: 1;
	const safePartySize =
		typeof partySize === 'number' && Number.isFinite(partySize) && partySize > 0
			? partySize
			: 4;
	const xpUsage = computeEncounterXpUsage(slots ?? [], safePartyLevel, safePartySize, {
		attritionRate: Math.max(0, attritionRatePercent) / 100,
		maxRounds: Math.max(1, maxRounds),
		basePartyOutputPerRound: Math.max(0, basePartyOutputPerRound),
	});
	const resolvedSlots = slots ?? [];
	const participantIndices = getSlotSectionIndices(resolvedSlots, 'participants');
	const eventIndices = getSlotSectionIndices(resolvedSlots, 'events');
	const participantSummary = getParticipantSectionSummary(resolvedSlots);
	const eventSummary = getEventSectionSummary(resolvedSlots);

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

					<Button
						type="button"
						variant="outline"
						size="sm"
						className="mt-3"
						onClick={() =>
							setShowAdvancedThreatOptions((current) => !current)
						}
					>
						{showAdvancedThreatOptions
							? 'Hide Optional Threat Settings'
							: 'Show Optional Threat Settings'}
					</Button>

					{showAdvancedThreatOptions ? (
						<div className="mt-2 grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-3">
							<div className="grid items-center gap-1">
								<FormLabel className="text-xs">Attrition Rate (%)</FormLabel>
								<Input
									type="number"
									min={0}
									max={100}
									value={attritionRatePercent}
									onChange={(event) =>
										setAttritionRatePercent(Number(event.target.value || 0))
									}
								/>
							</div>
							<div className="grid items-center gap-1">
								<FormLabel className="text-xs">Max Rounds</FormLabel>
								<Input
									type="number"
									min={1}
									value={maxRounds}
									onChange={(event) => setMaxRounds(Number(event.target.value || 1))}
								/>
							</div>
							<div className="grid items-center gap-1">
								<FormLabel className="text-xs">Party Output / Round</FormLabel>
								<Input
									type="number"
									min={0}
									value={basePartyOutputPerRound}
									onChange={(event) =>
										setBasePartyOutputPerRound(Number(event.target.value || 0))
									}
								/>
							</div>
						</div>
					) : null}
				</section>

				<Tabs defaultValue="details" className="w-full space-y-4">
					<TabsList className="h-auto w-full flex-wrap justify-start gap-2 rounded-md bg-muted/50 p-1">
						<TabsTrigger value="details">Details</TabsTrigger>
						<TabsTrigger value="participants">Participants ({participantSummary.count})</TabsTrigger>
						<TabsTrigger value="events">Events ({eventSummary.count})</TabsTrigger>
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
												<Input placeholder="Training Grounds" type="text" {...field} />
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
															field.onChange(value === '' ? undefined : Number(value));
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
															field.onChange(value === '' ? undefined : Number(value));
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

							<details className="mt-2 rounded-md border p-2 text-xs">
								<summary className="cursor-pointer font-medium">Show XP Math</summary>
								<div className="mt-2 space-y-1 text-muted-foreground">
									<p>
										Per-round output: {(
											xpUsage.config.basePartyOutputPerRound *
											(safePartySize / 4)
										).toFixed(1)}{' '}
										XP | Attrition rate: {(xpUsage.config.attritionRate * 100).toFixed(0)}%
										 | Max rounds: {xpUsage.config.maxRounds}
									</p>
									{xpUsage.waveInteraction.wave1 ? (
										<p>
											Round diff: {xpUsage.waveInteraction.roundDiff} | Threshold:{' '}
											{xpUsage.waveInteraction.roundDiffThreshold}{' '}
											{xpUsage.waveInteraction.affectsOtherWave
												? '(waves interact)'
												: '(no interaction)'}
										</p>
									) : null}
									<p>Immediate XP: {xpUsage.immediateXp.valueOf()}</p>
								</div>
							</details>
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
