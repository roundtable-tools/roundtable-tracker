import { createStore } from 'zustand/vanilla';
import { Character } from './data';
import { UUID } from '@/utils/uuid';
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
	partyLevel: number;
	round: number;
	charactersWithTurn: Set<UUID>;
	history: Command[];
	redoStack: Command[];
	startEncounter: (characters: Character[]) => void;
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setPartyLevel: (partyLevel: number) => void;
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
		round: 1,
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
			state.charactersMap[uuid] = newCharacterValue;

			return { charactersMap: { ...state.charactersMap } };
		});

export const createEncounterStore = () =>
	createStore<EncounterStore>()(
		persist(
			(set) => ({
				charactersMap: {},
				charactersOrder: [],
				delayedOrder: [],
				round: 0,
				charactersWithTurn: new Set(),
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
					set(() => ({ encounterData })),
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
