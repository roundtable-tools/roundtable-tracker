import {
	Character,
	CharacterConfig,
	characterConfigToCharacter,
	ALIGNMENT,
	NarrativeSlot,
} from './data';
import {
	TrackerParticipantMeta,
	TrackerParticipantRole,
} from './encounterRuntimeStore';
import { UUID } from '@/utils/uuid';
import {
	PendingReinforcement,
	spotsFromSortedRoster,
} from './pendingReinforcements';

// Highest initiative first, then the higher tie priority. Simple hazards have
// no initiative; treat it as 0 so the comparator never returns NaN and
// scrambles the others.
const byInitiative = (a: CharacterConfig, b: CharacterConfig) =>
	(b.initiative ?? 0) - (a.initiative ?? 0) || b.tiePriority - a.tiePriority;

export const participantsToEncounterCharacters = (
	participants: CharacterConfig[]
): Character[] => {
	return participants.sort(byInitiative).map(characterConfigToCharacter);
};

type RuntimeParticipantFields = {
	type?: 'creature' | 'hazard';
	hasHealthData?: boolean;
	successesToDisable?: number;
	isSimpleHazard?: boolean;
	isComplexHazard?: boolean;
	description?: string;
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
};

function deriveRole(
	side: (typeof ALIGNMENT)[keyof typeof ALIGNMENT],
	type?: 'creature' | 'hazard'
): TrackerParticipantRole {
	if (type === 'hazard') return 'hazard';

	switch (side) {
		case ALIGNMENT.PCs:
			return 'pc';

		case ALIGNMENT.Neutral:
			return 'neutral';

		default:
			return 'opponent';
	}
}

function deriveSideTheme(
	side: (typeof ALIGNMENT)[keyof typeof ALIGNMENT]
): TrackerParticipantMeta['sideTheme'] {
	switch (side) {
		case ALIGNMENT.PCs:
			return 'pc';

		case ALIGNMENT.Neutral:
			return 'other';

		default:
			return 'opponent';
	}
}

export const buildTrackerMetaMap = (
	participants: CharacterConfig[]
): Record<UUID, TrackerParticipantMeta> => {
	const result: Record<UUID, TrackerParticipantMeta> = {};

	for (const participant of participants) {
		const runtime = participant as CharacterConfig & RuntimeParticipantFields;

		result[participant.uuid] = {
			role: deriveRole(participant.side, runtime.type),
			sideTheme: deriveSideTheme(participant.side),
			hasHealthData: runtime.hasHealthData ?? true,
			isSimpleHazard: runtime.isSimpleHazard ?? false,
			disableChecksRequired: runtime.successesToDisable ?? 0,
			disableChecksSucceeded: 0,
			notes: runtime.description ?? '',
			hardness: runtime.hardness,
			initiativeBonus: runtime.initiativeBonus,
			dcs: runtime.dcs,
			adjustmentDescription: runtime.adjustmentDescription,
			adjustmentLevelModifier: runtime.adjustmentLevelModifier,
			traits: runtime.traits,
		};
	}

	return result;
};

/**
 * Reinforcements whose initiative was set in the preview, each waiting at the
 * spot that initiative gives it among the starting participants. The sort
 * is the starting order's, and it is stable with the starting participants
 * listed first, so on a tie a reinforcement goes after a participant already
 * there, unless it wins the tie (an enemy against a PC).
 */
export const buildPendingReinforcements = (
	startingParticipants: CharacterConfig[],
	reinforcements: Array<CharacterConfig & { reinforcementSlotId: string }>,
	narrativeSlots: NarrativeSlot[] = []
): PendingReinforcement[] => {
	const takesTurns = (participant: CharacterConfig) =>
		!(participant as RuntimeParticipantFields).isSimpleHazard;
	const startingOrderIds = new Set(
		startingParticipants
			.filter(
				(participant) =>
					takesTurns(participant) && participant.startingState !== 'delayed'
			)
			.map(({ uuid }) => uuid)
	);
	const reinforcementIds = new Set(reinforcements.map(({ uuid }) => uuid));
	const sorted = [...startingParticipants, ...reinforcements]
		.filter(
			(participant) =>
				startingOrderIds.has(participant.uuid) ||
				reinforcementIds.has(participant.uuid)
		)
		.sort(byInitiative);
	const spots = spotsFromSortedRoster(
		sorted.map(({ uuid }) => uuid),
		(uuid) => reinforcementIds.has(uuid),
		(uuid) => startingOrderIds.has(uuid)
	);
	const metaMap = buildTrackerMetaMap(reinforcements);
	const sortedReinforcements = sorted.filter(({ uuid }) =>
		reinforcementIds.has(uuid)
	) as typeof reinforcements;

	return sortedReinforcements.map((participant) => {
		const runtime = participant as CharacterConfig & RuntimeParticipantFields;
		const slot = narrativeSlots.find(
			({ id }) => id === participant.reinforcementSlotId
		);

		return {
			slotId: participant.reinforcementSlotId,
			character: {
				...characterConfigToCharacter(participant),
				level: participant.level,
			},
			meta: {
				...metaMap[participant.uuid],
				role: runtime.type === 'hazard' ? 'hazard' : 'reinforcement',
				notes: slot?.description?.trim() || runtime.description?.trim() || '',
				reinforcementSlotId: participant.reinforcementSlotId,
			},
			above: spots.get(participant.uuid)?.above ?? null,
			below: spots.get(participant.uuid)?.below ?? null,
		};
	});
};
