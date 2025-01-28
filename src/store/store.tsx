import { createStore } from 'zustand/vanilla';
import { Character, STATE } from './data';
import { generateUUID, UUID } from '@/utils/uuid';
import { useStore } from 'zustand';

const characters = new Array(10).fill(0).map((_, index) => ({
	uuid: generateUUID(),
	name: `Character ${index + 1}`,
	initiative: Math.floor(Math.random() * 20) + 1,
	state: STATE[Math.floor(Math.random() * STATE.length)],
}));

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
}

export interface EncounterStore {
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
}

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

export const createEncounterStore = () =>
	createStore<EncounterStore>()((set) => ({
		charactersMap: {},
		charactersOrder: [],
		setCharacters: (characters: Character[]) => {
			set(() => {
				const charactersMap = characters.reduce(
					(acc, character) => {
						acc[character.uuid] = character;
						return acc;
					},
					{} as Record<UUID, Character>
				);

				const charactersOrder = characters.map((character) => character.uuid);

				return { charactersMap, charactersOrder };
			});
		},
		updateCharacter: (uuid: UUID, newCharacter: ValueOrFunction<Character>) =>
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
	}));
export const encounterStore = createEncounterStore();

encounterStore.getState().setCharacters(characters);

export const useEncounterStore = <T,>(selector: (state: EncounterStore) => T) =>
	useStore(encounterStore, selector);
