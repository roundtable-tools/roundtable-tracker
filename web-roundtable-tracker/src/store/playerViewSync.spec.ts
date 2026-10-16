import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEncounterStore } from './encounterRuntimeStore';
import { Character, DIFFICULTY, Encounter, LEVEL_REPRESENTATION } from './data';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { STATUS } from '@/CommandHistory/common';
import {
	createLocalPlayerViewChannel,
	ENCOUNTER_STORE_KEY,
	isEncounterRunning,
	parsePlayerViewSnapshot,
	type PlayerViewChannel,
} from './playerViewSync';

const character = (uuid: string, name: string, initiative: number) =>
	({
		uuid,
		name,
		initiative,
		turnState: 'normal',
		group: 'players',
		health: 20,
		maxHealth: 20,
		tempHealth: 0,
	}) as Character;

const encounter: Encounter = {
	id: 'bridge',
	name: 'Bridge Fight',
	description: 'Goblins hold the bridge',
	difficulty: DIFFICULTY.Moderate,
	partySize: 2,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 1,
	participants: [],
};

const hero = character('hero', 'Hero', 20);
const goblin = character('goblin', 'Goblin', 10);

/** Fires a `storage` event as the browser does in the other windows. */
const fireStorageEvent = (target: EventTarget, key: string | null) =>
	target.dispatchEvent(Object.assign(new Event('storage'), { key }));

describe('player view sync', () => {
	let tracker: ReturnType<typeof createEncounterStore>;
	let playerWindow: EventTarget;
	let channel: PlayerViewChannel;

	beforeEach(() => {
		tracker = createEncounterStore();
		playerWindow = new EventTarget();
		channel = createLocalPlayerViewChannel(localStorage, playerWindow);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const startTrackerEncounter = () => {
		tracker.getState().startEncounter([hero, goblin]);
		tracker.getState().setEncounterData(encounter);
	};

	it('has no snapshot before the tracker stores an encounter', () => {
		expect(channel.getSnapshot()).toBeNull();
		expect(isEncounterRunning(channel.getSnapshot())).toBe(false);
	});

	it('reads the encounter the tracker stored', () => {
		startTrackerEncounter();

		const snapshot = channel.getSnapshot();

		expect(isEncounterRunning(snapshot)).toBe(true);
		expect(snapshot?.encounterData?.name).toBe('Bridge Fight');
		expect(snapshot?.charactersOrder).toEqual(['hero', 'goblin']);
		expect(snapshot?.charactersMap.hero.health).toBe(20);
		expect(snapshot?.charactersWithTurn).toBeInstanceOf(Set);
	});

	it('returns the same snapshot until the stored encounter changes', () => {
		startTrackerEncounter();
		const first = channel.getSnapshot();

		expect(channel.getSnapshot()).toBe(first);

		tracker.getState().updateCharacter('hero', (prev) => ({
			...prev,
			health: 12,
		}));

		const second = channel.getSnapshot();

		expect(second).not.toBe(first);
		expect(second?.charactersMap.hero.health).toBe(12);
	});

	it('follows tracker commands and their undo', () => {
		startTrackerEncounter();
		const listener = vi.fn();
		channel.subscribe(listener);
		const beforeEndTurn = channel.getSnapshot();
		const endTurn = new EndTurnCommand(
			{ uuid: 'hero' },
			{ encounterStore: tracker }
		);

		expect(endTurn.execute()).toBe(STATUS.success);
		fireStorageEvent(playerWindow, ENCOUNTER_STORE_KEY);

		expect(listener).toHaveBeenCalledTimes(1);
		expect(channel.getSnapshot()).not.toBe(beforeEndTurn);
		expect(channel.getSnapshot()?.charactersOrder).toEqual(
			tracker.getState().charactersOrder
		);
		expect(channel.getSnapshot()?.charactersMap.hero.turnState).toBe(
			tracker.getState().charactersMap.hero.turnState
		);

		expect(endTurn.undo()).toBe(STATUS.success);
		fireStorageEvent(playerWindow, ENCOUNTER_STORE_KEY);

		expect(listener).toHaveBeenCalledTimes(2);
		expect(channel.getSnapshot()?.charactersOrder).toEqual(['hero', 'goblin']);
	});

	it('notifies on the encounter key and on a cleared storage only', () => {
		const listener = vi.fn();
		channel.subscribe(listener);

		fireStorageEvent(playerWindow, 'vite-ui-theme');
		expect(listener).not.toHaveBeenCalled();

		fireStorageEvent(playerWindow, ENCOUNTER_STORE_KEY);
		fireStorageEvent(playerWindow, null);
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it('stops notifying after unsubscribing', () => {
		const listener = vi.fn();
		const unsubscribe = channel.subscribe(listener);

		unsubscribe();
		fireStorageEvent(playerWindow, ENCOUNTER_STORE_KEY);

		expect(listener).not.toHaveBeenCalled();
	});

	it('shows the waiting state again when the stored encounter is removed', () => {
		startTrackerEncounter();
		expect(isEncounterRunning(channel.getSnapshot())).toBe(true);

		localStorage.removeItem(ENCOUNTER_STORE_KEY);

		expect(channel.getSnapshot()).toBeNull();
	});

	it('never writes to the storage', () => {
		startTrackerEncounter();
		const setItem = vi.spyOn(localStorage, 'setItem');
		const removeItem = vi.spyOn(localStorage, 'removeItem');
		channel.subscribe(() => channel.getSnapshot());

		channel.getSnapshot();
		fireStorageEvent(playerWindow, ENCOUNTER_STORE_KEY);

		expect(setItem).not.toHaveBeenCalled();
		expect(removeItem).not.toHaveBeenCalled();
	});

	describe('parsePlayerViewSnapshot', () => {
		it('returns null for a missing or unreadable value', () => {
			expect(parsePlayerViewSnapshot(null)).toBeNull();
			expect(parsePlayerViewSnapshot('not json')).toBeNull();
			expect(parsePlayerViewSnapshot('{"version":0}')).toBeNull();
		});

		it('is not running without encounter data or participants', () => {
			const snapshot = parsePlayerViewSnapshot(
				JSON.stringify({ state: { charactersOrder: ['hero'] } })
			);

			expect(snapshot).not.toBeNull();
			expect(isEncounterRunning(snapshot)).toBe(false);
			expect(
				isEncounterRunning(
					parsePlayerViewSnapshot(
						JSON.stringify({ state: { encounterData: encounter } })
					)
				)
			).toBe(false);
		});
	});
});
