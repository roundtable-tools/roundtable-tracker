import { beforeEach, describe, expect, it } from 'vitest';
import { type Character } from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { STATUS } from '@/CommandHistory/common';
import {
	asksToReturnFromDelay,
	delayerReturningAfterTurn,
	getRoundActionCommand,
	returnPromptEntries,
	type RoundAction,
} from './roundActionCommand';

const character = (
	uuid: string,
	overrides: Partial<Character> = {}
): Character => ({
	uuid,
	name: uuid,
	initiative: 0,
	turnState: 'normal',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
	...overrides,
});

describe('delaying through a whole round', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;

	// Acts on the current participant the way the tracker's Next Turn does.
	const act = (action: RoundAction = 'end-turn') => {
		const state = encounterStore.getState();
		const command = getRoundActionCommand(
			state.charactersOrder[0],
			action,
			state,
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);
	};

	const state = () => encounterStore.getState();

	beforeEach(() => {
		encounterStore = createEncounterStore();
	});

	it('returns the delayer to its old spot when the order reaches it again', () => {
		state().startEncounter(['a', 'x', 'b', 'c'].map((id) => character(id)));

		act(); // a
		act('delay'); // x
		act(); // b
		act(); // c closes round 1

		expect(state().round).toBe(2);
		expect(state().delayedOrder).toEqual(['x']);
		expect(delayerReturningAfterTurn(state())).toBe('x');

		act(); // a

		expect(state().charactersOrder).toEqual(['x', 'b', 'c', 'a']);
		expect(state().delayedOrder).toEqual([]);
		expect(state().charactersMap.x.turnState).toBe('normal');
		expect(state().charactersWithTurn.has('x')).toBe(true);
	});

	it('returns a delayer whose spot opens the next round before that round', () => {
		state().startEncounter(['x', 'a', 'b'].map((id) => character(id)));

		act('delay'); // x
		act(); // a
		act(); // b closes round 1 and brings x back at the top of round 2

		expect(state().round).toBe(2);
		expect(state().charactersOrder[0]).toBe('x');
		expect(state().charactersMap.x.turnState).toBe('normal');
		expect(state().delayedOrder).toEqual([]);
	});

	it('keeps the current turn when someone else is knocked out before the old spot', () => {
		state().startEncounter(['a', 'x', 'b', 'c'].map((id) => character(id)));

		act(); // a
		act('delay'); // x
		act(); // b
		act(); // c closes round 1

		// Round 2, a's turn, x's spot is next: c drops during a's turn
		expect(
			getRoundActionCommand('c', 'ko', state(), { encounterStore }).execute()
		).toBe(STATUS.success);

		expect(state().charactersOrder).toEqual(['a', 'x', 'b', 'c']);
		expect(state().charactersWithTurn.has('a')).toBe(true);
		expect(state().charactersWithTurn.has('c')).toBe(false);
		expect(state().charactersMap.c.turnState).toBe('knocked-out');
		expect(state().delayedOrder).toEqual(['x']);

		act(); // a

		expect(state().charactersOrder[0]).toBe('x');
		expect(state().charactersMap.x.turnState).toBe('normal');
	});
});

describe('asksToReturnFromDelay', () => {
	it('skips the prompt when the only delayer comes back after this turn anyway', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'x', 'b'],
				delayedOrder: ['x'],
			})
		).toBe(false);
	});

	it('asks when another delayer could return, still listing the one coming back', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'x', 'b', 'y'],
				delayedOrder: ['x', 'y'],
			})
		).toBe(true);
	});

	it('asks for a delayer whose spot is not next', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'b', 'x'],
				delayedOrder: ['x'],
			})
		).toBe(true);
	});
});

describe('returnPromptEntries', () => {
	it('lists the nearest old spot first', () => {
		expect(
			returnPromptEntries({
				charactersOrder: ['a', 'b', 'y', 'c', 'x', 'z'],
				delayedOrder: ['x', 'y', 'z'],
			})
		).toEqual([
			{ id: 'y', distance: 1 },
			{ id: 'x', distance: 2 },
			// Spots of other delayers aren't turns, so they don't count
			{ id: 'z', distance: 2 },
		]);
	});

	it('gives distance 0 to the delayer whose spot is right after this turn', () => {
		expect(
			returnPromptEntries({
				charactersOrder: ['a', 'x', 'b'],
				delayedOrder: ['x'],
			})
		).toEqual([{ id: 'x', distance: 0 }]);
	});
});
