import { ConcreteEncounter } from './data';
import { migrateLegacyEncounter } from './legacyEncounterFields';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

export type SavedConcreteEncounter = ConcreteEncounter & {
	savedAt: string;
};

export interface SavedEncountersStore {
	savedEncounters: SavedConcreteEncounter[];
	addEncounter: (encounter: ConcreteEncounter) => void;
	updateEncounter: (
		id: string,
		partial: Partial<SavedConcreteEncounter>
	) => void;
	removeEncounter: (id: string) => void;
}

const mergeById = (
	items: SavedConcreteEncounter[],
	next: SavedConcreteEncounter
): SavedConcreteEncounter[] => {
	const existingIndex = items.findIndex((item) => item.id === next.id);

	if (existingIndex === -1) {
		return [...items, next];
	}

	const copy = [...items];
	copy[existingIndex] = next;

	return copy;
};

export const createSavedEncountersStore = () =>
	createStore<SavedEncountersStore>()(
		persist(
			(set) => ({
				savedEncounters: [],
				addEncounter: (encounter) =>
					set((state) => {
						const savedEncounter: SavedConcreteEncounter = {
							...encounter,
							savedAt: new Date().toISOString(),
						};

						return {
							savedEncounters: mergeById(state.savedEncounters, savedEncounter),
						};
					}),
				updateEncounter: (id, partial) =>
					set((state) => ({
						savedEncounters: state.savedEncounters.map((encounter) =>
							encounter.id === id
								? { ...encounter, ...partial, id: encounter.id }
								: encounter
						),
					})),
				removeEncounter: (id) =>
					set((state) => ({
						savedEncounters: state.savedEncounters.filter(
							(encounter) => encounter.id !== id
						),
					})),
			}),
			{
				name: 'saved-encounters-store',
				storage: createJSONStorage(() => localStorage),
				// 1: participants no longer start delayed or carry hiddenFromPlayers
				version: 1,
				migrate: (persistedState) => {
					const state = persistedState as Pick<
						SavedEncountersStore,
						'savedEncounters'
					>;

					return {
						...state,
						savedEncounters: (state?.savedEncounters ?? []).map(
							migrateLegacyEncounter
						),
					} as SavedEncountersStore;
				},
			}
		)
	);
