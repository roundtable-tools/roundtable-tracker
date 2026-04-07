import { describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type AbstractEncounter,
	type ConcreteEncounter,
} from '@/store/data';
import {
	createDirectoryEntries,
	getDefaultShowTemplates,
	toEncounter,
} from './EncounterDirectory';
import type { SavedConcreteEncounter } from '@/store/savedEncounters';

const templateEncounter: AbstractEncounter = {
	id: 'template-1',
	name: 'Template Encounter',
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	difficulty: DIFFICULTY.Low,
	partySize: 4,
	description: 'Template entry',
	participants: [
		{
			type: 'creature',
			name: 'Bandit',
			level: '+0',
			side: ALIGNMENT.Opponents,
			count: 2,
		},
	],
};

const savedConcreteEncounter: ConcreteEncounter = {
	id: 'saved-1',
	name: 'Saved Encounter',
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 3,
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	description: 'Saved entry',
	participants: [
		{
			type: 'creature',
			name: 'Ogre',
			level: 3,
			side: ALIGNMENT.Opponents,
			count: 1,
		},
	],
};

const savedEncounter: SavedConcreteEncounter = {
	...savedConcreteEncounter,
	savedAt: '2026-04-06T00:00:00.000Z',
};

describe('EncounterDirectory data helpers', () => {
	it('defaults to hiding templates when saved encounters exist', () => {
		expect(getDefaultShowTemplates(0)).toBe(true);
		expect(getDefaultShowTemplates(1)).toBe(false);
	});

	it('merges saved encounters before templates when templates are shown', () => {
		const data = createDirectoryEntries(
			[templateEncounter],
			[savedEncounter],
			true
		);

		expect(data).toHaveLength(2);
		expect(data[0].source).toBe('saved');
		expect(data[0].directoryId).toBe('saved:saved-1');
		expect(data[1].source).toBe('template');
		expect(data[1].directoryId).toBe('template:template-1');
	});

	it('returns only saved encounters when templates are hidden', () => {
		const data = createDirectoryEntries(
			[templateEncounter],
			[savedEncounter],
			false
		);

		expect(data).toHaveLength(1);
		expect(data[0].source).toBe('saved');
		expect(data[0].id).toBe('saved-1');
	});

	it('strips directory metadata when converting entry to encounter', () => {
		const [entry] = createDirectoryEntries([], [savedEncounter], false);
		const encounter = toEncounter(entry);

		expect(encounter.id).toBe('saved-1');
		expect('directoryId' in encounter).toBe(false);
		expect('source' in encounter).toBe(false);
	});
});
