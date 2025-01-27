import { create } from 'zustand';
import { Character, STATE } from './data';
import { generateUUID, UUID } from '@/utils/uuid';

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

interface EncounterStore {
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
}

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

export const createEncounterStore = () =>
	create<EncounterStore>()((set) => ({
		charactersMap: characters.reduce(
			(acc, character) => {
				acc[character.uuid] = character;
				return acc;
			},
			{} as Record<UUID, Character>
		),
		charactersOrder: characters.map((character) => character.uuid),
		updateCharacter: (uuid: UUID, newCharacter: ValueOrFunction<Character>) => {
			return set((state) => {
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
		},
	}));

export const useEncounterStore = createEncounterStore();
