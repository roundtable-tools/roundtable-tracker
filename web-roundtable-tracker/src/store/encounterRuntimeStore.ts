import { createStore } from 'zustand/vanilla';
import { Character, type ParticipantDcEntry, type SkillChallengeSlot } from './data';
import { UUID } from '@/utils/uuid';
import type {
	EncounterFactionColorKey,
	EncounterFactionIconKey,
} from '@/models/encounters/factions';

export type TrackerParticipantRole =
	| 'pc'
	| 'opponent'
	| 'neutral'
	| 'ally'
	| 'hazard'
	| 'reinforcement';

export type TrackerParticipantSideTheme = 'pc' | 'opponent' | 'ally' | 'other';

export type TrackerParticipantMeta = {
	role: TrackerParticipantRole;
	sideTheme: TrackerParticipantSideTheme;
	ownerKey?: string;
	ownerLabel?: string;
	factionId?: string;
	factionName?: string;
	factionIcon?: EncounterFactionIconKey;
	factionColor?: EncounterFactionColorKey;
	hasHealthData?: boolean;
	isSimpleHazard: boolean;
	disableChecksRequired: number;
	disableChecksSucceeded: number;
	notes: string;
	hardness?: number;
	initiativeBonus?: number;
	dcs?: ParticipantDcEntry[];
	adjustmentDescription?: string;
	adjustmentLevelModifier?: number;
	reinforcementSlotId?: string;
	reinforcementPending?: boolean;
};
import { persist, createJSONStorage } from 'zustand/middleware';
import { Encounter } from './data';
import { Command } from '@/CommandHistory/common';
import { jsonConfiguration } from './serializer';
import { CommandJSON } from '@/CommandHistory/serialization';
import { splitArray } from '@/utils/array';

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
}

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

export const INITIATIVE_PHASE = {
	PreInitiative: 'pre-initiative',
	Active: 'active',
} as const;

export type InitiativePhase =
	(typeof INITIATIVE_PHASE)[keyof typeof INITIATIVE_PHASE];

export type TurnDurationHistoryEntry = {
	id: string;
	round: number;
	participantId: UUID;
	participantName: string;
	ownerKey: string;
	ownerLabel: string;
	elapsedMs: number;
};

export type RoundDurationHistoryEntry = {
	round: number;
	elapsedMs: number;
};

export interface EncounterStore {
	encounterData?: Encounter;
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	delayedOrder: UUID[];
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>;
	partyLevel: number;
	round: number;
	initiativePhase: InitiativePhase;
	activeTurnParticipantId?: UUID;
	activeTurnRound?: number;
	activeTurnStartedAtMs?: number;
	activeRoundStartedAtMs?: number;
	turnElapsedByRoundParticipant: Record<string, number>;
	roundElapsedByRound: Record<number, number>;
	lastTurnElapsedMs: number;
	lastRoundElapsedMs: number;
	turnDurationHistory: TurnDurationHistoryEntry[];
	roundDurationHistory: RoundDurationHistoryEntry[];
	charactersWithTurn: Set<UUID>;
	skillChallengesActive: SkillChallengeSlot[];
	history: Command[];
	redoStack: Command[];
	startEncounter: (characters: Character[]) => void;
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setPartyLevel: (partyLevel: number) => void;
	setTrackerMetaMap: (metaMap: Record<UUID, TrackerParticipantMeta>) => void;
	setHistory: (history: ValueOrFunction<Command[]>) => void;
	setRedoStack: (redoStack: ValueOrFunction<Command[]>) => void;
	updateSkillChallengeProgress: (skillChallengeId: string) => void;
}

export type EncounterStoreJson = {
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	history: CommandJSON[];
	redoStack: CommandJSON[];
};

function simpleSet<
	T,
	K extends (fn: (state: EncounterStore) => Record<string, unknown>) => void,
>(set: K, key: keyof EncounterStore) {
	return (value: ValueOrFunction<T>) => {
		set((state) => {
			const newValue = unpackValue(value, state[key] as T);

			return { [key]: newValue };
		});
	};
}

