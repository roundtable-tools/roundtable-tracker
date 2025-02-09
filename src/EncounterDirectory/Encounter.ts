export const DIFFICULTY = {
	'Trivial': 0,
	'Low': 1,
	'Moderate': 2,
	'Severe': 3,
	'Extreme': 4
} as const
export const PRIORITY = {
	'PC': 0,
	'NPC': 1,
	'SPECIAL': 2
} as const
export const ALIGNMENT = {
	'PCs': 0,
	'Opponents': 1,
	'Neutral': 2,
} as const
export const LEVEL_REPRESENTATION = {
	'Relative': 0,
	'Exact': 1,
} as const

type ValueOf<T> = T[keyof T]
type Difficulty = ValueOf<typeof DIFFICULTY>
type Alignment = ValueOf<typeof ALIGNMENT>
type Priority = ValueOf<typeof PRIORITY>
type LevelRepresentation = ValueOf<typeof LEVEL_REPRESENTATION>
type RelativeNumber = `+${number}` | `-${number}`

export type Participant<IsAbstract extends LevelRepresentation> = {
	name: string;
	level: [0|1] extends [IsAbstract] ? RelativeNumber|number : ([IsAbstract] extends [0] ? RelativeNumber : ([IsAbstract] extends [1] ? number : never));
	side: Alignment;
	count?: number;
	tiePriority?: Priority;
}

type ExactEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	level?: number;
	externalConditions: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Exact>[],
}

type AbstractEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	externalConditions: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Relative>[],
}

export type AbstractEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	levelRepresentation: typeof LEVEL_REPRESENTATION.Relative; // Whether the encounter uses abstract levels
	variants?: AbstractEncounterVariant[];
} & Omit<Required<AbstractEncounterVariant>,'externalConditions'>;

export type ExactEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	levelRepresentation: typeof LEVEL_REPRESENTATION.Exact; // Whether the encounter uses abstract levels
	variants?: (ExactEncounterVariant)[];
} & Omit<Required<ExactEncounterVariant>,'externalConditions'>;

export type Encounter = AbstractEncounter | ExactEncounter;

// Utility types for sorting and filtering
export type SortableEncounterFields = 'difficulty' | 'level' | 'partySize' | 'name';

// Example usage 
export const exampleEncounter: Encounter = {
	id: 'encounter-001',
	name: 'Goblin Ambush',
	level: 2,
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	participants: [
		{
			name: 'Goblin',
			level: -1,
			side: ALIGNMENT.Opponents,
			count: 4,
			tiePriority: PRIORITY.NPC,
		},
	],
	variants: [
		{
			level: 1,
			externalConditions: 'PCs found the goblins before level up',
			participants: [
				{
					name: 'Weak Goblin',
					level: -2,
					side: ALIGNMENT.Opponents,
					count: 4,
					tiePriority: PRIORITY.NPC,
				},
			],
		},{
			difficulty: DIFFICULTY.Low,
			externalConditions: 'Scout did not report back to the main group',
			participants: [
				{
					name: 'Goblin',
					level: -1,
					side: ALIGNMENT.Opponents,
					count: 3,
					tiePriority: PRIORITY.NPC,
				},
			],
		},{
			partySize: 5,
			externalConditions: 'Bigger party size',
			participants: [
				{
					name: 'Goblin',
					level: -1,
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
				{
					name: 'Elite Goblin',
					level: 0,
					side: ALIGNMENT.Opponents,
					count: 2,
					tiePriority: PRIORITY.NPC,
				},
			],
		},
	],
};