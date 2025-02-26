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
type LevelFormat = {
	0: RelativeNumber,
	1: number,
}

export type InitiativeParticipant = {
	uuid: string;
	tiePriority: Priority;
	initiative?: number;
	level: number;
} & Omit<Participant<typeof LEVEL_REPRESENTATION.Exact>,'count'>;

export type Participant<IsAbstract extends LevelRepresentation = LevelRepresentation> = {
	name: string;
	level: LevelFormat[IsAbstract];
	side: Alignment;
	count?: number;
	tiePriority?: Priority;
}

type ConcreteEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	level?: number;
	searchName: string;
	description: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Exact>[],
}

type AbstractEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	searchName: string;
	description: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Relative>[],
}

export type AbstractEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	levelRepresentation: typeof LEVEL_REPRESENTATION.Relative; // Abstract encounter with participants of levels relative to the encounter level
	variants?: AbstractEncounterVariant[];
} & Required<AbstractEncounterVariant>;

export type ConcreteEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	levelRepresentation: typeof LEVEL_REPRESENTATION.Exact; // Encounter with participants of specific levels
	variants?: (ConcreteEncounterVariant)[];
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
	searchName: 'Goblin Ambush | Moderate | Party 4 | Level 2',
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
			searchName: 'Goblin Ambush | Moderate | Party 4 | Level 1',
			participants: [
				{
					name: 'Weak Goblin',
					level: -2,
					side: ALIGNMENT.Opponents,
					count: 4,
				},
			],
		},{
			difficulty: DIFFICULTY.Low,
			description: 'Scout did not report back to the main group',
			searchName: 'Goblin Ambush | Low | Party 3 | Level 1',
			participants: [
				{
					name: 'Goblin',
					level: -1,
					side: ALIGNMENT.Opponents,
					count: 3,
				},
			],
		},{
			partySize: 5,
			description: 'Bigger party size',
			searchName: 'Goblin Ambush | Moderate | Party 5 | Level 2',
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