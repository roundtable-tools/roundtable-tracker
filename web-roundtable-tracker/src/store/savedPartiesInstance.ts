import { useStore } from 'zustand/react';
import { createSavedPartiesStore, SavedPartiesStore } from './savedParties';

let savedPartiesStore: ReturnType<typeof createSavedPartiesStore> | null = null;

export const getSavedPartiesStore = () => {
	if (savedPartiesStore === null) {
		savedPartiesStore = createSavedPartiesStore();
	}

	return savedPartiesStore;
};

export const useSavedPartiesStore = <T>(
	selector: (state: SavedPartiesStore) => T
) => useStore(getSavedPartiesStore(), selector);
