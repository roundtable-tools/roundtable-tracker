import { Character, CharacterConfig, characterConfigToCharacter, ALIGNMENT } from './data';
import { TrackerParticipantMeta, TrackerParticipantRole } from './encounterRuntimeStore';
import { UUID } from '@/utils/uuid';

export const participantsToEncounterCharacters = (
	participants: CharacterConfig[]
): Character[] => {
	return participants
		.sort(
			(a, b) => b.initiative! - a.initiative! || b.tiePriority - a.tiePriority
		)
		.map(characterConfigToCharacter);
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
	reinforcementSlotId?: string;
	reinforcementPending?: boolean;
};

function deriveRole(
	side: typeof ALIGNMENT[keyof typeof ALIGNMENT],
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
	side: typeof ALIGNMENT[keyof typeof ALIGNMENT]
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
			...(runtime.reinforcementSlotId !== undefined
				? {
						reinforcementSlotId: runtime.reinforcementSlotId,
						reinforcementPending: runtime.reinforcementPending ?? false,
					}
				: {}),
		};
	}

	return result;
};
