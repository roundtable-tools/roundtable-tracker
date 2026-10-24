import {
	Character,
	Encounter,
	NarrativeSlot,
	DIFFICULTY,
	difficultyToString,
	LEVEL_REPRESENTATION,
} from './data';
import type {
	EncounterStore,
	TrackerParticipantMeta,
} from './encounterRuntimeStore';

export type TrackerParticipant = {
	id: string;
	name: string;
	role: 'pc' | 'opponent' | 'neutral' | 'ally' | 'hazard' | 'reinforcement';
	sideTheme?: 'pc' | 'opponent' | 'ally' | 'other' | 'neutral';
	state: 'active' | 'delayed' | 'knocked-out' | 'inactive';
	initiative?: number;
	eventId?: string;
	eventRound?: number;
	currentHp?: number;
	maxHp?: number;
	tempHp?: number;
	tempHpDescription?: string;
	disableChecksSucceeded?: number;
	disableChecksRequired?: number;
	hardness?: number;
	initiativeBonus?: number;
	dcs?: Array<{
		name?: string;
		inline?: string;
		value: number;
		icon?: string;
		disableSuccesses?: number;
	}>;
	adjustmentDescription?: string;
	adjustmentLevelModifier?: number;
	traits?: string[];
	/** Kept from the players until the participant's first turn starts. */
	hiddenUntilFirstTurn?: boolean;
	notes: string;
};

export type TimelineEvent = {
	id?: string;
	round: number;
	title: string;
	detail: string;
	type?: 'default' | 'reinforcement' | 'ongoing';
};

export type TrackerHeader = {
	encounterTitle: string;
	threatLevel: string;
	currentRound: number;
	descriptionSections: Array<{
		label: string;
		content: string;
	}>;
	narrativeDetails: string[];
};

export type PlayerTrackerParticipant = {
	id: string;
	name: string;
	status: 'Ready' | 'Delayed' | 'Knocked Out' | 'Inactive';
	hpLabel: string;
	/** Filled segments of the player HP bar, or null without HP data. */
	hpSegments: number | null;
	isHazard: boolean;
	/** Disable checks of a hazard that needs any, shown instead of HP. */
	disableProgress: PlayerDisableProgress | null;
	sideTheme: ParticipantSideTheme;
};

export type PlayerDisableProgress = {
	succeeded: number;
	required: number;
	label: string;
};

/** HP tiers above 0 HP, from worst to best. */
const HEALTH_TIERS = [
	'Near Death',
	'Badly Injured',
	'Injured',
	'Barely Injured',
	'Uninjured',
] as const;

type HealthTier = (typeof HEALTH_TIERS)[number];

/** Segments in the player HP bar: one per HP tier. */
export const PLAYER_HP_SEGMENTS = HEALTH_TIERS.length;

/** The HP tier for a percentage of max HP; Unconscious at 0 HP or less. */
export function getHealthLabelFromPercentage(healthPercentage: number) {
	if (healthPercentage <= 0) {
		return 'Unconscious';
	}

	if (healthPercentage >= 100) {
		return 'Uninjured';
	}

	if (healthPercentage >= 85) {
		return 'Barely Injured';
	}

	if (healthPercentage >= 65) {
		return 'Injured';
	}

	if (healthPercentage >= 35) {
		return 'Badly Injured';
	}

	return 'Near Death';
}

/** The colour group a participant is shown in. */
export type ParticipantSideTheme = 'pc' | 'opponent' | 'ally' | 'other';

export function resolveParticipantSideTheme(
	participant: Pick<TrackerParticipant, 'role' | 'sideTheme'>
): ParticipantSideTheme {
	if (participant.sideTheme === 'pc') {
		return 'pc';
	}

	if (participant.sideTheme === 'ally') {
		return 'ally';
	}

	if (
		participant.sideTheme === 'other' ||
		participant.sideTheme === 'neutral'
	) {
		return 'other';
	}

	if (participant.sideTheme === 'opponent') {
		return 'opponent';
	}

	if (participant.role === 'pc') {
		return 'pc';
	}

	if (participant.role === 'ally') {
		return 'ally';
	}

	if (participant.role === 'neutral') {
		return 'other';
	}

	return 'opponent';
}

const DEFAULT_META: TrackerParticipantMeta = {
	role: 'opponent',
	sideTheme: 'opponent',
	hasHealthData: true,
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
	hardness: undefined,
	initiativeBonus: undefined,
	dcs: undefined,
	adjustmentDescription: undefined,
	adjustmentLevelModifier: undefined,
	traits: undefined,
};

