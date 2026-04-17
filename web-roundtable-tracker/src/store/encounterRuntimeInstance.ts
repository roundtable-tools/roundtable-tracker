import { createEncounterStore, EncounterStore } from './encounterRuntimeStore';
import { useStore } from 'zustand/react';
import { registerSerializableCommands } from '@/CommandHistory/commandRegistry';

let encounterStore: ReturnType<typeof createEncounterStore> | null = null;

export const getEncounterStore = () => {
	if (encounterStore === null) {
		registerSerializableCommands();
		encounterStore = createEncounterStore();
	}

	return encounterStore;
};

export const useEncounterStore = <T>(selector: (state: EncounterStore) => T) =>
	useStore(getEncounterStore(), selector);
