import {
	ALIGNMENT,
	Encounter,
	indexToLetter,
	InitiativeParticipant,
	normalizeLevel,
	Participant,
	PRIORITY,
} from '@/store/data';
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

export const generateParticipants = (
	encounterData: Encounter | undefined,
	partyLevel: number
): InitiativeParticipant[][] => {
	if (!encounterData) return [];

	const reinforcementParticipants = (encounterData.narrativeSlots ?? [])
		.filter((slot) => slot.type === 'reinforcement')
		.flatMap((slot) => slot.participants ?? []);

	const allParticipants = [
		...(encounterData.participants ?? []),
		...reinforcementParticipants,
	];

	const groupedBySide = allParticipants.reduce(
		(acc, participant) => {
			if (!acc[participant.side]) {
				acc[participant.side] = [];
			}
			acc[participant.side].push(participant);

			return acc;
		},
		{} as Record<number, Participant<0 | 1>[]>
	);

	return Object.values(groupedBySide).map((participants) =>
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

			return Array.from({ length: count ?? 1 }).map((_, index, { length }) => ({
				uuid: generateUUID(),
				tiePriority: PRIORITY.NPC,
				initiative: Math.floor(Math.random() * 20) + 1 + initiativeBonus,
				...participant,
				level: normalizeLevel(partyLevel, level),
				name:
					length > 1
						? `${baseName} ${indexToLetter(index).toUpperCase()}`
						: baseName,
				isSimpleHazard: isSimpleHazard,
			}));
		})
	);
};
