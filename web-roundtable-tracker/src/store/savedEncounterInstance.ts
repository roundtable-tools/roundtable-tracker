import { useStore } from 'zustand/react';
import {
	createSavedEncountersStore,
	SavedEncountersStore,
} from './savedEncounters';

let savedEncounterStore: ReturnType<typeof createSavedEncountersStore> | null =
	null;

export const getSavedEncountersStore = () => {
	if (savedEncounterStore === null) {
		savedEncounterStore = createSavedEncountersStore();
	}

	return savedEncounterStore;
};

export const useSavedEncountersStore = <T>(
	selector: (state: SavedEncountersStore) => T
) => useStore(getSavedEncountersStore(), selector);
