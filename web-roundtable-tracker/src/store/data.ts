import { UUID } from "@/utils/uuid";
import { z } from "zod";

export const STATE = [
	"normal",
	"active",
	"on-hold",
	"delayed",
	"knocked-out",
] as const;
type State = (typeof STATE)[number];
export const indexToLetter = (index: number) => String.fromCharCode(97 + index);

export type CharacterConfig = {
	maxHealth: number;
	health: number;
	tempHealth: number;
	initiative: number;
} & InitiativeParticipant;

export const characterConfigToCharacter = (
	participant: CharacterConfig,
): Character => {
	const maxHealth = participant.maxHealth ?? 1;
	const health = participant.health ?? maxHealth;
	const tempHealth = participant.tempHealth ?? 0;

	return {
		uuid: participant.uuid,
		name: participant.name,
		initiative: participant.initiative ?? 0,
		health,
		maxHealth,
		tempHealth,
		turnState: participant.startingState ?? "normal",
		group: participant.side === ALIGNMENT.PCs ? "players" : "enemies",
		hasTurn: false,
	};
};

export interface Character {
	uuid: UUID;
	name: string;
	initiative: number;
	turnState: State;
	hasTurn: boolean;
	health: number;
	maxHealth: number;
	tempHealth: number;
	group?: "players" | "enemies";
	wounded?: number;
	knockedBy?: UUID;
	level?: number; // Optional level property
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
	difficulty: Difficulty,
) => keyof typeof DIFFICULTY = (difficulty: Difficulty) =>
	(Object.entries(DIFFICULTY).find(([, value]) => value == difficulty)?.[0] ??
		"Unknown") as keyof typeof DIFFICULTY;

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
	level: LevelFormat[0 | 1],
) => Number.isInteger(level)
	? (level as number)
	: partyLevel + Number.parseInt(level as string);

export type ParticipantAdjustment =
	| "weak"
	| "elite"
	| "elite-offense"
	| "elite-defense"
	| "none";

export const adjustedLevel = (
	baseLevel: number,
	adjustment?: ParticipantAdjustment,
): number => {
	switch (adjustment) {
		case "elite":
			return baseLevel + (baseLevel <= 0 ? 2 : 1);
		case "weak":
			return baseLevel - (baseLevel === 1 ? 2 : 1);
		case "elite-offense":
		case "elite-defense":
			return baseLevel + (baseLevel <= 0 ? 1 : 0.5);
		default:
			return baseLevel;
	}
};

export const formatAdjustedLevel = (level: number): string => {
	if (Number.isInteger(level)) {
		return `${level}`;
	}

	const lower = Math.floor(level);
	const upper = Math.ceil(level);
	const midpoint = (lower + upper) / 2;

	return level <= midpoint ? `${lower}(+)` : `${upper}(-)`;
};

export const participantsToLevelRange: <T extends LevelRepresentation>(
	participants: Participant<T>[],
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
	"Knocked-Out": 2,
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

export type CombatantParticipant<
	IsAbstract extends LevelRepresentation = LevelRepresentation,
> = {
	name: string;
	level: LevelFormat[IsAbstract];
	side: Alignment;
	count?: number;
	tiePriority?: Priority;
	maxHealth?: number;
	health?: number;
	tempHealth?: number;
	// TEMP: Set state to @ostatni5's format until the types get unified
	// startingState?: INITIATIVE_STATE.Normal,
	startingState?: "normal" | "delayed" | "knocked-out";
	description?: string;
	dcs?: Array<{ inline: string; value: number }>;
};

export type Creature<
	IsAbstract extends LevelRepresentation = LevelRepresentation,
> = CombatantParticipant<IsAbstract> & {
	type: "creature";
	adjustment?: ParticipantAdjustment;
};

export type Hazard<
	IsAbstract extends LevelRepresentation = LevelRepresentation,
> = CombatantParticipant<IsAbstract> & {
	type: "hazard";
	successesToDisable: number;
	isComplexHazard?: boolean;
};

export type Participant<
	IsAbstract extends LevelRepresentation = LevelRepresentation,
> = Creature<IsAbstract> | Hazard<IsAbstract>;

export type InitiativeParticipant = {
	uuid: string;
	tiePriority: Priority;
	initiative?: number;
	level: number;
} & Omit<Creature<typeof LEVEL_REPRESENTATION.Exact>, "type" | "adjustment"> & {
	adjustment?: ParticipantAdjustment;
};
type ConcreteEncounterVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	level?: number;
	description: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Exact>[];
};
type EncounterTemplateVariant = {
	difficulty?: Difficulty;
	partySize?: number;
	description: string; // Description of external conditions that trigger the variant
	participants: Participant<typeof LEVEL_REPRESENTATION.Relative>[];
};

export type NarrativeSlot = {
	id: string;
	type: "default" | "reinforcement" | "ongoing";
	description?: string;
	trigger: {
		round: number;
		frequency?: number;
	};
	participants?: Participant<typeof LEVEL_REPRESENTATION.Relative>[];
};

