import { Character, Encounter, NarrativeSlot, DIFFICULTY, difficultyToString, LEVEL_REPRESENTATION } from './data';
import type { EncounterStore, TrackerParticipantMeta } from './encounterRuntimeStore';
import type { TrackerParticipant, TimelineEvent } from '@/components/InitiativeTracker/mockData';

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
};

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
};

export function characterStateToTrackerState(
	turnState: string,
	inInitiative: boolean
): TrackerParticipant['state'] {
	if (turnState === 'knocked-out') return 'knocked-out';

	if (turnState === 'delayed') return 'delayed';

	if (!inInitiative || turnState === 'on-hold') return 'inactive';

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

		if (meta.reinforcementPending) return false;

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

export function runtimeToInitiativeQueueWithPending(
	store: Pick<
		EncounterStore,
		'charactersOrder' | 'delayedOrder' | 'charactersMap' | 'trackerMetaMap'
	>
): TrackerParticipant[] {
	const { charactersOrder, charactersMap, trackerMetaMap } = store;

	const allIds = charactersOrder.filter((uuid) => {
		const meta = trackerMetaMap[uuid];

		return meta ? !meta.isSimpleHazard : true;
	});

	return allIds
		.map((uuid) => {
			const character = charactersMap[uuid];
			const meta = trackerMetaMap[uuid] ?? DEFAULT_META;

			if (!character) return null;

			const participant = characterToTrackerParticipant(character, meta, true);

			if (meta.reinforcementPending) {
				return { ...participant, state: 'pending-reinforcement' as TrackerParticipant['state'] };
			}

			return participant;
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
	>
): {
	reinforcements: TrackerParticipant[];
	delayed: TrackerParticipant[];
	hazards: TrackerParticipant[];
} {
	const { charactersMap, trackerMetaMap, encounterData, partyLevel, delayedOrder } =
		store;

	const triggeredReinforcementSlots = new Set(
		Object.values(trackerMetaMap)
			.filter((meta) => meta.reinforcementSlotId && meta.reinforcementPending !== true)
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
				slot.type === 'reinforcement' && !triggeredReinforcementSlots.has(slot.id)
		)
		.flatMap((slot) =>
			(slot.participants ?? []).map((participant, index) => {
				const id = `${slot.id}-${index}`;
				const initiative =
					typeof (participant as { initiative?: unknown }).initiative === 'number'
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
					notes: slot.description ?? '',
				} satisfies TrackerParticipant;
			})
		);

	const delayed: TrackerParticipant[] = delayedOrder
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
		.filter((participant): participant is TrackerParticipant => participant !== null);

	return { reinforcements, delayed, hazards };
}

const toPlayerStatus = (state: TrackerParticipant['state']): PlayerTrackerParticipant['status'] => {
	if (state === 'delayed') return 'Delayed';

	if (state === 'knocked-out') return 'Knocked Out';

	if (state === 'inactive') return 'Inactive';

	return 'Ready';
};

const toCoarseHpLabel = (participant: TrackerParticipant): string => {
	if (typeof participant.currentHp !== 'number' || typeof participant.maxHp !== 'number') {
		return 'No HP Data';
	}

	const maxHp = participant.maxHp ?? 1;
	const currentHp = participant.currentHp ?? maxHp;

	if (currentHp <= 0) {
		return 'Defeated';
	}

	const ratio = currentHp / Math.max(maxHp, 1);

	if (ratio >= 0.75) {
		return 'Healthy';
	}

	if (ratio >= 0.4) {
		return 'Wounded';
	}

	return 'Critical';
};

export function runtimeToPlayerInitiativeQueue(
	store: Pick<
		EncounterStore,
		'charactersOrder' | 'delayedOrder' | 'charactersMap' | 'trackerMetaMap'
	>
): PlayerTrackerParticipant[] {
	return runtimeToInitiativeQueue(store).map((participant) => ({
		id: participant.id,
		name: participant.name,
		status: toPlayerStatus(participant.state),
		hpLabel: toCoarseHpLabel(participant),
	}));
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

export function historyToPreviewLines(history: EncounterStore['history']): string[] {
	return history
		.filter((command) => command.description)
		.map((command) => command.description as string);
}
