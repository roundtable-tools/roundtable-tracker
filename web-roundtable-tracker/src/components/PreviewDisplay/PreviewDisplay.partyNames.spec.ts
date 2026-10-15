import { createElement, type DependencyList } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
	ALIGNMENT,
	DIFFICULTY,
	type Encounter,
	LEVEL_REPRESENTATION,
} from '@/store/data';

const encounter: Encounter = {
	id: 'party-names',
	name: 'Party names',
	description: '',
	difficulty: DIFFICULTY.Low,
	partySize: 2,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 1,
	participants: [
		{
			type: 'creature',
			name: 'Goblin',
			level: 1,
			side: ALIGNMENT.Opponents,
			count: 2,
			adjustment: 'none',
		},
	],
};

const mocks = vi.hoisted(() => ({
	generateParticipantsCalls: 0,
	participantsDeps: [] as DependencyList[],
}));

// Record the dependencies of the memo that generates the creatures
vi.mock('react', async (importOriginal) => {
	const actual = await importOriginal<typeof import('react')>();

	return {
		...actual,
		useMemo: <T>(factory: () => T, deps: DependencyList) => {
			const callsBefore = mocks.generateParticipantsCalls;
			const value = actual.useMemo(factory, deps);

			if (mocks.generateParticipantsCalls > callsBefore) {
				mocks.participantsDeps.push(deps);
			}

			return value;
		},
	};
});

vi.mock('./generateParticipants', async (importOriginal) => {
	const actual =
		await importOriginal<typeof import('./generateParticipants')>();

	return {
		generateParticipants: (
			...args: Parameters<typeof actual.generateParticipants>
		) => {
			mocks.generateParticipantsCalls += 1;

			return actual.generateParticipants(...args);
		},
	};
});

vi.mock('@/store/encounterRuntimeInstance', () => ({
	useEncounterStore: <T>(
		selector: (state: {
			partyLevel: number;
			startEncounter: () => void;
			encounterData: Encounter;
		}) => T
	) =>
		selector({
			partyLevel: 1,
			startEncounter: () => {},
			encounterData: encounter,
		}),
}));

import { PreviewDisplay } from './PreviewDisplay';

describe('PreviewDisplay creature generation', () => {
	it('depends on the party names, not the party, so a new party with the same names keeps the creatures', () => {
		// Each render builds a new party array with the same names
		renderToStaticMarkup(createElement(PreviewDisplay));
		renderToStaticMarkup(createElement(PreviewDisplay));

		expect(mocks.participantsDeps).toHaveLength(2);

		const [first, second] = mocks.participantsDeps;

		expect(first).toHaveLength(second.length);
		first.forEach((dependency, index) =>
			expect(Object.is(dependency, second[index])).toBe(true)
		);
	});
});
