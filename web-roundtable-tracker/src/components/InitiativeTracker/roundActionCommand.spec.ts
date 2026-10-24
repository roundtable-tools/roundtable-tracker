import { beforeEach, describe, expect, it } from 'vitest';
import { type Character } from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { STATUS } from '@/CommandHistory/common';
import {
	asksToReturnFromDelay,
	delayerReturningAfterTurn,
	getRoundActionCommand,
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

	it('never sends back a participant that started silently delayed', () => {
		state().startEncounter([
			character('a'),
			character('s', { turnState: 'delayed', silentDelay: true }),
			character('b'),
		]);

		for (let turn = 0; turn < 6; turn++) act();

		expect(state().round).toBe(4);
		expect(state().delayedOrder).toEqual(['s']);
		expect(state().charactersMap.s.turnState).toBe('delayed');
	});
});

describe('asksToReturnFromDelay', () => {
	const characters = (...list: Character[]) =>
		Object.fromEntries(list.map((entry) => [entry.uuid, entry]));

	it('skips the prompt when the only delayer comes back after this turn anyway', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'x', 'b'],
				delayedOrder: ['x'],
				charactersMap: characters(
					character('a'),
					character('x', { turnState: 'delayed' }),
					character('b')
				),
			})
		).toBe(false);
	});

	it('asks when another delayer could return, still listing the one coming back', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'x', 'b', 'y'],
				delayedOrder: ['x', 'y'],
				charactersMap: characters(
					character('a'),
					character('x', { turnState: 'delayed' }),
					character('b'),
					character('y', { turnState: 'delayed' })
				),
			})
		).toBe(true);
	});

	it('asks for a delayer whose spot is not next', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'b', 'x'],
				delayedOrder: ['x'],
				charactersMap: characters(
					character('a'),
					character('b'),
					character('x', { turnState: 'delayed' })
				),
			})
		).toBe(true);
	});

	it('does not ask for a silent starting delay on its own', () => {
		const charactersMap = characters(
			character('a'),
			character('b'),
			character('s', { turnState: 'delayed', silentDelay: true })
		);

		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'b'],
				delayedOrder: ['s'],
				charactersMap,
			})
		).toBe(false);
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'b'],
				delayedOrder: ['s', 'x'],
				charactersMap: {
					...charactersMap,
					x: character('x', { turnState: 'delayed' }),
				},
			})
		).toBe(true);
	});

	it('asks again once a silent starter has joined the order and delays', () => {
		expect(
			asksToReturnFromDelay({
				charactersOrder: ['a', 'b', 's'],
				delayedOrder: ['s'],
				charactersMap: characters(
					character('a'),
					character('b'),
					character('s', { turnState: 'delayed', silentDelay: true })
				),
			})
		).toBe(true);
	});
});
