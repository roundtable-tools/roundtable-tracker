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
	updateCharacter: (
		index: number,
		character: Character | ((character: Character) => Character)
	) => void;
}
export const createEncounterStore = () =>
	create<EncounterStore>()((set) => ({
		characters,
		updateCharacter: (
			index: number,
			character: Character | ((character: Character) => Character)
		) => {
			set((state) => {
				const currentCharacter = state.characters[index];

				const newCharacter =
					typeof character === 'function'
						? character(currentCharacter)
						: character;

				return {
					characters: state.characters.map((char, i) =>
						i === index ? newCharacter : char
					),
				};
			});
		},
	}));

export const useEncounterStore = createEncounterStore();
