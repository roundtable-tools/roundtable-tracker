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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSavedEncountersStore } from '@/store/savedEncounterInstance';
import { useSavedEncountersStore } from '@/store/savedEncounterInstance';
import { ALIGNMENT, type ConcreteEncounter, type Alignment } from '@/store/data';
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
import {
	CalendarClock,
	ChevronRight,
	Eye,
	Layers3,
	RotateCcw,
	Trash2,
	Users,
	Info,
} from 'lucide-react';
import {
	getEventSectionSummary,
	getParticipantSectionSummary,
	getSlotSectionIndices,
} from './slotSections';
import { PartyLevelPicker } from './PartyLevelPicker';
import { PartySizePicker } from './PartySizePicker';
import { cn } from '@/lib/utils';
import { BuilderPreviewTab } from './BuilderPreviewTab';
import { ParagraphFields } from './ParagraphFields.tsx';
import { BuilderListLayout } from './BuilderListLayout';

const NOTE_VISIBILITY_OPTIONS: Array<{
	value: 'all' | Alignment;
	label: string;
}> = [
	{ value: 'all', label: 'General (Visible to all)' },
	{ value: ALIGNMENT.Opponents, label: 'Opponents' },
	{ value: ALIGNMENT.PCs, label: 'Allies' },
	{ value: ALIGNMENT.Neutral, label: 'Other' },
];

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
	type BuilderStep =
		| 'details'
		| 'participants'
		| 'events'
		| 'variants'
		| 'preview';
	const stepOrder: BuilderStep[] = [
		'details',
		'participants',
		'events',
		'variants',
		'preview',
	];

	const navigate = useNavigate();
	const [activeTab, setActiveTab] = useState<BuilderStep>('details');
	const [activeNotesTab, setActiveNotesTab] = useState<string>('');
	const [activeParticipantItemId, setActiveParticipantItemId] =
		useState<string>('');
	const [activeEventItemId, setActiveEventItemId] = useState<string>('');
	const [activeVariantItemId, setActiveVariantItemId] = useState<string>('');
	const [activeTemplateVariantItemId, setActiveTemplateVariantItemId] =
		useState<string>('');
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
	const {
		fields: noteFields,
		append: appendNote,
		remove: removeNote,
	} = useFieldArray({
		control,
		name: 'notes',
	});

	const slots = useWatch({ control, name: 'slots' });
	const notes = useWatch({ control, name: 'notes' }) ?? [];
	const partyLevel = useWatch({ control, name: 'partyLevel' });
	const partySize = useWatch({ control, name: 'partySize' });

	useEffect(() => {
		if (notes.length === 0) {
			setActiveNotesTab('');

			return;
		}

		const hasActiveTab = notes.some((note) => note.id === activeNotesTab);

		if (!hasActiveTab) {
			setActiveNotesTab(notes[0].id);
		}
	}, [notes, activeNotesTab]);

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
	const participantItems = participantIndices
		.map((slotIndex) => {
			const field = fields[slotIndex];

			if (!field) {
				return null;
			}

			return {
				id: field.id,
				slotIndex,
			};
		})
		.filter((item): item is { id: string; slotIndex: number } => item !== null);
	const eventItems = eventIndices
		.map((slotIndex) => {
			const field = fields[slotIndex];

			if (!field) {
				return null;
			}

			return {
				id: field.id,
				slotIndex,
			};
		})
		.filter((item): item is { id: string; slotIndex: number } => item !== null);
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

	useEffect(() => {
		if (participantItems.length === 0) {
			setActiveParticipantItemId('');

			return;
		}

		const hasActiveItem = participantItems.some(
			(item) => item.id === activeParticipantItemId
		);

		if (!hasActiveItem) {
			setActiveParticipantItemId(participantItems[0].id);
		}
	}, [participantItems, activeParticipantItemId]);

	useEffect(() => {
		if (eventItems.length === 0) {
			setActiveEventItemId('');

			return;
		}

		const hasActiveItem = eventItems.some(
			(item) => item.id === activeEventItemId
		);

		if (!hasActiveItem) {
			setActiveEventItemId(eventItems[0].id);
		}
	}, [eventItems, activeEventItemId]);

	useEffect(() => {
		if (variants.length === 0) {
			setActiveVariantItemId('');

			return;
		}

		const hasActiveItem = variants.some(
			(variant) => variant.id === activeVariantItemId
		);

		if (!hasActiveItem) {
			setActiveVariantItemId(variants[0].id);
		}
	}, [variants, activeVariantItemId]);

	useEffect(() => {
		if (templateShadowVariants.length === 0) {
			setActiveTemplateVariantItemId('');

			return;
		}

		const hasActiveItem = templateShadowVariants.some(
			(variant) => variant.id === activeTemplateVariantItemId
		);

		if (!hasActiveItem) {
			setActiveTemplateVariantItemId(templateShadowVariants[0].id);
		}
	}, [templateShadowVariants, activeTemplateVariantItemId]);

	const activeStepIndex = stepOrder.indexOf(activeTab);
	const isPreviousStep = (step: BuilderStep) =>
		stepOrder.indexOf(step) < activeStepIndex;

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

	const renderNoteEditor = (
		noteFieldId: string,
		index: number,
		presentation: 'tabs' | 'grid' | 'list'
	) => (
		<div
			key={noteFieldId}
			className={cn(
				'space-y-3 rounded-md border p-3',
				presentation === 'tabs' && 'border-none p-0',
				presentation === 'list' && 'rounded-none border-none p-0'
			)}
		>
			<ParagraphFields
				control={form.control}
				label="Note Details"
				fieldNames={[
					`notes.${index}.header` as const,
					`notes.${index}.content` as const,
				]}
				placeholders={['Note Header', 'Note Content']}
			/>
			<FormField
				control={form.control}
				name={`notes.${index}.visibility` as const}
				render={({ field }) => (
					<FormItem className="space-y-1">
						<FormLabel>Visibility</FormLabel>
						<FormControl>
							<Select
								value={String(field.value ?? 'all')}
								onValueChange={(value) => {
									if (value === 'all') {
										field.onChange('all');

										return;
									}

									field.onChange(Number(value) as Alignment);
								}}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{NOTE_VISIBILITY_OPTIONS.map((option) => (
										<SelectItem
											key={String(option.value)}
											value={String(option.value)}
										>
											{option.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</FormControl>
					</FormItem>
				)}
			/>
			<div className="flex justify-end">
				<Button
					type="button"
					variant="ghost"
					size="sm"
					onClick={() => removeNote(index)}
				>
					Remove Note
				</Button>
			</div>
		</div>
	);

	return (
		<Form {...form}>
			<form
				onSubmit={handleSubmit(onSubmit)}
				className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-4"
			>
				<Tabs
					value={activeTab}
					onValueChange={(value) => setActiveTab(value as BuilderStep)}
					className="w-full space-y-4"
				>
					<TabsList className="sticky top-0 z-20 h-auto w-full flex-wrap justify-start gap-2 rounded-md bg-muted p-1 row">
						<section className="w-full rounded-md border bg-background p-3 backdrop-blur supports-[backdrop-filter]:bg-background/85">
							<h2 className="mb-2 text-xl font-semibold">Encounter Threat</h2>
							<ThreatTracker
								budget={xpUsage.effectiveXp}
								comparisonBudget={xpUsage.rawXp}
								primaryBudgetLabel="Effective XP"
								comparisonBudgetLabel="Raw XP"
								partySize={safePartySize}
								waveInteraction={xpUsage.waveInteraction}
								simulation={xpUsage.simulation}
							/>
						</section>
						<div className="h-auto w-full flex flex-wrap justify-start gap-2 ">
							<TabsTrigger
								value="details"
								className={cn(
									'gap-1.5',
									isPreviousStep('details') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<Info className="h-4 w-4" aria-hidden="true" />
								<span>Details</span>
							</TabsTrigger>
							<ChevronRight
								className="h-4 w-4 text-muted-foreground self-center"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="participants"
								className={cn(
									'gap-1.5',
									isPreviousStep('participants') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<Users className="h-4 w-4" aria-hidden="true" />
								Participants ({participantSummary.count})
							</TabsTrigger>
							<ChevronRight
								className="h-4 w-4 text-muted-foreground self-center"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="events"
								className={cn(
									'gap-1.5',
									isPreviousStep('events') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<CalendarClock className="h-4 w-4" aria-hidden="true" />
								Events ({eventSummary.count})
							</TabsTrigger>
							<ChevronRight
								className="h-4 w-4 text-muted-foreground self-center"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="variants"
								className={cn(
									'gap-1.5',
									isPreviousStep('variants') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<Layers3 className="h-4 w-4" aria-hidden="true" />
								Variants ({variants.length})
							</TabsTrigger>
							<ChevronRight
								className="h-4 w-4 self-center text-muted-foreground"
								aria-hidden="true"
							/>
							<TabsTrigger value="preview" className="gap-1.5">
								<Eye className="h-4 w-4" aria-hidden="true" />
								<span>Preview</span>
							</TabsTrigger>
						</div>
					</TabsList>

					<TabsContent value="details" className="space-y-3">
						<section className="space-y-3">
							<div className="space-y-2">
								<div className="flex flex-wrap items-start gap-3 sm:flex-nowrap">
									<FormField
										control={form.control}
										name="partyLevel"
										render={({ field }) => (
											<FormItem className="min-w-0 flex-1 space-y-1">
												<FormLabel>Party Level</FormLabel>
												<FormControl>
													<PartyLevelPicker
														value={field.value}
														onChange={field.onChange}
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
											<FormItem className="w-fit shrink-0 space-y-1">
												<FormLabel>Party Size</FormLabel>
												<FormControl>
													<PartySizePicker
														value={field.value}
														onChange={field.onChange}
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
								<ParagraphFields 
									control={form.control} 
									label="Encounter Name and Description" 
									fieldNames={['name', 'description']} 
									placeholders={['Training Grounds', 'Brief setup description...']} 
								/>
								</div>
								<div className="space-y-2">
									<BuilderListLayout
										label="Notes"
										allowedLayouts={['compact-tabs', 'list', 'wide-grid']}
										items={noteFields}
										getItemId={(noteField, index) => notes[index]?.id ?? noteField.id}
										getItemLabel={(_, index) => {
											const note = notes[index];

											return note?.header?.trim().length
												? note.header
												: `Note ${index + 1}`;
										}}
										renderItem={(_, index, layout) => (
											renderNoteEditor(
												noteFields[index].id,
												index,
												layout.presentation
											)
										)}
										emptyState={
											<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
												No notes yet. Add a note tab to capture encounter context.
											</div>
										}
										activeItemId={activeNotesTab}
										onActiveItemIdChange={setActiveNotesTab}
										getContentClassName={(layout) =>
											layout.presentation === 'list'
												? 'overflow-hidden rounded-md border bg-card divide-y'
												: undefined
										}
										getItemClassName={(layout) =>
											layout.presentation === 'list' ? 'p-3' : undefined
										}
										toolbarActions={
											<Button
												type="button"
												variant="outline"
												size="sm"
												onClick={() => {
													const nextIndex = notes.length + 1;
													const nextId = uuidv4();
													appendNote({
														id: nextId,
														header: `Note ${nextIndex}`,
														content: '',
														visibility: 'all',
													});
													setActiveNotesTab(nextId);
												}}
											>
												Add Note
											</Button>
										}
									/>
								</div>
						</section>
					</TabsContent>

					<TabsContent value="participants" className="space-y-3">
						<section className="space-y-3">
							<BuilderListLayout
								label="Participants"
								allowedLayouts={[
									'compact-tabs',
									'wide-tabs',
									'list',
								]}
								items={participantItems}
								getItemId={(item) => item.id}
								getItemLabel={(item, index) => {
									const slot = resolvedSlots[item.slotIndex];

									return slot?.name?.trim().length
										? slot.name
										: `Participant ${index + 1}`;
								}}
								renderItem={(item) => (
									<SlotRow
										index={item.slotIndex}
										form={form}
										remove={remove}
										update={update}
										allowedTypes={PARTICIPANT_SLOT_TYPES}
										usedAdditionalDataBlocks={usedAdditionalDataBlocks}
									/>
								)}
								emptyState={
									<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground flex">
										No entries in this section yet.
									</div>
								}
								activeItemId={activeParticipantItemId}
								onActiveItemIdChange={setActiveParticipantItemId}
								toolbarActions={
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => append(defaultSlot())}
									>
										Add Participant
									</Button>
								}
							/>
						</section>
					</TabsContent>

					<TabsContent value="events" className="space-y-3">
						<section className="space-y-3">
							<BuilderListLayout
								label="Events"
								allowedLayouts={[
									'compact-tabs',
									'wide-tabs',
									'list',
								]}
								items={eventItems}
								getItemId={(item) => item.id}
								getItemLabel={(item, index) => {
									const slot = resolvedSlots[item.slotIndex];

									return slot?.name?.trim().length
										? slot.name
										: `Event ${index + 1}`;
								}}
								renderItem={(item) => (
									<SlotRow
										index={item.slotIndex}
										form={form}
										remove={remove}
										update={update}
										allowedTypes={EVENT_SLOT_TYPES}
										usedAdditionalDataBlocks={usedAdditionalDataBlocks}
									/>
								)}
								emptyState={
									<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground flex">
										No entries in this section yet.
									</div>
								}
								activeItemId={activeEventItemId}
								onActiveItemIdChange={setActiveEventItemId}
								toolbarActions={
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
								}
							/>
						</section>
					</TabsContent>

					<TabsContent value="variants" className="space-y-4">
						<section className="space-y-3">
							<p className="text-xs text-muted-foreground">
								Snapshot the current builder state as a reusable variant.
							</p>
							<BuilderListLayout
								label="Saved variants"
								allowedLayouts={[
									'compact-tabs',
									'wide-tabs',
									'compact-grid',
									'wide-grid',
									'list',
								]}
								items={variants}
								getItemId={(snapshot) => snapshot.id}
								getItemLabel={(snapshot, index) =>
									snapshot.description?.trim().length
										? snapshot.description
										: `Variant ${index + 1}`
								}
								renderItem={(snapshot, idx) => (
									<div className="rounded-md border p-3 space-y-2">
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
													const updated = variants.filter((_, i) => i !== idx);
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
														(s) => s.type === 'creature' || s.type === 'hazard'
													).length
												}
											</span>
										</div>
									</div>
								)}
								emptyState={
									<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
										No variants saved yet. Create one to store a reusable
										snapshot.
									</div>
								}
								activeItemId={activeVariantItemId}
								onActiveItemIdChange={setActiveVariantItemId}
								toolbarActions={
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
											setActiveVariantItemId(snapshot.id);
										}}
									>
										Create Variant
									</Button>
								}
							/>
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
								<BuilderListLayout
									label="Template variants"
									allowedLayouts={['compact-tabs', 'wide-tabs', 'wide-grid', 'list']}
									items={templateShadowVariants}
									getItemId={(variant) => variant.id}
									getItemLabel={(variant, index) =>
										variant.description?.trim().length
											? variant.description
											: `Template Variant ${index + 1}`
									}
									renderItem={(tv) => {
										const isCurrentVariant = tv.id === templateVariantId;

										return (
											<div className="rounded-md border border-dashed bg-muted/30 p-3 space-y-2">
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
																setActiveVariantItemId(snapshot.id);
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
									}}
									emptyState={
										<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
											No template variants available.
										</div>
									}
									activeItemId={activeTemplateVariantItemId}
									onActiveItemIdChange={setActiveTemplateVariantItemId}
								/>
							</section>
						)}
					</TabsContent>

					<TabsContent value="preview" className="space-y-4">
						<BuilderPreviewTab
							control={control}
							templateVariants={templateShadowVariants}
							attritionRatePercent={attritionRatePercent}
							maxRounds={maxRounds}
							basePartyOutputPerRound={basePartyOutputPerRound}
						/>
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
