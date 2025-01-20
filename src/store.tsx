import { devtools } from 'zustand/middleware/devtools';
import { persist } from 'zustand/middleware/persist';
import { create } from 'zustand/react';

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

export const useEncounterStore = create<EncounterStore>()(
	devtools(
		persist(
			() => ({
				characters,
			}),
			{
				name: 'encounter',
			}
		)
	)
);
