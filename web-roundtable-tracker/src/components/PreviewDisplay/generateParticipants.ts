import {
	ALIGNMENT,
	Encounter,
	InitiativeParticipant,
	normalizeLevel,
	Participant,
	PRIORITY,
} from '@/store/data';
import { uniqueNames } from '@/utils/uniqueNames';
import { generateUUID } from '@/utils/uuid';

function getDefaultParticipantName(participant: Participant<0 | 1>): string {
	if (participant.type === 'hazard') {
		return 'Hazard';
	}

	switch (participant.side) {
		case ALIGNMENT.Opponents:
			return 'Opponent';

		case ALIGNMENT.Neutral:
			return 'Other';

		case ALIGNMENT.PCs:
			return 'PC';

		default:
			return 'Combatant';
	}
}

/**
 * Gives every participant in the roster a unique name. A name used more than
 * once across all teams gets a letter suffix (A, B, C…) on each use, skipping
 * letters that would clash with a name already in the roster. Reserved names
 * (the party's) are never renamed, but count as taken.
 */
const withUniqueNames = (
	teams: InitiativeParticipant[][],
	reservedNames: string[]
): InitiativeParticipant[][] => {
	const names = uniqueNames(
		teams.flat().map((participant) => participant.name),
		reservedNames
	);
	let index = 0;

	return teams.map((team) =>
		team.map((participant) => ({ ...participant, name: names[index++] }))
	);
};

export const generateParticipants = (
	encounterData: Encounter | undefined,
	partyLevel: number,
	reservedNames: string[] = []
): InitiativeParticipant[][] => {
	if (!encounterData) return [];

	// Reinforcement slot participants are left out: they join the encounter
	// only when their event is triggered (TriggerReinforcementEventCommand).
	const groupedBySide = (encounterData.participants ?? []).reduce(
		(acc, participant) => {
			if (!acc[participant.side]) {
				acc[participant.side] = [];
			}
			acc[participant.side].push(participant);

			return acc;
		},
		{} as Record<number, Participant<0 | 1>[]>
	);

	const teams = Object.values(groupedBySide).map((participants) =>
		participants.flatMap(({ level, name, count, ...participant }) => {
			const trimmedName = name.trim();
			const baseName =
				trimmedName.length > 0
					? trimmedName
					: getDefaultParticipantName({ level, name, count, ...participant });
			const initiativeBonus =
				typeof participant.initiativeBonus === 'number' &&
				Number.isFinite(participant.initiativeBonus)
					? participant.initiativeBonus
					: 0;
			const isSimpleHazard =
				participant.type === 'hazard' && !participant.isComplexHazard;

			return Array.from({ length: count ?? 1 }).map(() => ({
				uuid: generateUUID(),
				tiePriority: PRIORITY.NPC,
				initiative: Math.floor(Math.random() * 20) + 1 + initiativeBonus,
				...participant,
				level: normalizeLevel(partyLevel, level),
				name: baseName,
				isSimpleHazard: isSimpleHazard,
			}));
		})
	);

	return withUniqueNames(teams, reservedNames);
};
