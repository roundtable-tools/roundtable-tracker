import { describe, it, expect, beforeEach } from 'vitest';
import { GiveAdditionalTurnCommand } from './GiveAdditionalTurnCommand';
import { createEncounterStore } from '@/store/store';
import { Character } from '@/store/data';
import { STATUS } from '../common';

// filepath: /root/repositories/roundtable-tracker/src/CommandHistory/Commands/GiveAdditionalTurnCommand.test.ts

describe('GiveAdditionalTurnCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	let character: Character;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		character = {
			uuid: '00000000-0000-0000-0000-000000000001',
			name: 'Test Character',
			initiative: 10,
			turnState: 'normal',
			group: 'players',
			wounded: 0,
			health: 100,
			maxHealth: 100,
			tempHealth: 0,
		};
		encounterStore.getState().setCharacters([character]);
	});

	it('should give an additional turn to a character and return success', () => {
		const command = new GiveAdditionalTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
	});

	it('should return failure if the character already has a turn', () => {
		encounterStore.getState().charactersWithTurn.add(character.uuid);

		const command = new GiveAdditionalTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
	});

	it('should undo giving an additional turn and return success', () => {
		const command = new GiveAdditionalTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(false);
	});

	it('should return failure if undo is called without executing', () => {
		const command = new GiveAdditionalTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
