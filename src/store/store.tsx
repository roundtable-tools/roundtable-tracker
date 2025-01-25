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

interface EncounterStore {
	characters: Character[];
	updateCharacter: (index: number, character: Character) => void;
}
export const useEncounterStore = create<EncounterStore>()((set) => ({
	characters,
	updateCharacter: (index: number, character: Character) => {
		set((state) => ({
			characters: state.characters.map((char, i) =>
				i === index ? character : char
			),
		}));
	},
}));
