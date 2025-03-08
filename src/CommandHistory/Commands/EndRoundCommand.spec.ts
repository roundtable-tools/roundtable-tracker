import { describe, it, expect, beforeEach } from 'vitest';
import { EndRoundCommand } from './EndRoundCommand';
import { createEncounterStore } from '@/store/store';
import { Character } from '@/store/data';
import { STATUS } from '../common';

describe('EndRoundCommand', () => {
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
		};
		encounterStore.getState().setCharacters([character]);
		encounterStore.getState().nextRound();
	});

	it('should end the current round and return success', () => {
		const command = new EndRoundCommand({}, { encounterStore });

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(3);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
	});

	it('should undo the end of the round and return success', () => {
		const command = new EndRoundCommand({}, { encounterStore });
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
	});

	it('should return failure if undo is called without executing', () => {
		const command = new EndRoundCommand({}, { encounterStore });

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