export type EncounterTemplate = {
	id: string; // Unique identifier for the encounter
	name: string;
	difficultyLabel?: keyof typeof DIFFICULTY;
	level?: [number, number]; // Range of levels for the encounter
	levelRepresentation: typeof LEVEL_REPRESENTATION.Relative; // Abstract encounter with participants of levels relative to the encounter level
	difficulty?: Difficulty; // Optional difficulty for abstract encounters
	partySize?: number; // Optional party size for abstract encounters
	description: string; // Description of the encounter
	participants: Participant<typeof LEVEL_REPRESENTATION.Relative>[]; // List of participants
	narrativeSlots?: NarrativeSlot[];
	variants?: EncounterTemplateVariant[];
};

export type AbstractEncounter = EncounterTemplate;

export type EncounterNotes = {
	gm?: string;
	monster?: string;
	player?: string;
};

export type ConcreteEncounter = {
	id: string; // Unique identifier for the encounter
	name: string;
	difficultyLabel?: keyof typeof DIFFICULTY;
	levelRepresentation: typeof LEVEL_REPRESENTATION.Exact; // Encounter with participants of specific levels
	level: number; // Concrete level for the encounter
	partySize: number; // Number of party members
	difficulty: Difficulty; // Difficulty setting
	description: string; // Description of the encounter
	participants: Participant<typeof LEVEL_REPRESENTATION.Exact>[]; // List of participants
	narrativeSlots?: NarrativeSlot[];
	variants?: ConcreteEncounterVariant[];
	notes?: EncounterNotes;
};

const dcsSchema = z.array(
	z.object({
		inline: z.string(),
		value: z.number(),
	})
);

const combatantParticipantSchema = z.object({
	name: z.string(),
	level: z.number(),
	side: z.nativeEnum(ALIGNMENT),
	count: z.number().optional(),
	tiePriority: z.nativeEnum(PRIORITY).optional(),
	maxHealth: z.number().optional(),
	health: z.number().optional(),
	tempHealth: z.number().optional(),
	// TEMP: Set state to @ostatni5's format until the types get unified
	// startingState: z.nativeEnum(INITIATIVE_STATE).optional(),
	startingState: z.enum(["normal", "delayed", "knocked-out"]).optional(),
	description: z.string().optional(),
	dcs: dcsSchema.optional(),
});

const creatureSchema = combatantParticipantSchema.extend({
	type: z.literal("creature"),
	adjustment: z
		.enum(["weak", "elite", "elite-offense", "elite-defense", "none"])
		.optional(),
});

const hazardSchema = combatantParticipantSchema.extend({
	type: z.literal("hazard"),
	successesToDisable: z.number(),
	isComplexHazard: z.boolean().optional(),
});

const participantSchema = z.union([creatureSchema, hazardSchema]);

const narrativeSlotSchema = z.object({
	id: z.string(),
	type: z.enum(["default", "reinforcement", "ongoing"]),
	description: z.string().optional(),
	trigger: z.object({
		round: z.number(),
		frequency: z.number().optional(),
	}),
	participants: z.array(participantSchema).optional(),
});

const encounterNotesSchema = z.object({
	gm: z.string().optional(),
	monster: z.string().optional(),
	player: z.string().optional(),
});

export const ConcreteEncounterSchema = z.object({
	id: z.string(),
	name: z.string(),
	difficulty: z.nativeEnum(DIFFICULTY),
	level: z.number(),
	levelRepresentation: z.literal(LEVEL_REPRESENTATION.Exact),
	partySize: z.number(),
	description: z.string(),
	participants: z.array(participantSchema),
	narrativeSlots: z.array(narrativeSlotSchema).optional(),
	notes: encounterNotesSchema.optional(),
});

export type Encounter = EncounterTemplate | ConcreteEncounter;
// Example usage

export const exampleEncounter: Encounter = {
	id: "encounter-001",
	name: "Goblin Ambush",
	level: 2,
	difficulty: DIFFICULTY.Moderate,
	description: "A group of goblins ambush the party",
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	participants: [
		{
			name: "Goblin",
			level: -1,
			side: ALIGNMENT.Opponents,
			type: "creature",
			count: 4,
		},
	],
	variants: [
		{
			level: 1,
			description: "PCs found the goblins before level up",
			participants: [
				{
					name: "Weak Goblin",
					level: -2,
					side: ALIGNMENT.Opponents,
					type: "creature",
					count: 4,
				},
			],
		},
		{
			difficulty: DIFFICULTY.Low,
			description: "Scout did not report back to the main group",
			participants: [
				{
					name: "Goblin",
					level: -1,
					side: ALIGNMENT.Opponents,
					type: "creature",
					count: 3,
				},
			],
		},
		{
			partySize: 5,
			description: "Bigger party size",
			participants: [
				{
					name: "Goblin",
					level: -1,
					side: ALIGNMENT.Opponents,
					type: "creature",
					count: 2,
				},
				{
					name: "Elite Goblin",
					level: 0,
					side: ALIGNMENT.Opponents,
					type: "creature",
					count: 2,
				},
			],
		},
	],
};
