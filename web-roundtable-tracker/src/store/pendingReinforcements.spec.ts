import { describe, expect, it } from 'vitest';
import { Character } from './data';
import { TrackerParticipantMeta } from './encounterRuntimeStore';
import {
	movedInReorder,
	PendingReinforcement,
	placePendingReinforcements,
	respotAfterReorder,
	spotIndex,
	spotsFromSortedRoster,
} from './pendingReinforcements';

const character = (
	uuid: string,
	initiative: number,
	overrides: Partial<Character> = {}
): Character => ({
	uuid,
	name: uuid,
	initiative,
	turnState: 'normal',
	group: 'enemies',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
	...overrides,
});

const meta: TrackerParticipantMeta = {
	role: 'reinforcement',
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
	reinforcementSlotId: 'slot',
};

const pending = (
	uuid: string,
	above: string | null,
	below: string | null,
	overrides: Partial<Character> = {}
): PendingReinforcement => ({
	slotId: 'slot',
	character: character(uuid, 10, overrides),
	meta,
	above,
	below,
});

const charactersMap = Object.fromEntries(
	[
		character('a', 20),
		character('b', 15),
		character('c', 10),
		character('d', 5),
	].map((entry) => [entry.uuid, entry])
);

describe('spotsFromSortedRoster', () => {
	it('gives each reinforcement its neighbours among the starting order', () => {
		const spots = spotsFromSortedRoster(
			['r1', 'a', 'r2', 'r3', 'b', 'delayed', 'r4'],
			(uuid) => uuid.startsWith('r'),
			(uuid) => uuid === 'a' || uuid === 'b'
		);

		expect(Object.fromEntries(spots)).toEqual({
			r1: { above: null, below: 'a' },
			r2: { above: 'a', below: 'b' },
			r3: { above: 'a', below: 'b' },
			r4: { above: 'b', below: null },
		});
	});
});

describe('spotIndex', () => {
	it('goes before the participant below, or at the end', () => {
		expect(spotIndex(pending('r', 'a', 'b'), ['a', 'b', 'c'], {})).toBe(1);
		expect(spotIndex(pending('r', 'c', null), ['a', 'b', 'c'], {})).toBe(3);
		expect(spotIndex(pending('r', null, 'a'), ['a', 'b', 'c'], {})).toBe(0);
	});

	it('goes after the participant above when the one below has left', () => {
		expect(spotIndex(pending('r', 'a', 'gone'), ['a', 'b', 'c'], {})).toBe(1);
		expect(spotIndex(pending('r', null, 'gone'), ['a', 'b'], {})).toBe(0);
	});

	it('falls back to its initiative when both neighbours have left', () => {
		expect(
			spotIndex(
				pending('r', 'gone', 'also-gone'),
				['a', 'b', 'c', 'd'],
				charactersMap
			)
		).toBe(3);
	});
});

