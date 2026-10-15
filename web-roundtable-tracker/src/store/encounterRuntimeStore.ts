import { createStore } from 'zustand/vanilla';
import { Character, type ParticipantDcEntry } from './data';
import { UUID } from '@/utils/uuid';

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

export interface EncounterStore {
	encounterData?: Encounter;
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	delayedOrder: UUID[];
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>;
	partyLevel: number;
	round: number;
	charactersWithTurn: Set<UUID>;
	history: Command[];
	redoStack: Command[];
	startEncounter: (
		characters: Character[],
		trackerMetaMap?: Record<UUID, TrackerParticipantMeta>
	) => void;
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setPartyLevel: (partyLevel: number) => void;
	setTrackerMetaMap: (metaMap: Record<UUID, TrackerParticipantMeta>) => void;
	setHistory: (history: ValueOrFunction<Command[]>) => void;
	setRedoStack: (redoStack: ValueOrFunction<Command[]>) => void;
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

// Simple hazards never take turns, so they stay out of the turn order and the
// turn bookkeeping. They live only in charactersMap (and the hazards panel).
export const isSimpleHazardId = (
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>,
	uuid: UUID
) => trackerMetaMap[uuid]?.isSimpleHazard === true;

const parseCharacters = (
	characters: Character[],
	trackerMetaMap: Record<UUID, TrackerParticipantMeta> = {}
) => {
	const charactersMap = characters.reduce(
		(acc, character) => {
			acc[character.uuid] = character;

			return acc;
		},
		{} as Record<UUID, Character>
	);

	const charactersId = characters
		.map((character) => character.uuid)
		.filter((uuid) => !isSimpleHazardId(trackerMetaMap, uuid));
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

const startEncounter = (
	characters: Character[],
	trackerMetaMap: Record<UUID, TrackerParticipantMeta> = {}
): Partial<EncounterStore> => {
	const { charactersMap, charactersOrder, delayedOrder } = parseCharacters(
		characters,
		trackerMetaMap
	);

	return {
		charactersMap,
		charactersOrder,
		delayedOrder,
		trackerMetaMap,
		round: 1,
		// Starting out delayed doesn't cost the round-1 turn: a delaying
		// participant can still return to the order and act this round.
		charactersWithTurn: new Set(delayedOrder.concat(charactersOrder)),
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
				charactersWithTurn: new Set(),
				history: [],
				redoStack: [],
				partyLevel: 1,
				encounterData: undefined,
				startEncounter: (
					characters: Character[],
					trackerMetaMap?: Record<UUID, TrackerParticipantMeta>
				) => set(() => startEncounter(characters, trackerMetaMap)),
				setCharacters: (characters: Character[]) =>
					set(() => parseCharacters(characters)),
				updateCharacter: updateCharacter(set),
				setPartyLevel: (partyLevel: number) => set(() => ({ partyLevel })),
				setEncounterData: (encounterData: Encounter) =>
					set(() => ({ encounterData })),
				setTrackerMetaMap: (metaMap: Record<UUID, TrackerParticipantMeta>) =>
					set(() => ({ trackerMetaMap: metaMap })),
				setHistory: simpleSet<Command[], typeof set>(set, 'history'),
				setRedoStack: simpleSet<Command[], typeof set>(set, 'redoStack'),
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
