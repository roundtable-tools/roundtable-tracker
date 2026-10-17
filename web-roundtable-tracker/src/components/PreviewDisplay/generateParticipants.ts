import {
	ALIGNMENT,
	Encounter,
	InitiativeParticipant,
	NarrativeSlot,
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

/** A reinforcement slot's participants, as preview rows. */
export type ReinforcementTeam = {
	slot: NarrativeSlot;
	participants: InitiativeParticipant[];
};

/**
 * The participants of every reinforcement slot, expanded by `count`, with an
 * initiative rolled now (d20 + initiative bonus) unless the slot fixes it. The
 * preview lets the GM change it, and the reinforcements then join at that
 * initiative when triggered. HP defaults to level × 5, as for arrivals rolled
 * on the spot. Names are made unique against `takenNames` (the party and the
 * starting roster), which are never renamed.
 */
export const generateReinforcements = (
	encounterData: Encounter | undefined,
	partyLevel: number,
	takenNames: string[] = []
): ReinforcementTeam[] => {
	const teams = (encounterData?.narrativeSlots ?? [])
		.filter(
			(slot) =>
				slot.type === 'reinforcement' && (slot.participants?.length ?? 0) > 0
		)
		.map((slot) => ({
			slot,
			participants: (slot.participants ?? []).flatMap(
				({ level, name, count, ...participant }) => {
					const normalizedLevel = normalizeLevel(partyLevel, level);
					const fixedInitiative = (participant as { initiative?: unknown })
						.initiative;
					const initiativeBonus =
						typeof participant.initiativeBonus === 'number' &&
						Number.isFinite(participant.initiativeBonus)
							? participant.initiativeBonus
							: 0;
					const maxHealth =
						participant.maxHealth ?? Math.max(1, normalizedLevel * 5);

					return Array.from({ length: Math.max(1, count ?? 1) }).map(
						(): InitiativeParticipant => ({
							uuid: generateUUID(),
							tiePriority: PRIORITY.NPC,
							...participant,
							initiative:
								typeof fixedInitiative === 'number' &&
								Number.isFinite(fixedInitiative)
									? fixedInitiative
									: Math.floor(Math.random() * 20) + 1 + initiativeBonus,
							level: normalizedLevel,
							name: name.trim() || 'Reinforcement',
							maxHealth,
							health: participant.health ?? maxHealth,
							tempHealth: participant.tempHealth ?? 0,
							isSimpleHazard:
								participant.type === 'hazard' && !participant.isComplexHazard,
						})
					);
				}
			),
		}));
	const names = uniqueNames(
		teams.flatMap(({ participants }) => participants.map(({ name }) => name)),
		takenNames
	);
	let index = 0;

	return teams.map((team) => ({
		...team,
		participants: team.participants.map((participant) => ({
			...participant,
			name: names[index++],
		})),
	}));
};
