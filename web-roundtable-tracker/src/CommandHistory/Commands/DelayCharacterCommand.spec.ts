import { beforeEach, describe, expect, it } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { DelayCharacterCommand } from './DelayCharacterCommand';

describe('DelayCharacterCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	let characters: Character[];

	beforeEach(() => {
		encounterStore = createEncounterStore();
		characters = [
			{
				uuid: '00000000-0000-0000-0000-000000000001',
				name: 'Hero',
				initiative: 18,
				turnState: 'normal',
				group: 'players',
				wounded: 0,
				health: 20,
				maxHealth: 20,
				tempHealth: 0,
				hasTurn: false,
			},
			{
				uuid: '00000000-0000-0000-0000-000000000002',
				name: 'Goblin',
				initiative: 12,
				turnState: 'normal',
				group: 'enemies',
				wounded: 0,
				health: 10,
				maxHealth: 10,
				tempHealth: 0,
				hasTurn: false,
			},
		];
		encounterStore.getState().startEncounter(characters);
	});

	it('uses a dedicated command name and type', () => {
		const command = new DelayCharacterCommand(
			{ uuid: characters[0].uuid },
			{ encounterStore }
		);

		expect(command.type).toBe('DelayCharacterCommand');
		expect(command.description).toBe('Delay Character Command');
	});

	it('delays a character and supports undo', () => {
		const command = new DelayCharacterCommand(
			{ uuid: characters[0].uuid },
			{ encounterStore }
		);

		const status = command.execute();
		expect(status).toBe(STATUS.success);

		const stateAfterExecute = encounterStore.getState();
		expect(stateAfterExecute.charactersMap[characters[0].uuid].turnState).toBe(
			'delayed'
		);
		expect(stateAfterExecute.charactersOrder).toEqual([characters[1].uuid]);
		expect(stateAfterExecute.delayedOrder).toEqual([characters[0].uuid]);

		const undoStatus = command.undo();
		expect(undoStatus).toBe(STATUS.success);

		const stateAfterUndo = encounterStore.getState();
		expect(stateAfterUndo.charactersMap[characters[0].uuid].turnState).toBe(
			'normal'
		);
		expect(stateAfterUndo.charactersOrder).toEqual([
			characters[0].uuid,
			characters[1].uuid,
		]);
		expect(stateAfterUndo.delayedOrder).toEqual([]);
	});

	it('fails when the character cannot be delayed', () => {
		encounterStore.setState(() => ({
			charactersWithTurn: new Set([characters[1].uuid]),
		}));
		const command = new DelayCharacterCommand(
			{ uuid: characters[0].uuid },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
	});
});