export function characterStateToTrackerState(
	turnState: string,
	inInitiative: boolean
): TrackerParticipant['state'] {
	if (turnState === 'knocked-out') return 'knocked-out';

	if (turnState === 'delayed') return 'delayed';

	if (!inInitiative) return 'inactive';

	return 'active';
}

function characterToTrackerParticipant(
	character: Character,
	meta: TrackerParticipantMeta,
	inInitiative: boolean
): TrackerParticipant {
	const hasHealthData = meta.hasHealthData !== false;
	const base: TrackerParticipant = {
		id: character.uuid,
		name: character.name,
		role: meta.role,
		sideTheme: meta.sideTheme,
		state: characterStateToTrackerState(character.turnState, inInitiative),
		currentHp: hasHealthData ? character.health : undefined,
		maxHp: hasHealthData ? character.maxHealth : undefined,
		tempHp:
			hasHealthData && character.tempHealth > 0
				? character.tempHealth
				: undefined,
		tempHpDescription: character.tempHealthDescription,
		notes: meta.notes,
		hardness: meta.hardness,
		initiativeBonus: meta.initiativeBonus,
		dcs: meta.dcs,
		adjustmentDescription: meta.adjustmentDescription,
		adjustmentLevelModifier: meta.adjustmentLevelModifier,
		traits: meta.traits,
		hiddenUntilFirstTurn: meta.hiddenUntilFirstTurn,
	};

	if (meta.disableChecksRequired > 0) {
		base.disableChecksRequired = meta.disableChecksRequired;
		base.disableChecksSucceeded = meta.disableChecksSucceeded;
	}

	return base;
}

export function runtimeToInitiativeQueue(
	store: Pick<
		EncounterStore,
		'charactersOrder' | 'delayedOrder' | 'charactersMap' | 'trackerMetaMap'
	>
): TrackerParticipant[] {
	const { charactersOrder, charactersMap, trackerMetaMap } = store;

	const allIds = charactersOrder.filter((uuid) => {
		const meta = trackerMetaMap[uuid];

		if (!meta) return true;

		if (meta.isSimpleHazard) return false;

		return true;
	});

	return allIds
		.map((uuid) => {
			const character = charactersMap[uuid];
			const meta = trackerMetaMap[uuid] ?? DEFAULT_META;

			if (!character) return null;

			return characterToTrackerParticipant(character, meta, true);
		})
		.filter((p): p is TrackerParticipant => p !== null);
}

export function runtimeToOutOfInitiativeData(
	store: Pick<
		EncounterStore,
		| 'charactersOrder'
		| 'delayedOrder'
		| 'charactersMap'
		| 'trackerMetaMap'
		| 'encounterData'
		| 'partyLevel'
	> &
		Partial<Pick<EncounterStore, 'pendingReinforcements'>>
): {
	reinforcements: TrackerParticipant[];
	delayed: TrackerParticipant[];
	hazards: TrackerParticipant[];
} {
	const {
		charactersMap,
		trackerMetaMap,
		encounterData,
		partyLevel,
		delayedOrder,
		pendingReinforcements = [],
	} = store;

	const triggeredReinforcementSlots = new Set(
		Object.values(trackerMetaMap)
			.map((meta) => meta.reinforcementSlotId)
			.filter((slotId): slotId is string => Boolean(slotId))
	);

	const hazards: TrackerParticipant[] = Object.entries(trackerMetaMap)
		.filter(([, meta]) => meta.isSimpleHazard)
		.map(([uuid, meta]) => {
			const character = charactersMap[uuid];

			if (!character) return null;

			return characterToTrackerParticipant(character, meta, false);
		})
		.filter((p): p is TrackerParticipant => p !== null);

	const reinforcements: TrackerParticipant[] = (
		encounterData?.narrativeSlots ?? []
	)
		.filter(
			(slot) =>
				slot.type === 'reinforcement' &&
				!triggeredReinforcementSlots.has(slot.id)
		)
		.flatMap((slot) => {
			const pending = pendingReinforcements.filter(
				({ slotId }) => slotId === slot.id
			);

			// Reinforcements set up in the preview show its names, initiative
			// and HP.
			if (pending.length > 0) {
				return pending.map(({ character, meta }) => ({
					...characterToTrackerParticipant(character, meta, false),
					role: 'reinforcement' as const,
					state: 'inactive' as const,
					initiative: character.initiative,
					eventId: slot.id,
					eventRound: slot.trigger.round,
				}));
			}

			return (slot.participants ?? []).map((participant, index) => {
				const id = `${slot.id}-${index}`;
				const initiative =
					typeof (participant as { initiative?: unknown }).initiative ===
					'number'
						? ((participant as { initiative?: number }).initiative ?? 0)
						: stableInitiativeFromId(id);
				const level =
					typeof participant.level === 'number'
						? participant.level
						: partyLevel + Number.parseInt(participant.level as string);

				return {
					id,
					name: participant.name,
					role: 'reinforcement' as const,
					sideTheme: 'opponent' as const,
					state: 'inactive' as const,
					initiative,
					initiativeBonus: participant.initiativeBonus,
					eventId: slot.id,
					eventRound: slot.trigger.round,
					currentHp: participant.maxHealth ?? level * 5,
					maxHp: participant.maxHealth ?? level * 5,
					hardness: participant.hardness,
					dcs: participant.dcs,
					adjustmentDescription: participant.adjustmentDescription,
					adjustmentLevelModifier: participant.adjustmentLevelModifier,
					traits: participant.traits,
					hiddenUntilFirstTurn: participant.hiddenUntilFirstTurn,
					notes: slot.description ?? '',
				} satisfies TrackerParticipant;
			});
		});

	const delayed = delayedToTrackerParticipants(
		delayedOrder,
		charactersMap,
		trackerMetaMap
	);

	return { reinforcements, delayed, hazards };
}

