import { createStore } from 'zustand/vanilla';
import { Character } from './data';
import { UUID } from '@/utils/uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Command } from '@/CommandHistory/common';
import { jsonConfiguration } from './serializer';
import { CommandJSON } from '@/CommandHistory/serialization';

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
}

export interface EncounterStore {
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	round: number;
	charactersWithTurn: Set<UUID>;
	history: Command[];
	redoStack: Command[];
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setHistory: (history: ValueOrFunction<Command[]>) => void;
	setRedoStack: (redoStack: ValueOrFunction<Command[]>) => void;
	nextRound: () => void;
}

export type EncounterStoreJson = {
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	history: CommandJSON[];
	redoStack: CommandJSON[];
};

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

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

export const createEncounterStore = () =>
	createStore<EncounterStore>()(
		persist(
			(set) => ({
				charactersMap: {},
				charactersOrder: [],
				round: 0,
				charactersWithTurn: new Set(),
				history: [],
				redoStack: [],
				setCharacters: (characters: Character[]) => {
					set(() => {
						const charactersMap = characters.reduce(
							(acc, character) => {
								acc[character.uuid] = character;
								return acc;
							},
							{} as Record<UUID, Character>
						);

						const charactersOrder = characters.map(
							(character) => character.uuid
						);

						return { charactersMap, charactersOrder };
					});
				},
				updateCharacter: (
					uuid: UUID,
					newCharacter: ValueOrFunction<Character>
				) =>
					set((state) => {
						const character = state.charactersMap[uuid];
						if (!character) {
							console.error(`Character with uuid ${uuid} not found`);
							return {};
						}

						const newCharacterValue = unpackValue(newCharacter, character);

						state.charactersMap[uuid] = newCharacterValue;

						return {
							charactersMap: { ...state.charactersMap },
						};
					}),
				nextRound: () => {
					set((state) => {
						return {
							round: state.round + 1,
							charactersWithTurn: new Set(state.charactersOrder),
						};
					});
				},

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
