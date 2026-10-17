import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import {
	ALIGNMENT,
	Character,
	DIFFICULTY,
	Encounter,
	LEVEL_REPRESENTATION,
} from '@/store/data';
import { STATUS } from '../common';
import { ReorderCharactersCommand } from './ReorderCharactersCommand';
import { TriggerReinforcementEventCommand } from './TriggerReinforcementEventCommand';
import { effectiveInitiatives } from '@/store/initiativePlacement';

const character = (
	uuid: string,
	name: string,
	initiative: number
): Character => ({
	uuid,
	name,
	initiative,
	turnState: 'normal',
	group: 'enemies',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
});

const encounter: Encounter = {
	id: 'ambush',
	name: 'Ambush',
	description: 'A guard arrives later',
	difficulty: DIFFICULTY.Moderate,
	partySize: 2,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 3,
	participants: [],
	narrativeSlots: [
		{
			id: 'guard-arrives',
			type: 'reinforcement',
			trigger: { round: 1 },
			participants: [
				{
					type: 'creature',
					name: 'Guard',
					level: '+0',
					side: ALIGNMENT.Opponents,
					initiativeBonus: 4,
				},
			],
		},
	],
};

/** Makes the next d20 roll come up as `roll`. */
const nextD20 = (roll: number) =>
	vi.spyOn(Math, 'random').mockReturnValue((roll - 1) / 20);

describe('TriggerReinforcementEventCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	const hero = character('hero', 'Hero', 20);
	const rogue = character('rogue', 'Rogue', 15);
	const goblin = character('goblin', 'Goblin', 10);
	const orc = character('orc', 'Orc', 5);

	beforeEach(() => {
		encounterStore = createEncounterStore();
		encounterStore.getState().startEncounter([hero, rogue, goblin, orc]);
		encounterStore.getState().setEncounterData(encounter);
		encounterStore.getState().setPartyLevel(3);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	const trigger = () => {
		const command = new TriggerReinforcementEventCommand(
			{ slotId: 'guard-arrives' },
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);

		return command;
	};

	const guard = () =>
		Object.values(encounterStore.getState().charactersMap).find(
			({ name }) => name === 'Guard'
		)!;

	it('rolls d20 + initiative bonus and places the arrival by it', () => {
		nextD20(10);
		trigger();

		expect(guard().initiative).toBe(14);
		expect(encounterStore.getState().charactersOrder).toEqual([
			'hero',
			'rogue',
			guard().uuid,
			'goblin',
			'orc',
		]);
		expect(encounterStore.getState().charactersWithTurn.has(guard().uuid)).toBe(
			true
		);
	});

	it('replays the stored roll on redo and after a reload', () => {
		nextD20(10);
		const command = trigger();
		const { uuid, initiative } = guard();

		expect(command.undo()).toBe(STATUS.success);
		nextD20(1);
		expect(command.execute()).toBe(STATUS.success);
		expect(guard()).toMatchObject({ uuid, initiative });

		// A reload revives the command from its persisted data
		expect(command.undo()).toBe(STATUS.success);
		const revived = new TriggerReinforcementEventCommand(
			structuredClone(command.data),
			{ encounterStore }
		);

		expect(revived.execute()).toBe(STATUS.success);
		expect(guard()).toMatchObject({ uuid, initiative });
	});

	it('puts an opposing arrival before a PC it ties with', () => {
		encounterStore.setState((state) => ({
			charactersMap: {
				...state.charactersMap,
				rogue: { ...state.charactersMap.rogue, group: 'players' },
			},
		}));
		nextD20(11);
		trigger();

		expect(guard().initiative).toBe(15);
		expect(encounterStore.getState().charactersOrder).toEqual([
			'hero',
			guard().uuid,
			'rogue',
			'goblin',
			'orc',
		]);
	});

	it('puts an arrival after a participant on the same side it ties with', () => {
		nextD20(6);
		trigger();

		expect(guard().initiative).toBe(10);
		expect(encounterStore.getState().charactersOrder).toEqual([
			'hero',
			'rogue',
			'goblin',
			guard().uuid,
			'orc',
		]);
	});

	it('places the arrival by the current order after a reorder', () => {
		// Orc moves up between Hero and Rogue; its stored 5 stays
		new ReorderCharactersCommand(
			{ newOrder: ['hero', 'orc', 'rogue', 'goblin'] },
			{ encounterStore }
		).execute();
		nextD20(8);
		trigger();

		expect(guard().initiative).toBe(12);
		expect(encounterStore.getState().charactersOrder).toEqual([
			'hero',
			'orc',
			'rogue',
			guard().uuid,
			'goblin',
		]);
	});

	it('places an arrival among the participants still to act this round', () => {
		// Hero and Rogue have acted; Goblin is up
		encounterStore.setState({
			charactersOrder: ['goblin', 'orc', 'hero', 'rogue'],
			charactersWithTurn: new Set(['goblin', 'orc']),
		});
		nextD20(1);
		trigger();

		expect(encounterStore.getState().charactersOrder).toEqual([
			'goblin',
			'orc',
			guard().uuid,
			'hero',
			'rogue',
		]);
	});

	it('lets an arrival whose spot has passed act right after the current turn', () => {
		encounterStore.setState({
			charactersOrder: ['goblin', 'orc', 'hero', 'rogue'],
			charactersWithTurn: new Set(['goblin', 'orc']),
		});
		nextD20(14);
		trigger();

		expect(guard().initiative).toBe(18);
		expect(encounterStore.getState().charactersOrder).toEqual([
			'goblin',
			guard().uuid,
			'orc',
			'hero',
			'rogue',
		]);
	});

	it('undo removes the arrival', () => {
		nextD20(10);
		const command = trigger();

		expect(command.undo()).toBe(STATUS.success);

		const state = encounterStore.getState();

		expect(state.charactersOrder).toEqual(['hero', 'rogue', 'goblin', 'orc']);
		expect(Object.keys(state.charactersMap)).toHaveLength(4);
		expect(state.trackerMetaMap).toEqual({});
		expect(state.charactersWithTurn).toEqual(
			new Set(['hero', 'rogue', 'goblin', 'orc'])
		);
	});
});

describe('effectiveInitiatives', () => {
	const map = Object.fromEntries(
		[
			character('a', 'A', 20),
			character('b', 'B', 15),
			character('c', 'C', 10),
			character('d', 'D', 5),
		].map((c) => [c.uuid, c])
	);

	it('keeps stored numbers that match the order', () => {
		expect(effectiveInitiatives(['a', 'b', 'c', 'd'], map)).toEqual(
			new Map([
				['a', 20],
				['b', 15],
				['c', 10],
				['d', 5],
			])
		);
	});

	it('gives a moved participant the value of its new neighbour above', () => {
		// A moved down to the bottom, D moved up to the top
		expect(effectiveInitiatives(['b', 'c', 'a'], map).get('a')).toBe(10);
		expect(effectiveInitiatives(['d', 'a', 'b'], map).get('d')).toBe(20);
	});
});
