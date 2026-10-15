import { beforeEach, describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	Character,
	DIFFICULTY,
	Encounter,
	LEVEL_REPRESENTATION,
	Participant,
} from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { STATUS } from '../common';
import { TriggerReinforcementEventCommand } from './TriggerReinforcementEventCommand';

const character = (
	uuid: string,
	initiative: number,
	group: Character['group']
): Character => ({
	uuid,
	name: uuid,
	initiative,
	turnState: 'normal',
	group,
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
});

// A fixed initiative keeps the arrival's spot independent of how the command
// rolls one. Slot participants don't declare `initiative`, but the command
// reads it when set.
const encounterWithDelayedLookout = (
	initiative: number,
	side: Participant['side'] = ALIGNMENT.Opponents
): Encounter => ({
	id: 'ambush',
	name: 'Ambush',
	description: 'A lookout arrives delaying',
	difficulty: DIFFICULTY.Moderate,
	partySize: 1,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 3,
	participants: [],
	narrativeSlots: [
		{
			id: 'lookout-arrives',
			type: 'reinforcement',
			trigger: { round: 1 },
			participants: [
				{
					type: 'creature',
					name: 'Lookout',
					level: '+0',
					side,
					startingState: 'delayed',
					initiative,
				} as Participant<typeof LEVEL_REPRESENTATION.Relative>,
			],
		},
	],
});

describe('Reinforcements that arrive delaying', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		encounterStore
			.getState()
			.startEncounter([
				character('hero', 20, 'players'),
				character('goblin', 10, 'enemies'),
				character('orc', 5, 'enemies'),
			]);
		encounterStore.getState().setPartyLevel(3);
	});

	// Hero has acted; Goblin is up, Orc still to act
	const goblinsTurn = () =>
		encounterStore.setState({
			charactersOrder: ['goblin', 'orc', 'hero'],
			charactersWithTurn: new Set(['goblin', 'orc']),
		});

	const trigger = (
		initiative: number,
		side: Participant['side'] = ALIGNMENT.Opponents
	) => {
		encounterStore
			.getState()
			.setEncounterData(encounterWithDelayedLookout(initiative, side));

		const command = new TriggerReinforcementEventCommand(
			{ slotId: 'lookout-arrives' },
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);

		return command;
	};

	const lookout = () =>
		Object.values(encounterStore.getState().charactersMap).find(
			({ name }) => name === 'Lookout'
		)!;

	const lookoutHasTurn = () =>
		encounterStore.getState().charactersWithTurn.has(lookout().uuid);

	it('gets a turn when its initiative is after the current turn', () => {
		goblinsTurn();
		trigger(8);

		const state = encounterStore.getState();

		expect(lookout().turnState).toBe('delayed');
		expect(state.delayedOrder).toEqual([lookout().uuid]);
		expect(state.charactersOrder).toEqual(['goblin', 'orc', 'hero']);
		expect(lookoutHasTurn()).toBe(true);
	});

	it('gets no turn when its initiative is before the current turn', () => {
		goblinsTurn();
		trigger(15);

		expect(encounterStore.getState().delayedOrder).toEqual([lookout().uuid]);
		expect(lookoutHasTurn()).toBe(false);
	});

	it('gets no turn at the start of a round when it would go first', () => {
		trigger(25);

		expect(lookoutHasTurn()).toBe(false);
	});

	it('gets no turn when nobody in the order is still to act', () => {
		encounterStore.setState({ charactersWithTurn: new Set() });
		trigger(1);

		expect(lookoutHasTurn()).toBe(false);
	});

	describe('ties with the current actor', () => {
		it('an opposing arrival goes before a PC, so it gets no turn', () => {
			trigger(20);

			expect(lookoutHasTurn()).toBe(false);
		});

		it('an opposing arrival goes after an enemy, so it gets a turn', () => {
			goblinsTurn();
			trigger(10);

			expect(lookoutHasTurn()).toBe(true);
		});

		it('an arriving PC goes after an enemy, so it gets a turn', () => {
			goblinsTurn();
			trigger(10, ALIGNMENT.PCs);

			expect(lookoutHasTurn()).toBe(true);
		});
	});

	it('undo restores the state from before the arrival', () => {
		goblinsTurn();
		const { charactersMap, charactersOrder, trackerMetaMap } =
			encounterStore.getState();
		const before = structuredClone({
			charactersMap,
			charactersOrder,
			trackerMetaMap,
		});
		const command = trigger(8);

		expect(lookoutHasTurn()).toBe(true);
		expect(command.undo()).toBe(STATUS.success);

		const state = encounterStore.getState();

		expect(state.charactersMap).toEqual(before.charactersMap);
		expect(state.charactersOrder).toEqual(before.charactersOrder);
		expect(state.delayedOrder).toEqual([]);
		expect(state.charactersWithTurn).toEqual(new Set(['goblin', 'orc']));
		expect(state.trackerMetaMap).toEqual(before.trackerMetaMap);
	});

	it('gives the same result on redo and after a reload', () => {
		goblinsTurn();
		const command = trigger(8);
		const { uuid } = lookout();

		expect(lookoutHasTurn()).toBe(true);
		const after = {
			charactersWithTurn: new Set(encounterStore.getState().charactersWithTurn),
		};

		expect(command.undo()).toBe(STATUS.success);
		expect(command.execute()).toBe(STATUS.success);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			after.charactersWithTurn
		);
		expect(lookout().uuid).toBe(uuid);

		// A reload revives the command from its persisted data
		expect(command.undo()).toBe(STATUS.success);
		const revived = new TriggerReinforcementEventCommand(
			structuredClone(command.data),
			{ encounterStore }
		);

		expect(revived.execute()).toBe(STATUS.success);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			after.charactersWithTurn
		);
		expect(encounterStore.getState().delayedOrder).toEqual([uuid]);
	});
});
