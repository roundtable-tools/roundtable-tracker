import { createJSONStorage, persist } from 'zustand/middleware';
import { createStore } from 'zustand/vanilla';

export const PARTY_ICONS = [
	'User',
	'Users',
	'Shield',
	'Sword',
	'Wand2',
	'Star',
	'Crown',
	'Flame',
	'Zap',
	'Skull',
	'Heart',
	'Axe',
	'Sparkles',
	'Swords',
	'Ghost',
] as const;

export type PartyIcon = (typeof PARTY_ICONS)[number];

export type PartyMember = {
	uuid: string;
	name: string;
	level: number;
	maxHealth?: number;
	tiePriority: boolean;
	player?: string;
	class?: string;
	ancestry?: string;
	ac?: number;
};

export type Party = {
	id: string;
	name: string;
	icon: PartyIcon;
	members: PartyMember[];
	savedAt: string;
};

export interface SavedPartiesStore {
	parties: Party[];
	lastUsedPartyId?: string;
	addParty: (party: Omit<Party, 'savedAt'>) => void;
	updateParty: (
		id: string,
		partial: Partial<Omit<Party, 'id' | 'savedAt'>>
	) => void;
	removeParty: (id: string) => void;
	setLastUsedPartyId: (id: string | undefined) => void;
}

export const createSavedPartiesStore = () =>
	createStore<SavedPartiesStore>()(
		persist(
			(set) => ({
				parties: [],
				lastUsedPartyId: undefined,
				addParty: (party) =>
					set((state) => {
						const savedParty: Party = {
							...party,
							savedAt: new Date().toISOString(),
						};
						const existingIndex = state.parties.findIndex(
							(p) => p.id === party.id
						);

						if (existingIndex === -1) {
							return { parties: [...state.parties, savedParty] };
						}

						const copy = [...state.parties];
						copy[existingIndex] = savedParty;

						return { parties: copy };
					}),
				updateParty: (id, partial) =>
					set((state) => ({
						parties: state.parties.map((party) =>
							party.id === id
								? {
										...party,
										...partial,
										id: party.id,
										savedAt: new Date().toISOString(),
									}
								: party
						),
					})),
				removeParty: (id) =>
					set((state) => ({
						parties: state.parties.filter((party) => party.id !== id),
						lastUsedPartyId:
							state.lastUsedPartyId === id ? undefined : state.lastUsedPartyId,
					})),
				setLastUsedPartyId: (id) => set({ lastUsedPartyId: id }),
			}),
			{
				name: 'saved-parties-store',
				storage: createJSONStorage(() => localStorage),
			}
		)
	);
