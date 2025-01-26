import { create } from 'zustand';
import { Character, STATE } from './data';

const characters = new Array(10)
	.fill(0)
	.map((_, index) => ({
		name: `Character ${index + 1}`,
		initiative: Math.floor(Math.random() * 20) + 1,
		state: STATE[Math.floor(Math.random() * STATE.length)],
	}))
	.sort((a, b) => b.initiative - a.initiative);

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
}

interface EncounterStore {
	characters: Character[];
	updateCharacter: (
		index: number,
		character: ValueOrFunction<Character>
	) => void;
}

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

export const createEncounterStore = () =>
	create<EncounterStore>()((set) => ({
		characters,
		updateCharacter: (
			index: number,
			newCharacter: Character | ((current: Character) => Character)
		) => {
			set((state) => ({
				characters: state.characters.map((character, i) =>
					i === index ? unpackValue(newCharacter, character) : character
				),
			}));
		},
	}));

export const useEncounterStore = createEncounterStore();
