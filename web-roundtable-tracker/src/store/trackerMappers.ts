import { Character, Encounter, NarrativeSlot, DIFFICULTY, difficultyToString, LEVEL_REPRESENTATION } from './data';
import type { EncounterStore, TrackerParticipantMeta } from './encounterRuntimeStore';
import type { TrackerParticipant, TimelineEvent } from '@/components/InitiativeTracker/mockData';

export type TrackerHeader = {
	encounterTitle: string;
	threatLevel: string;
	currentRound: number;
	description: string;
	narrativeDetails: string[];
};

const DEFAULT_META: TrackerParticipantMeta = {
	role: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
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
	const base: TrackerParticipant = {
		id: character.uuid,
		name: character.name,
		role: meta.role,
		state: characterStateToTrackerState(character.turnState, inInitiative),
		currentHp: character.health,
		maxHp: character.maxHealth,
		notes: meta.notes,
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
	const { charactersOrder, delayedOrder, charactersMap, trackerMetaMap } = store;

	const allIds = [...charactersOrder, ...delayedOrder].filter((uuid) => {
		const meta = trackerMetaMap[uuid];

		return meta ? !meta.isSimpleHazard : true;
	});

	// Sort by initiative descending (store order reflects this, but merge requires re-sort)
	allIds.sort((a, b) => {
		const charA = charactersMap[a];
		const charB = charactersMap[b];

		return (charB?.initiative ?? 0) - (charA?.initiative ?? 0);
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
	>
): {
	reinforcements: TrackerParticipant[];
	delayed: TrackerParticipant[];
	hazards: TrackerParticipant[];
} {
	const { charactersMap, trackerMetaMap, encounterData, partyLevel } = store;

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
		.filter((slot) => slot.type === 'reinforcement')
		.flatMap((slot) =>
			(slot.participants ?? []).map((participant, index) => {
				const id = `${slot.id}-${index}`;
				const level =
					typeof participant.level === 'number'
						? participant.level
						: partyLevel + Number.parseInt(participant.level as string);

				return {
					id,
					name: participant.name,
					role: 'reinforcement' as const,
					state: 'inactive' as const,
					currentHp: participant.maxHealth ?? level * 5,
					maxHp: participant.maxHealth ?? level * 5,
					notes: slot.description ?? '',
				} satisfies TrackerParticipant;
			})
		);

	return { reinforcements, delayed: [], hazards };
}

export function narrativeSlotsToTimeline(
	slots: NarrativeSlot[] | undefined
): TimelineEvent[] {
	if (!slots) return [];

	return slots.map((slot) => ({
		round: slot.trigger.round,
		title: slot.type.charAt(0).toUpperCase() + slot.type.slice(1),
		detail: slot.description ?? '',
	}));
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

	return {
		encounterTitle: encounterData.name,
		threatLevel: `${difficultyLabel} ${encounterLevel}`,
		currentRound: round,
		description: encounterData.description,
		narrativeDetails,
	};
}

export function historyToPreviewLines(history: EncounterStore['history']): string[] {
	return history
		.filter((command) => command.description)
		.map((command) => command.description as string);
}
