import { useState, useEffect, useMemo, useRef } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSavedEncountersStore } from '@/store/savedEncounterInstance';
import { useSavedEncountersStore } from '@/store/savedEncounterInstance';
import { type ConcreteEncounter } from '@/store/data';
import encounterTemplates from '@/store/Encounters/migratedEncounterTemplates';
import { ThreatTracker } from './ThreatTracker';
import type { AdditionalDataBlockKey } from './SlotRow.tsx';
import { SaveSuccessModal } from './SaveSuccessModal';
import { computeEncounterXpUsage } from './builderXp';
import { useNavigate } from '@tanstack/react-router';
import {
	deleteImportedEncounterDraft,
	getImportedEncounterDraft,
} from '@/store/importedEncounterDraft';
import {
	defaultFormValues,
	fromEncounterTemplate,
	fromConcreteEncounter,
	toConcreteEncounter,
	type BuilderFormValues,
} from './builderConvert';
import {
	CalendarClock,
	ChevronRight,
	Eye,
	Layers3,
	Users,
	Info,
} from 'lucide-react';
import {
	getEventSectionSummary,
	getParticipantSectionSummary,
	getSlotSectionIndices,
} from './slotSections';
import { cn } from '@/lib/utils';
import type { BuilderListLayoutKey } from './BuilderListLayout';
import { useSavedPartiesStore } from '@/store/savedPartiesInstance';
import {
	challengePointsFromLevelDelta,
	normalizePartySetup,
} from '@/models/utility/challengePoints/challengePoints';
import { BuilderDetailsStep } from './steps/BuilderDetailsStep';
import { BuilderParticipantsStep } from './steps/BuilderParticipantsStep';
import { BuilderEventsStep } from './steps/BuilderEventsStep';
import { BuilderVariantsStep } from './steps/BuilderVariantsStep';
import { BuilderPreviewStep } from './steps/BuilderPreviewStep';

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
	const [sectionLayoutKeys, setSectionLayoutKeys] = useState<
		Partial<
			Record<
				'notes' | 'participants' | 'events' | 'variants' | 'templateVariants',
				BuilderListLayoutKey
			>
		>
	>({});
	const setSectionLayoutKey = (
		section:
			| 'notes'
			| 'participants'
			| 'events'
			| 'variants'
			| 'templateVariants',
		key: BuilderListLayoutKey
	) => {
		setSectionLayoutKeys((current) => {
			if (current[section] === key) {
				return current;
			}

			return {
				...current,
				[section]: key,
			};
		});
	};
	const previousNoteIdsRef = useRef<string[]>([]);
	const previousParticipantItemIdsRef = useRef<string[]>([]);
	const previousEventItemIdsRef = useRef<string[]>([]);
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
	const notesRaw = useWatch({ control, name: 'notes' });
	const notes = useMemo(() => notesRaw ?? [], [notesRaw]);
	const partyLevel = useWatch({ control, name: 'partyLevel' });
	const partySize = useWatch({ control, name: 'partySize' });
	const partySetupMode =
		useWatch({ control, name: 'partySetupMode' }) ?? 'simple';
	const specificPartyId = useWatch({ control, name: 'specificPartyId' });
	const specificPartyLevels =
		useWatch({ control, name: 'specificPartyLevels' }) ?? [];
	const challengePointTierStart =
		useWatch({ control, name: 'challengePointTierStart' }) ?? 1;
	const challengePointBudget =
		useWatch({ control, name: 'challengePointBudget' }) ?? 0;
	const savedParties = useSavedPartiesStore((state) => state.parties);
	const selectedSavedParty = useMemo(
		() =>
			typeof specificPartyId === 'string' && specificPartyId.length > 0
				? savedParties.find((party) => party.id === specificPartyId)
				: undefined,
		[specificPartyId, savedParties]
	);
	const resolvedSpecificPartyLevels = selectedSavedParty
		? selectedSavedParty.members.map((member) => member.level)
		: specificPartyLevels;
	const normalizedPartySetup = useMemo(
		() =>
			normalizePartySetup({
				mode: partySetupMode,
				simplePartyLevel: partyLevel ?? 1,
				simplePartySize: partySize ?? 4,
				specificPartyLevels: resolvedSpecificPartyLevels,
				challengePointTierStart,
				challengePointBudget,
			}),
		[
			partySetupMode,
			partyLevel,
			partySize,
			resolvedSpecificPartyLevels,
			challengePointTierStart,
			challengePointBudget,
		]
	);

	useEffect(() => {
		if (notes.length === 0) {
			setActiveNotesTab('');
			previousNoteIdsRef.current = [];

			return;
		}

		const currentNoteIds = notes.map((note) => note.id);
		const previousNoteIds = previousNoteIdsRef.current;
		const addedNoteId = currentNoteIds.find(
			(noteId) => !previousNoteIds.includes(noteId)
		);

		if (addedNoteId && activeNotesTab !== addedNoteId) {
			setActiveNotesTab(addedNoteId);
			previousNoteIdsRef.current = currentNoteIds;

			return;
		}

		const hasActiveTab = notes.some((note) => note.id === activeNotesTab);

		if (!hasActiveTab) {
			setActiveNotesTab(notes[0].id);
		}

		previousNoteIdsRef.current = currentNoteIds;
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

	const safePartyLevel = normalizedPartySetup.effectivePartyLevel;
	const safePartySize = normalizedPartySetup.effectivePartySize;
	const partyLevels = normalizedPartySetup.partyLevels;
	const partyRelativeLevels = partyLevels.map(
		(level) => level - safePartyLevel
	);
	const xpBasisLevel = safePartyLevel;
	const trackerPartySize = safePartySize;
	const rebasedChallengePointPerCharacter = partyRelativeLevels.map(
		(relative) => challengePointsFromLevelDelta(relative)
	);
	const rebasedChpDisplayMultiplier =
		rebasedChallengePointPerCharacter.length > 0
			? rebasedChallengePointPerCharacter.reduce(
					(sum, value) => sum + value,
					0
				) /
				(rebasedChallengePointPerCharacter.length * 2)
			: 1;
	const xpUsage = computeEncounterXpUsage(
		slots ?? [],
		xpBasisLevel,
		safePartySize,
		{
			attritionRate: Math.max(0, attritionRatePercent) / 100,
			maxRounds: Math.max(1, maxRounds),
			basePartyOutputPerRound: Math.max(0, basePartyOutputPerRound),
		}
	);
	const resolvedSlots = useMemo(() => slots ?? [], [slots]);
	const participantIndices = getSlotSectionIndices(
		resolvedSlots,
		'participants'
	);
	const eventIndices = getSlotSectionIndices(resolvedSlots, 'events');
	const participantSummary = getParticipantSectionSummary(resolvedSlots);
	const eventSummary = getEventSectionSummary(resolvedSlots);
	const variantsRaw = useWatch({ control, name: 'variants' });
	const variants = useMemo(() => variantsRaw ?? [], [variantsRaw]);
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

	const templateShadowVariants = useMemo(
		() =>
			templateId
				? (encounterTemplates.find((t) => t.id === templateId)?.variants ?? [])
				: [],
		[templateId]
	);

	useEffect(() => {
		if (participantItems.length === 0) {
			setActiveParticipantItemId('');
			previousParticipantItemIdsRef.current = [];

			return;
		}

		const currentParticipantItemIds = participantItems.map((item) => item.id);
		const previousParticipantItemIds = previousParticipantItemIdsRef.current;
		const addedParticipantItemId = currentParticipantItemIds.find(
			(itemId) => !previousParticipantItemIds.includes(itemId)
		);

		if (
			addedParticipantItemId &&
			activeParticipantItemId !== addedParticipantItemId
		) {
			setActiveParticipantItemId(addedParticipantItemId);
			previousParticipantItemIdsRef.current = currentParticipantItemIds;

			return;
		}

		const hasActiveItem = participantItems.some(
			(item) => item.id === activeParticipantItemId
		);

		if (!hasActiveItem) {
			setActiveParticipantItemId(participantItems[0].id);
		}

		previousParticipantItemIdsRef.current = currentParticipantItemIds;
	}, [participantItems, activeParticipantItemId]);

	useEffect(() => {
		if (eventItems.length === 0) {
			setActiveEventItemId('');
			previousEventItemIdsRef.current = [];

			return;
		}

		const currentEventItemIds = eventItems.map((item) => item.id);
		const previousEventItemIds = previousEventItemIdsRef.current;
		const addedEventItemId = currentEventItemIds.find(
			(itemId) => !previousEventItemIds.includes(itemId)
		);

		if (addedEventItemId && activeEventItemId !== addedEventItemId) {
			setActiveEventItemId(addedEventItemId);
			previousEventItemIdsRef.current = currentEventItemIds;

			return;
		}

		const hasActiveItem = eventItems.some(
			(item) => item.id === activeEventItemId
		);

		if (!hasActiveItem) {
			setActiveEventItemId(eventItems[0].id);
		}

		previousEventItemIdsRef.current = currentEventItemIds;
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
		const encounter = toConcreteEncounter(
			{
				...values,
				specificPartyLevels: resolvedSpecificPartyLevels,
				challengePointTierStart: normalizedPartySetup.challengePointBasisLevel,
				challengePointBudget: normalizedPartySetup.challengePointBudget,
				partyLevel: normalizedPartySetup.effectivePartyLevel,
				partySize: normalizedPartySetup.effectivePartySize,
			},
			activeEncounterId
		);

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
								rawXpBudget={xpUsage.rawXp}
								comparisonBudget={xpUsage.rawXp}
								primaryBudgetLabel="Effective XP"
								comparisonBudgetLabel="Raw XP"
								partySize={trackerPartySize}
								partyLevels={partyLevels}
								partyRelativeLevels={partyRelativeLevels}
								xpBasisLevel={xpBasisLevel}
								challengePointBasisLevel={
									normalizedPartySetup.challengePointBasisLevel
								}
								challengePointTierLabel={
									normalizedPartySetup.challengePointTierLabel
								}
								challengePointPerCharacter={rebasedChallengePointPerCharacter}
								inferredChallengePointPartySize={
									normalizedPartySetup.inferredChallengePointPartySize
								}
								chpDisplayMultiplier={rebasedChpDisplayMultiplier}
								waveInteraction={xpUsage.waveInteraction}
								simulation={xpUsage.simulation}
							/>
						</section>
						<div className="flex h-auto w-full flex-wrap items-center justify-start gap-1.5 sm:gap-2">
							<TabsTrigger
								value="details"
								className={cn(
									'group h-9 gap-1.5 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm',
									isPreviousStep('details') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<Info className="h-4 w-4" aria-hidden="true" />
								<span className="hidden text-xs font-medium group-data-[state=active]:inline lg:inline">
									Details
								</span>
							</TabsTrigger>
							<ChevronRight
								className="hidden h-4 w-4 self-center text-muted-foreground lg:block"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="participants"
								className={cn(
									'group h-9 gap-1.5 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm',
									isPreviousStep('participants') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<Users className="h-4 w-4" aria-hidden="true" />
								<span className="hidden text-xs font-medium group-data-[state=active]:inline lg:inline">
									Participants
								</span>
								<span className="inline-flex min-w-5 items-center justify-center rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-muted-foreground transition-colors group-data-[state=active]:border-primary/40 group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
									{participantSummary.count}
								</span>
							</TabsTrigger>
							<ChevronRight
								className="hidden h-4 w-4 self-center text-muted-foreground lg:block"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="events"
								className={cn(
									'group h-9 gap-1.5 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm',
									isPreviousStep('events') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<CalendarClock className="h-4 w-4" aria-hidden="true" />
								<span className="hidden text-xs font-medium group-data-[state=active]:inline lg:inline">
									Events
								</span>
								<span className="inline-flex min-w-5 items-center justify-center rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-muted-foreground transition-colors group-data-[state=active]:border-primary/40 group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
									{eventSummary.count}
								</span>
							</TabsTrigger>
							<ChevronRight
								className="hidden h-4 w-4 self-center text-muted-foreground lg:block"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="variants"
								className={cn(
									'group h-9 gap-1.5 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm',
									isPreviousStep('variants') &&
										'outline outline-1 bg-background/25 -outline-offset-1 text-primary/75'
								)}
							>
								<Layers3 className="h-4 w-4" aria-hidden="true" />
								<span className="hidden text-xs font-medium group-data-[state=active]:inline lg:inline">
									Variants
								</span>
								<span className="inline-flex min-w-5 items-center justify-center rounded-full border border-border/70 bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold leading-none tabular-nums text-muted-foreground transition-colors group-data-[state=active]:border-primary/40 group-data-[state=active]:bg-primary/15 group-data-[state=active]:text-primary">
									{variants.length}
								</span>
							</TabsTrigger>
							<ChevronRight
								className="hidden h-4 w-4 self-center text-muted-foreground lg:block"
								aria-hidden="true"
							/>
							<TabsTrigger
								value="preview"
								className="group h-9 gap-1.5 px-2 sm:px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm"
							>
								<Eye className="h-4 w-4" aria-hidden="true" />
								<span className="hidden text-xs font-medium group-data-[state=active]:inline lg:inline">
									Preview
								</span>
							</TabsTrigger>
						</div>
					</TabsList>

					<BuilderDetailsStep
						form={form}
						partySetupMode={partySetupMode}
						specificPartyId={specificPartyId}
						specificPartyLevels={specificPartyLevels}
						challengePointTierStart={challengePointTierStart}
						challengePointBudget={challengePointBudget}
						savedParties={savedParties}
						selectedSavedParty={selectedSavedParty}
						resolvedSpecificPartyLevels={resolvedSpecificPartyLevels}
						normalizedPartySetup={normalizedPartySetup}
						safePartyLevel={safePartyLevel}
						safePartySize={safePartySize}
						noteFields={noteFields}
						notes={notes}
						appendNote={appendNote}
						removeNote={removeNote}
						activeNotesTab={activeNotesTab}
						onActiveNotesTabChange={setActiveNotesTab}
						layoutKey={sectionLayoutKeys.notes}
						onLayoutKeyChange={(key) => setSectionLayoutKey('notes', key)}
					/>

					<BuilderParticipantsStep
						form={form}
						items={participantItems}
						resolvedSlots={resolvedSlots}
						remove={remove}
						update={update}
						usedAdditionalDataBlocks={usedAdditionalDataBlocks}
						activeItemId={activeParticipantItemId}
						onActiveItemIdChange={setActiveParticipantItemId}
						append={append}
						layoutKey={sectionLayoutKeys.participants}
						onLayoutKeyChange={(key) =>
							setSectionLayoutKey('participants', key)
						}
					/>

					<BuilderEventsStep
						form={form}
						items={eventItems}
						resolvedSlots={resolvedSlots}
						remove={remove}
						update={update}
						usedAdditionalDataBlocks={usedAdditionalDataBlocks}
						activeItemId={activeEventItemId}
						onActiveItemIdChange={setActiveEventItemId}
						append={append}
						layoutKey={sectionLayoutKeys.events}
						onLayoutKeyChange={(key) => setSectionLayoutKey('events', key)}
					/>

					<BuilderVariantsStep
						form={form}
						variants={variants}
						safePartyLevel={safePartyLevel}
						safePartySize={safePartySize}
						activeVariantItemId={activeVariantItemId}
						onActiveVariantItemIdChange={setActiveVariantItemId}
						templateShadowVariants={templateShadowVariants}
						templateVariantId={templateVariantId}
						activeTemplateVariantItemId={activeTemplateVariantItemId}
						onActiveTemplateVariantItemIdChange={setActiveTemplateVariantItemId}
						onVariantSaved={setActiveVariantItemId}
						variantsLayoutKey={sectionLayoutKeys.variants}
						onVariantsLayoutKeyChange={(key) =>
							setSectionLayoutKey('variants', key)
						}
						templateVariantsLayoutKey={sectionLayoutKeys.templateVariants}
						onTemplateVariantsLayoutKeyChange={(key) =>
							setSectionLayoutKey('templateVariants', key)
						}
					/>

					<BuilderPreviewStep
						control={control}
						templateVariants={templateShadowVariants}
						attritionRatePercent={attritionRatePercent}
						maxRounds={maxRounds}
						basePartyOutputPerRound={basePartyOutputPerRound}
					/>
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
