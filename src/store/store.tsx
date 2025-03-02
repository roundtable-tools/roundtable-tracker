import { createStore } from 'zustand/vanilla';
import { Character } from './data';
import { generateUUID, UUID } from '@/utils/uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Encounter, InitiativeParticipant, PRIORITY } from './data';
import { Command } from '@/CommandHistory/common';
import { jsonConfiguration } from './serializer';
import { CommandJSON } from '@/CommandHistory/serialization';
import { splitArray } from '@/utils/array';
import { nextRound } from './operations';

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
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
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setPartyLevel: (partyLevel: number) => void;
	setHistory: (history: ValueOrFunction<Command[]>) => void;
	setRedoStack: (redoStack: ValueOrFunction<Command[]>) => void;
	nextRound: () => void;
	generateCharactersFromEncounterData: (encounterData: Encounter) => void;
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
			(set) => {
				const setCharacters = (characters: Character[]) =>
					set(() => {
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

						return { charactersMap, charactersOrder, delayedOrder };
					});
				const updateCharacter = (
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
					});
				const nextRound = () =>
					set((state) => {
						return {
							round: state.round + 1,
							charactersWithTurn: new Set(state.charactersOrder),
						};
					});
				const setPartyLevel = (partyLevel: number) =>
					set(() => ({ partyLevel }));
				const setEncounterData = (encounterData: Encounter) =>
					set(() => ({ encounterData }));
				const generateCharactersFromEncounterData = (
					encounterData: Encounter
				) =>
					set((state) => {
						const totalParticipants = encounterData.participants.flatMap(
							({ level, startingState: turnState, ...participant }) =>
								Array.from({ length: participant.count ?? 1 }).map(() => ({
									uuid: generateUUID(),
									tiePriority: PRIORITY.NPC,
									...participant,
									level: Number.isInteger(level)
										? (level as number)
										: state.partyLevel + Number.parseInt(level as string),
									initiative: 0,
									turnState: turnState ?? 'normal',
								}))
						) satisfies InitiativeParticipant[];
						setCharacters(totalParticipants);
						return {};
					});
				const setHistory = simpleSet<Command[], typeof set>(set, 'history');
				const setRedoStack = simpleSet<Command[], typeof set>(set, 'redoStack');
				return {
					charactersMap: {},
					charactersOrder: [],
					delayedOrder: [],
					round: 0,
					charactersWithTurn: new Set(),
					history: [],
					redoStack: [],
					partyLevel: 1,
					encounterData: undefined,
					setCharacters,
					updateCharacter,
					nextRound,
					setHistory,
					setRedoStack,
					setPartyLevel,
					setEncounterData,
					generateCharactersFromEncounterData,
				};
			},
			{
				name: 'encounter-store',
				storage: createJSONStorage<EncounterStoreJson>(
					() => localStorage,
					jsonConfiguration
				),
			}
		)
	);
