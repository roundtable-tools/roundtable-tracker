import { create } from 'zustand';

export const STATE = ['normal', 'delayed', 'knocked-out'] as const;
type State = (typeof STATE)[number];

const characters = new Array(10)
	.fill(0)
	.map((_, index) => ({
		name: `Character ${index + 1}`,
		initiative: Math.floor(Math.random() * 20) + 1,
		state: STATE[Math.floor(Math.random() * STATE.length)],
	}))
	.sort((a, b) => b.initiative - a.initiative);

export interface Character {
	name: string;
	initiative: number;
	state: State;
}
interface EncounterStore {
	characters: Character[];
}

export const useEncounterStore = create<EncounterStore>()(() => ({
	characters,
}));