function delayedToTrackerParticipants(
	delayedIds: EncounterStore['delayedOrder'],
	charactersMap: EncounterStore['charactersMap'],
	trackerMetaMap: EncounterStore['trackerMetaMap']
): TrackerParticipant[] {
	return delayedIds
		.filter((uuid) => {
			const meta = trackerMetaMap[uuid];

			return meta ? !meta.isSimpleHazard : true;
		})
		.map((uuid) => {
			const character = charactersMap[uuid];
			const meta = trackerMetaMap[uuid] ?? DEFAULT_META;

			if (!character) return null;

			return characterToTrackerParticipant(character, meta, false);
		})
		.filter(
			(participant): participant is TrackerParticipant => participant !== null
		);
}

const toPlayerStatus = (
	state: TrackerParticipant['state']
): PlayerTrackerParticipant['status'] => {
	if (state === 'delayed') return 'Delayed';

	if (state === 'knocked-out') return 'Knocked Out';

	if (state === 'inactive') return 'Inactive';

	return 'Ready';
};

/**
 * A participant's HP as players see it: the HP tier, and that tier's number of
 * filled segments in the player HP bar.
 */
const toPlayerHealth = (
	participant: TrackerParticipant
): Pick<PlayerTrackerParticipant, 'hpLabel' | 'hpSegments'> => {
	if (participant.state === 'knocked-out') {
		return { hpLabel: 'Unconscious', hpSegments: 0 };
	}

	if (
		typeof participant.currentHp !== 'number' ||
		typeof participant.maxHp !== 'number'
	) {
		return { hpLabel: 'No HP Data', hpSegments: null };
	}

	const hpLabel = getHealthLabelFromPercentage(
		(participant.currentHp / Math.max(participant.maxHp, 1)) * 100
	);

	return {
		hpLabel,
		hpSegments: HEALTH_TIERS.indexOf(hpLabel as HealthTier) + 1,
	};
};

const HAZARD_DISABLE_CHECK_NAMES = [
	'Disrupted',
	'Compromised',
	'Fracturing',
	'Critical',
	'Disabled',
] as const;

function getHazardDisableStageNames(requiredChecks: number) {
	const clampedRequiredChecks = Math.min(Math.max(requiredChecks, 1), 5);

	if (clampedRequiredChecks === 5) {
		return [...HAZARD_DISABLE_CHECK_NAMES];
	}

	if (clampedRequiredChecks === 4) {
		return [
			HAZARD_DISABLE_CHECK_NAMES[0],
			HAZARD_DISABLE_CHECK_NAMES[1],
			HAZARD_DISABLE_CHECK_NAMES[3],
			HAZARD_DISABLE_CHECK_NAMES[4],
		];
	}

	if (clampedRequiredChecks === 3) {
		return [
			HAZARD_DISABLE_CHECK_NAMES[0],
			HAZARD_DISABLE_CHECK_NAMES[2],
			HAZARD_DISABLE_CHECK_NAMES[4],
		];
	}

	if (clampedRequiredChecks === 2) {
		return [HAZARD_DISABLE_CHECK_NAMES[0], HAZARD_DISABLE_CHECK_NAMES[4]];
	}

	return [HAZARD_DISABLE_CHECK_NAMES[4]];
}

