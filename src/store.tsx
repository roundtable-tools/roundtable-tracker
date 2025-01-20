import { create } from 'zustand';

const characters = new Array(10)
	.fill(0)
	.map((_, index) => ({
		name: `Character ${index + 1}`,
		initiative: Math.floor(Math.random() * 20) + 1,
	}))
	.sort((a, b) => b.initiative - a.initiative);

interface EncounterStore {
	characters: { name: string; initiative: number }[];
}

export const useEncounterStore = create<EncounterStore>()(() => ({
	characters,
}));
