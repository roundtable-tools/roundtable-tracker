import { beforeEach, describe, expect, it } from 'vitest';
import { Character, Encounter, LEVEL_REPRESENTATION } from './data';
import { createEncounterStore } from './encounterRuntimeStore';
import { STATUS } from '@/CommandHistory/common';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { delayingIds } from '@/store/operations';

const FIGHTER = '00000000-0000-0000-0000-000000000001';
const GOBLIN = '00000000-0000-0000-0000-000000000002';

const character = (uuid: string, name: string): Character => ({
	uuid,
	name,
	initiative: 10,
	turnState: 'normal',
	group: 'players',
	health: 20,
	maxHealth: 20,
	tempHealth: 0,
});

const encounter: Encounter = {
	id: 'encounter',
	name: 'Goblin Ambush',
	description: '',
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	participants: [],
};

describe('ending an encounter', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		encounterStore.getState().setEncounterData(encounter);
		encounterStore
			.getState()
			.startEncounter([
				character(FIGHTER, 'Fighter'),
				character(GOBLIN, 'Goblin'),
			]);

		// One command to undo and one to redo, as after playing a few turns.
		const endFighterTurn = new EndTurnCommand(
			{ uuid: FIGHTER },
			{ encounterStore }
		);
		const endGoblinTurn = new EndTurnCommand(
			{ uuid: GOBLIN },
			{ encounterStore }
		);
		expect(endFighterTurn.execute()).toBe(STATUS.success);
		encounterStore.getState().setHistory([endFighterTurn]);
		encounterStore.getState().setRedoStack([endGoblinTurn]);
	});

	it('clears the order and undo history but keeps the loaded encounter', () => {
		// Same call as InitiativeTrackerPage.endEncounter after it navigates away.
		encounterStore.getState().startEncounter([]);

		const state = encounterStore.getState();
		expect(state.charactersOrder).toEqual([]);
		expect(delayingIds(state)).toEqual([]);
		expect(state.charactersMap).toEqual({});
		// Undo and Redo are enabled only while these stacks are non-empty.
		expect(state.history).toEqual([]);
		expect(state.redoStack).toEqual([]);
		expect(state.encounterData).toBe(encounter);
	});
});
