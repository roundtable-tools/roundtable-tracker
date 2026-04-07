import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	PRIORITY,
	type ConcreteEncounter,
} from './data';
import { createSavedEncountersStore } from './savedEncounters';

const makeEncounter = (id: string): ConcreteEncounter => ({
	id,
	name: `Encounter ${id}`,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 5,
	partySize: 4,
	difficulty: DIFFICULTY.Moderate,
	description: 'Test encounter',
	participants: [
		{
			type: 'creature',
			name: 'Bandit',
			level: 5,
			side: ALIGNMENT.Opponents,
			tiePriority: PRIORITY.NPC,
			count: 1,
		},
	],
});

describe('savedEncounters store', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules();
	});

	it('adds a concrete encounter with savedAt metadata', () => {
		const store = createSavedEncountersStore();
		const encounter = makeEncounter('enc-1');

		store.getState().addEncounter(encounter);
		const state = store.getState();

		expect(state.savedEncounters).toHaveLength(1);
		expect(state.savedEncounters[0].id).toBe('enc-1');
		expect(state.savedEncounters[0].savedAt).toBeTypeOf('string');
	});

	it('upserts by id when addEncounter is called twice with same id', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));

		store
			.getState()
			.addEncounter({ ...makeEncounter('enc-1'), name: 'Updated Name' });

		const saved = store.getState().savedEncounters;
		expect(saved).toHaveLength(1);
		expect(saved[0].name).toBe('Updated Name');
	});

	it('updates an existing saved encounter partially', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));

		store
			.getState()
			.updateEncounter('enc-1', { name: 'Edited Encounter', partySize: 6 });

		const saved = store.getState().savedEncounters[0];
		expect(saved.name).toBe('Edited Encounter');
		expect(saved.partySize).toBe(6);
		expect(saved.id).toBe('enc-1');
	});

	it('does not change encounter id when update payload contains id', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));

		store.getState().updateEncounter('enc-1', {
			id: 'enc-2',
			name: 'Changed Name',
		});

		const saved = store.getState().savedEncounters;
		expect(saved).toHaveLength(1);
		expect(saved[0].id).toBe('enc-1');
		expect(saved[0].name).toBe('Changed Name');
	});

	it('does nothing when updating non-existent encounter id', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));

		store.getState().updateEncounter('missing-id', { name: 'No-op' });

		const saved = store.getState().savedEncounters;
		expect(saved).toHaveLength(1);
		expect(saved[0].name).toBe('Encounter enc-1');
	});

	it('removes a saved encounter by id', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));
		store.getState().addEncounter(makeEncounter('enc-2'));

		store.getState().removeEncounter('enc-1');

		const saved = store.getState().savedEncounters;
		expect(saved).toHaveLength(1);
		expect(saved[0].id).toBe('enc-2');
	});

	it('does nothing when removing unknown id', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));

		store.getState().removeEncounter('missing-id');

		expect(store.getState().savedEncounters).toHaveLength(1);
		expect(store.getState().savedEncounters[0].id).toBe('enc-1');
	});

	it('persists saved encounters to localStorage', () => {
		const store = createSavedEncountersStore();
		store.getState().addEncounter(makeEncounter('enc-1'));

		const hydratedStore = createSavedEncountersStore();
		const hydrated = hydratedStore.getState().savedEncounters;

		expect(hydrated).toHaveLength(1);
		expect(hydrated[0].id).toBe('enc-1');
	});
});

describe('savedEncounterInstance', () => {
	beforeEach(() => {
		localStorage.clear();
		vi.resetModules();
	});

	it('returns a singleton store instance', async () => {
		const module = await import('./savedEncounterInstance');
		const first = module.getSavedEncountersStore();
		const second = module.getSavedEncountersStore();

		expect(first).toBe(second);
	});
});
