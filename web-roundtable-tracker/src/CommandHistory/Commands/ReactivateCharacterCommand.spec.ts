import { beforeEach, describe, expect, it } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { ReactivateCharacterCommand } from './ReactivateCharacterCommand';
import { KnockOutCharacterCommand } from './KnockOutCharacterCommand';

describe('ReactivateCharacterCommand', () => {
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
		const command = new ReactivateCharacterCommand(
			{ uuid: characters[0].uuid },
			{ encounterStore }
		);

		expect(command.type).toBe('ReactivateCharacterCommand');
		expect(command.description).toBe('Reactivate Character Command');
	});

	it('reactivates a knocked-out character and supports undo', () => {
		const knockOutCommand = new KnockOutCharacterCommand(
			{ uuid: characters[0].uuid },
			{ encounterStore }
		);

		expect(knockOutCommand.execute()).toBe(STATUS.success);

		const command = new ReactivateCharacterCommand(
			{ uuid: characters[0].uuid },
			{ encounterStore }
		);

		const status = command.execute();
		expect(status).toBe(STATUS.success);

		const stateAfterExecute = encounterStore.getState();
		expect(stateAfterExecute.charactersMap[characters[0].uuid].turnState).toBe(
			'normal'
		);
		expect(stateAfterExecute.charactersWithTurn.has(characters[0].uuid)).toBe(
			false
		);

		const undoStatus = command.undo();
		expect(undoStatus).toBe(STATUS.success);

		const stateAfterUndo = encounterStore.getState();
		expect(stateAfterUndo.charactersMap[characters[0].uuid].turnState).toBe(
			'knocked-out'
		);
	});

	it('fails when the target character does not exist', () => {
		const command = new ReactivateCharacterCommand(
			{ uuid: '00000000-0000-0000-0000-000000000099' },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
	});
});
