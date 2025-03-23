import { UUID } from '@/utils/uuid';

export const STATE = ['normal', 'delayed', 'knocked-out'] as const;
type State = (typeof STATE)[number];
export const indexToLetter = (index: number) => String.fromCharCode(97 + index);

export const initiativeParticipantToCharacter = (
	participant: InitiativeParticipant
): Character => ({
	uuid: participant.uuid,
	name: participant.name,
	initiative: participant.initiative ?? 0,
	turnState: 'normal',
	group: participant.side === ALIGNMENT.PCs ? 'players' : 'enemies',
});

export interface Character {
	uuid: UUID;
	name: string;
	initiative: number;
	turnState: State;
	group?: 'players' | 'enemies';
	wounded?: number;
	knockedBy?: UUID;
}

export const DIFFICULTY = {
	Unknown: -1,
	Trivial: 0,
	Low: 1,
	Moderate: 2,
	Severe: 3,
	Extreme: 4,
} as const;

export const difficultyToString: (
	difficulty: Difficulty
) => keyof typeof DIFFICULTY = (difficulty: Difficulty) =>
	(Object.entries(DIFFICULTY).find(([, value]) => value == difficulty)?.[0] ??
		'Unknown') as keyof typeof DIFFICULTY;

export const PRIORITY = {
	PC: 0,
	NPC: 1,
	SPECIAL: 2,
} as const;

export const ALIGNMENT = {
	PCs: 0,
	Opponents: 1,
	Neutral: 2,
} as const;

export const LEVEL_REPRESENTATION = {
	Relative: 0,
	Exact: 1,
} as const;

export const normalizeLevel = (
	partyLevel: number,
	level: LevelFormat[0 | 1]
) =>
	Number.isInteger(level)
		? (level as number)
		: partyLevel + Number.parseInt(level as string);

export const participantsToLevelRange: <T extends LevelRepresentation>(
	participants: Participant<T>[]
) => [number, number] = (participants) => {
	const levels = participants.map((participant) => {
		const level = Number.isInteger(participant.level)
			? (participant.level as number)
			: Number.parseInt(participant.level as string);

		return level;
	});
	const participantLevelRange = [Math.min(...levels), Math.max(...levels)];

	// Enemy levels range from -1 to 25 inclusive
	return [
		Math.max(-1 - participantLevelRange[0], 1),
		Math.min(25 - participantLevelRange[1], 20),
	];
};

export const INITIATIVE_STATE = {
	Normal: 0,
	Delayed: 1,
	'Knocked-Out': 2,
} as const;

type ValueOf<T> = T[keyof T];
type Difficulty = ValueOf<typeof DIFFICULTY>;
type Alignment = ValueOf<typeof ALIGNMENT>;
type Priority = ValueOf<typeof PRIORITY>;
type LevelRepresentation = ValueOf<typeof LEVEL_REPRESENTATION>;
type RelativeNumber = `+${number}` | `-${number}`;
type LevelFormat = {
	0: RelativeNumber;
	1: number;
};

export type InitiativeParticipant = {
	uuid: string;
	tiePriority: Priority;
	initiative?: number;
	level: number;
} & Omit<Participant<typeof LEVEL_REPRESENTATION.Exact>, 'count'>;

export type Participant<
	IsAbstract extends LevelRepresentation = LevelRepresentation,
> = {
	name: string;
	level: LevelFormat[IsAbstract];
	side: Alignment;
	count?: number;
	tiePriority?: Priority;
	// TEMP: Set state to @ostatni5's format until the types get unified
	// startingState?: INITIATIVE_STATE.Normal,
	startingState?: 'normal' | 'delayed' | 'knocked-out';
};
type ConcreteEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	level?: number;
	description: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Exact>[];
};
type AbstractEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	description: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Relative>[];
};

export type AbstractEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	difficultyLabel?: keyof typeof DIFFICULTY;
	level?: [number, number]; // Range of levels for the encounter
	levelRepresentation: typeof LEVEL_REPRESENTATION.Relative; // Abstract encounter with participants of levels relative to the encounter level
	variants?: AbstractEncounterVariant[];
} & Required<AbstractEncounterVariant>;

export type ConcreteEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	difficultyLabel?: keyof typeof DIFFICULTY;
	levelRepresentation: typeof LEVEL_REPRESENTATION.Exact; // Encounter with participants of specific levels
	variants?: ConcreteEncounterVariant[];
} & Required<ConcreteEncounterVariant>;

export type Encounter = AbstractEncounter | ConcreteEncounter;
// Example usage

export const exampleEncounter: Encounter = {
	id: 'encounter-001',
	name: 'Goblin Ambush',
	level: 2,
	difficulty: DIFFICULTY.Moderate,
	description: 'A group of goblins ambush the party',
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	participants: [
		{
			name: 'Goblin',
			level: -1,
			side: ALIGNMENT.Opponents,
			count: 4,
		},
	],
	variants: [
		{
			level: 1,
			description: 'PCs found the goblins before level up',
			participants: [
				{
					name: 'Weak Goblin',
					level: -2,
					side: ALIGNMENT.Opponents,
					count: 4,
				},
			],
		},
		{
			difficulty: DIFFICULTY.Low,
			description: 'Scout did not report back to the main group',
			participants: [
				{
					name: 'Goblin',
					level: -1,
					side: ALIGNMENT.Opponents,
					count: 3,
				},
			],
		},
		{
			partySize: 5,
			description: 'Bigger party size',
			participants: [
				{
					name: 'Goblin',
					level: -1,
					side: ALIGNMENT.Opponents,
					count: 2,
				},
				{
					name: 'Elite Goblin',
					level: 0,
					side: ALIGNMENT.Opponents,
					count: 2,
				},
			],
		},
	],
};