const parseCharacters = (characters: Character[]) => {
	const charactersMap = characters.reduce(
		(acc, character) => {
			acc[character.uuid] = character;

			return acc;
		},
		{} as Record<UUID, Character>
	);

	const charactersId = characters.map((character) => character.uuid);
	const [delayedOrder, charactersOrder] = splitArray(
		charactersId,
		(uuid) => charactersMap[uuid].turnState === 'delayed'
	);

	return {
		charactersMap,
		charactersOrder,
		delayedOrder,
	};
};

const resetHistory = () => ({ history: [], redoStack: [] });

const startEncounter = (characters: Character[]): Partial<EncounterStore> => {
	const { charactersMap, charactersOrder, delayedOrder } =
		parseCharacters(characters);

	return {
		charactersMap,
		charactersOrder,
		delayedOrder,
		trackerMetaMap: {},
		round: 1,
		initiativePhase: INITIATIVE_PHASE.PreInitiative,
		activeTurnParticipantId: undefined,
		activeTurnRound: undefined,
		activeTurnStartedAtMs: undefined,
		activeRoundStartedAtMs: undefined,
		turnElapsedByRoundParticipant: {},
		roundElapsedByRound: {},
		lastTurnElapsedMs: 0,
		lastRoundElapsedMs: 0,
		turnDurationHistory: [],
		roundDurationHistory: [],
		charactersWithTurn: new Set(charactersOrder),
		...resetHistory(),
	};
};

const updateCharacter =
	(set: (fn: (state: EncounterStore) => Partial<EncounterStore>) => void) =>
	(uuid: UUID, newCharacter: ValueOrFunction<Character>) =>
		set((state) => {
			const character = state.charactersMap[uuid];

			if (!character) {
				console.error(`Character with uuid ${uuid} not found`);

				return {};
			}
			const newCharacterValue = unpackValue(newCharacter, character);

			return {
				charactersMap: {
					...state.charactersMap,
					[uuid]: newCharacterValue,
				},
			};
		});

export const createEncounterStore = () =>
	createStore<EncounterStore>()(
		persist(
			(set) => ({
				charactersMap: {},
				charactersOrder: [],
				delayedOrder: [],
				trackerMetaMap: {},
				round: 0,
				initiativePhase: INITIATIVE_PHASE.PreInitiative,
				activeTurnParticipantId: undefined,
				activeTurnRound: undefined,
				activeTurnStartedAtMs: undefined,
				activeRoundStartedAtMs: undefined,
				turnElapsedByRoundParticipant: {},
				roundElapsedByRound: {},
				lastTurnElapsedMs: 0,
				lastRoundElapsedMs: 0,
				turnDurationHistory: [],
				roundDurationHistory: [],
				charactersWithTurn: new Set(),
				skillChallengesActive: [],
				history: [],
				redoStack: [],
				partyLevel: 1,
				encounterData: undefined,
				startEncounter: (characters: Character[]) =>
					set(() => startEncounter(characters)),
				setCharacters: (characters: Character[]) =>
					set(() => parseCharacters(characters)),
				updateCharacter: updateCharacter(set),
				setPartyLevel: (partyLevel: number) => set(() => ({ partyLevel })),
				setEncounterData: (encounterData: Encounter) =>
					set(() => ({
						encounterData,
						skillChallengesActive: encounterData.skillChallengeSlots ?? [],
					})),
				setTrackerMetaMap: (metaMap: Record<UUID, TrackerParticipantMeta>) =>
					set(() => ({ trackerMetaMap: metaMap })),
				setHistory: simpleSet<Command[], typeof set>(set, 'history'),
				setRedoStack: simpleSet<Command[], typeof set>(set, 'redoStack'),
				updateSkillChallengeProgress: (_skillChallengeId: string) => {
					// This method triggers a re-render by causing a state update
					// The actual progress update is done in the command's execute() method
					set((state) => ({
						skillChallengesActive: [...state.skillChallengesActive],
					}));
				},
			}),
			{
				name: 'encounter-store',
				storage: createJSONStorage<EncounterStoreJson>(
					() => localStorage,
					jsonConfiguration
				),
			}
		)
	);