describe('movedInReorder', () => {
	it('finds the participants that left the longest kept run', () => {
		expect(movedInReorder(['a', 'b', 'c', 'd'], ['a', 'c', 'd', 'b'])).toEqual(
			new Set(['b'])
		);
		expect(movedInReorder(['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual(new Set());
	});
});

describe('respotAfterReorder', () => {
	const oldOrder = ['a', 'b', 'c', 'd'];

	it('moves with the participant below when someone else is reordered', () => {
		// r sits between b and c; a is dragged below c
		const [respotted] = respotAfterReorder(
			[pending('r', 'b', 'c')],
			oldOrder,
			['b', 'c', 'a', 'd'],
			new Set(['a']),
			charactersMap
		);

		expect(respotted).toMatchObject({ above: 'b', below: 'c' });

		// c is moved with it when c's neighbours are dragged around it
		const [followed] = respotAfterReorder(
			[pending('r', 'b', 'c')],
			oldOrder,
			['a', 'c', 'b', 'd'],
			new Set(['b']),
			charactersMap
		);

		expect(followed).toMatchObject({ above: 'a', below: 'c' });
	});

	it('stays below the participant above when the one below is reordered', () => {
		const [respotted] = respotAfterReorder(
			[pending('r', 'b', 'c')],
			oldOrder,
			['c', 'a', 'b', 'd'],
			new Set(['c']),
			charactersMap
		);

		expect(respotted).toMatchObject({ above: 'b', below: 'd' });
	});

	it('stays at the top or the end of the round', () => {
		const [top, end] = respotAfterReorder(
			[pending('top', null, 'a'), pending('end', 'd', null)],
			oldOrder,
			['b', 'c', 'd', 'a'],
			new Set(['a']),
			charactersMap
		);

		expect(top).toMatchObject({ above: null, below: 'b' });
		expect(end).toMatchObject({ above: 'a', below: null });
	});

	it('tells a dragged neighbour from a swap by who was dragged', () => {
		// a and b swap: dragging b up keeps r under a, dragging a down keeps r
		// above b
		const draggedB = respotAfterReorder(
			[pending('r', 'a', 'b')],
			['a', 'b', 'c'],
			['b', 'a', 'c'],
			new Set(['b']),
			charactersMap
		);
		const draggedA = respotAfterReorder(
			[pending('r', 'a', 'b')],
			['a', 'b', 'c'],
			['b', 'a', 'c'],
			new Set(['a']),
			charactersMap
		);

		expect(draggedB[0]).toMatchObject({ above: 'a', below: 'c' });
		expect(draggedA[0]).toMatchObject({ above: null, below: 'b' });
	});
});

describe('placePendingReinforcements', () => {
	it('places an arrival whose spot is still to come before its neighbour, with a turn', () => {
		// a acted, b is up
		const placed = placePendingReinforcements(
			{
				charactersOrder: ['b', 'c', 'd', 'a'],
				delayedOrder: [],
				charactersWithTurn: new Set(['b', 'c', 'd']),
				charactersMap,
			},
			[pending('r', 'c', 'd')]
		);

		expect(placed.charactersOrder).toEqual(['b', 'c', 'r', 'd', 'a']);
		expect(placed.charactersWithTurn.has('r')).toBe(true);
	});

	it('places an arrival whose spot has passed without a turn this round', () => {
		const state = {
			charactersOrder: ['c', 'd', 'a', 'b'],
			delayedOrder: [],
			charactersWithTurn: new Set(['c', 'd']),
			charactersMap,
		};
		const between = placePendingReinforcements(state, [pending('r', 'a', 'b')]);
		const beforeCurrent = placePendingReinforcements(state, [
			pending('r', 'b', 'c'),
		]);

		expect(between.charactersOrder).toEqual(['c', 'd', 'a', 'r', 'b']);
		expect(between.charactersWithTurn.has('r')).toBe(false);
		expect(beforeCurrent.charactersOrder).toEqual(['c', 'd', 'a', 'b', 'r']);
		expect(beforeCurrent.charactersWithTurn.has('r')).toBe(false);
	});

	it('makes an arrival at the top of a round nobody has acted in the current actor', () => {
		const placed = placePendingReinforcements(
			{
				charactersOrder: ['a', 'b'],
				delayedOrder: [],
				charactersWithTurn: new Set(['a', 'b']),
				charactersMap,
			},
			[pending('r1', null, 'a'), pending('r2', null, 'a')]
		);

		expect(placed.charactersOrder).toEqual(['r1', 'r2', 'a', 'b']);
		expect(placed.charactersWithTurn).toEqual(new Set(['a', 'b', 'r1', 'r2']));
	});

	it('keeps arrivals sharing a spot in their initiative order', () => {
		const placed = placePendingReinforcements(
			{
				charactersOrder: ['a', 'b', 'c'],
				delayedOrder: [],
				charactersWithTurn: new Set(['a', 'b', 'c']),
				charactersMap,
			},
			// b left the order, so both go after a
			[pending('r1', 'a', 'gone'), pending('r2', 'a', 'gone')]
		);

		expect(placed.charactersOrder).toEqual(['a', 'r1', 'r2', 'b', 'c']);
	});

	it('keeps arrivals sharing the top spot in order when the participant below has left', () => {
		const placed = placePendingReinforcements(
			{
				charactersOrder: ['a', 'b'],
				delayedOrder: [],
				charactersWithTurn: new Set(['a', 'b']),
				charactersMap,
			},
			[pending('r1', null, 'gone'), pending('r2', null, 'gone')]
		);

		expect(placed.charactersOrder).toEqual(['r1', 'r2', 'a', 'b']);
	});

	it('compares a later arrival placed by initiative against earlier arrivals', () => {
		// Both neighbours left: r1 (12) and r2 (11) are placed by initiative,
		// between b (15) and c (10)
		const placed = placePendingReinforcements(
			{
				charactersOrder: ['a', 'b', 'c', 'd'],
				delayedOrder: [],
				charactersWithTurn: new Set(['a', 'b', 'c', 'd']),
				charactersMap,
			},
			[
				pending('r1', 'gone', 'also-gone', { initiative: 12 }),
				pending('r2', 'gone', 'also-gone', { initiative: 11 }),
			]
		);

		expect(placed.charactersOrder).toEqual(['a', 'b', 'r1', 'r2', 'c', 'd']);
	});

	it('sends arrivals that come in delayed to the delayed list, with a turn only when their spot is ahead', () => {
		const placed = placePendingReinforcements(
			{
				charactersOrder: ['b', 'c', 'a'],
				delayedOrder: [],
				charactersWithTurn: new Set(['b', 'c']),
				charactersMap,
			},
			[
				pending('early', null, 'a', { turnState: 'delayed' }),
				pending('late', 'c', null, { turnState: 'delayed' }),
			]
		);

		expect(placed.charactersOrder).toEqual(['b', 'c', 'a']);
		expect(placed.delayedOrder).toEqual(['early', 'late']);
		expect(placed.charactersWithTurn.has('early')).toBe(false);
		expect(placed.charactersWithTurn.has('late')).toBe(true);
	});
});
