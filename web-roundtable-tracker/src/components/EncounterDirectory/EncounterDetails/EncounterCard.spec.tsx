import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	ALIGNMENT,
	type Encounter,
} from '@/store/data';

const mocks = vi.hoisted(() => ({
	navigate: vi.fn(),
	useEncounterStore: vi.fn(),
	useSavedEncountersStore: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
	useNavigate: () => mocks.navigate,
}));

vi.mock('@/store/encounterRuntimeInstance', () => ({
	useEncounterStore: (
		selector: (state: {
			partyLevel: number;
			setPartyLevel: (value: number) => void;
		}) => unknown
	) => mocks.useEncounterStore(selector),
}));

vi.mock('@/store/savedEncounterInstance', () => ({
	useSavedEncountersStore: (
		selector: (state: {
			addEncounter: (encounter: unknown) => void;
			savedEncounters: Array<{ id: string }>;
		}) => unknown
	) => mocks.useSavedEncountersStore(selector),
}));

import { EncounterCard } from './EncounterCard';

const importedEncounter: Encounter = {
	id: 'imported-encounter',
	name: 'Imported Encounter',
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 2,
	partySize: 4,
	difficulty: DIFFICULTY.Moderate,
	description: 'Imported encounter description',
	participants: [
		{
			type: 'creature',
			name: 'Ogre',
			level: 2,
			side: ALIGNMENT.Opponents,
			count: 1,
		},
	],
	variants: [
		{
			level: 3,
			partySize: 5,
			difficulty: DIFFICULTY.Severe,
			description: 'Variant A',
			participants: [
				{
					type: 'creature',
					name: 'Ogre',
					level: 3,
					side: ALIGNMENT.Opponents,
					count: 2,
				},
			],
		},
	],
};

describe('EncounterCard imported encounter actions', () => {
	beforeEach(() => {
		mocks.navigate.mockReset();
		mocks.useEncounterStore.mockImplementation(
			(
				selector: (state: {
					partyLevel: number;
					setPartyLevel: (value: number) => void;
				}) => unknown
			) => selector({ partyLevel: 2, setPartyLevel: vi.fn() })
		);
		mocks.useSavedEncountersStore.mockImplementation(
			(
				selector: (state: {
					addEncounter: (encounter: unknown) => void;
					savedEncounters: Array<{ id: string }>;
				}) => unknown
			) => selector({ addEncounter: vi.fn(), savedEncounters: [] })
		);
	});

	it('shows Load to Editor for imported exact encounters', () => {
		const html = renderToStaticMarkup(
			createElement(EncounterCard, {
				selectedEncounter: importedEncounter,
				submit: vi.fn(),
				close: vi.fn(),
			})
		);

		expect(html).toContain('Load to Editor');
		expect(html).toContain('Imported Encounter');
	});

	it('does not show Load to Editor for templates', () => {
		const html = renderToStaticMarkup(
			createElement(EncounterCard, {
				selectedEncounter: importedEncounter,
				source: 'template',
				submit: vi.fn(),
				close: vi.fn(),
			})
		);

		expect(html).not.toContain('Load to Editor');
		// Template mode uses the existing template action instead.
		expect(html).toContain('Encounter Template');
	});
});