/**
 * The tracker's label for a hazard's disable checks: Stable before the first
 * success, then one stage name per success, ending at Disabled.
 */
export function getHazardDisableLabel(
	participant: Pick<
		TrackerParticipant,
		'disableChecksRequired' | 'disableChecksSucceeded'
	>
) {
	const requiredChecks = participant.disableChecksRequired ?? 5;
	const successfulChecks = participant.disableChecksSucceeded ?? 0;

	if (successfulChecks <= 0) {
		return 'Stable';
	}

	const stageNames = getHazardDisableStageNames(requiredChecks);
	const stageIndex =
		Math.min(Math.max(successfulChecks, 1), requiredChecks) - 1;

	return stageNames[Math.min(stageIndex, stageNames.length - 1)] ?? 'Disabled';
}

/** A hazard's disable checks as players see them, with the tracker's label. */
const toPlayerDisableProgress = (
	participant: TrackerParticipant
): PlayerDisableProgress | null => {
	const required = participant.disableChecksRequired ?? 0;

	if (participant.role !== 'hazard' || required <= 0) {
		return null;
	}

	const succeeded = Math.min(
		Math.max(participant.disableChecksSucceeded ?? 0, 0),
		required
	);

	return { succeeded, required, label: getHazardDisableLabel(participant) };
};

export function runtimeToPlayerInitiativeQueue(
	store: Pick<
		EncounterStore,
		'charactersOrder' | 'delayedOrder' | 'charactersMap' | 'trackerMetaMap'
	>
): PlayerTrackerParticipant[] {
	// Delaying on a turn keeps a participant in the order; one that starts
	// the encounter delaying is only in delayedOrder, so it is added after.
	const inOrder = new Set(store.charactersOrder);
	const delayedOutsideOrder = delayedToTrackerParticipants(
		store.delayedOrder.filter((uuid) => !inOrder.has(uuid)),
		store.charactersMap,
		store.trackerMetaMap
	);

	return [...runtimeToInitiativeQueue(store), ...delayedOutsideOrder].map(
		(participant) => ({
			id: participant.id,
			name: participant.name,
			status: toPlayerStatus(participant.state),
			isHazard: participant.role === 'hazard',
			...toPlayerHealth(participant),
			disableProgress: toPlayerDisableProgress(participant),
			sideTheme: resolveParticipantSideTheme(participant),
		})
	);
}

export function narrativeSlotsToTimeline(
	slots: NarrativeSlot[] | undefined
): TimelineEvent[] {
	if (!slots) return [];

	return slots.map((slot) => ({
		id: slot.id,
		round: slot.trigger.round,
		title: slot.type.charAt(0).toUpperCase() + slot.type.slice(1),
		detail: slot.description ?? '',
		type: slot.type,
	}));
}

function stableInitiativeFromId(id: string): number {
	let hash = 0;

	for (let i = 0; i < id.length; i += 1) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}

	return (Math.abs(hash) % 20) + 1;
}

export function encounterToTrackerHeader(
	encounterData: Encounter,
	partyLevel: number,
	round: number
): TrackerHeader {
	const difficulty =
		encounterData.levelRepresentation === LEVEL_REPRESENTATION.Exact
			? encounterData.difficulty
			: (encounterData.difficulty ?? DIFFICULTY.Unknown);

	const difficultyLabel = difficultyToString(difficulty);

	const encounterLevel =
		encounterData.levelRepresentation === LEVEL_REPRESENTATION.Exact
			? encounterData.level
			: partyLevel;

	const narrativeDetails = (encounterData.narrativeSlots ?? [])
		.filter((slot) => slot.description)
		.map((slot) => `Round ${slot.trigger.round}: ${slot.description}`);

	const descriptionSections = [
		{ label: 'Description', content: encounterData.description },
		{ label: 'GM Notes', content: encounterData.notes?.gm ?? '' },
		{ label: 'Monster Notes', content: encounterData.notes?.monster ?? '' },
		{ label: 'Player Notes', content: encounterData.notes?.player ?? '' },
	].filter((section) => section.content.trim().length > 0);

	return {
		encounterTitle: encounterData.name,
		threatLevel: `${difficultyLabel} ${encounterLevel}`,
		currentRound: round,
		descriptionSections,
		narrativeDetails,
	};
}

export function historyToPreviewLines(
	history: EncounterStore['history']
): string[] {
	return history
		.filter((command) => command.description)
		.map((command) => command.description as string);
}
