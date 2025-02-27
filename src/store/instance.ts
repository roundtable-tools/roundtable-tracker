import { generateUUID } from '@/utils/uuid';
import { createEncounterStore, EncounterStore } from './store';
import { Character, STATE } from './data';
import { useStore } from 'zustand/react';
import { registerSerializableCommands } from '@/CommandHistory/commandRegistry';

const characters = new Array(10).fill(0).map(
	(_, index) =>
		({
			uuid: generateUUID(),
			name: `Character ${index + 1}`,
			initiative: Math.floor(Math.random() * 20) + 1,
			state: STATE[Math.floor(Math.random() * STATE.length)],
			group: index % 2 === 0 ? 'players' : 'enemies',
			wounded: 0,
		}) as Character
);

let encounterStore: ReturnType<typeof createEncounterStore> | null = null;

export const getEncounterStore = () => {
	if (encounterStore === null) {
		registerSerializableCommands();
		encounterStore = createEncounterStore();

		if (encounterStore.getState().charactersOrder.length === 0)
			encounterStore.getState().setCharacters(characters);
	}
	return encounterStore;
};

export const useEncounterStore = <T>(selector: (state: EncounterStore) => T) =>
	useStore(getEncounterStore(), selector);
