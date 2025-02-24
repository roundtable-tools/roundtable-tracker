import { describe, it, expect, beforeEach } from 'vitest';
import { EndTurnCommand } from './EndTurnCommand';
import { createEncounterStore } from '@/store/store';
import { Character } from '@/store/data';
import { STATUS } from '../common';

describe('EndTurnCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	let character: Character;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		character = {
			uuid: '00000000-0000-0000-0000-000000000001',
			name: 'Test Character',
			initiative: 10,
			state: 'normal',
			group: 'players',
			wounded: 0,
		};
		encounterStore.getState().setCharacters([character]);
		encounterStore.getState().nextRound();
	});

	it("should end a character's turn and return success", () => {
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(false);
		expect(
			encounterStore.getState().charactersOrder[
				encounterStore.getState().charactersOrder.length - 1
			]
		).toBe(character.uuid);
	});

	it('should return failure if character does not have a turn', () => {
		const command = new EndTurnCommand({ uuid: 'non-existent-uuid' });

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
	});

	it("should undo the end of a character's turn and return success", () => {
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
		expect(encounterStore.getState().charactersOrder).toContain(character.uuid);
	});

	it('should return failure if undo is called without executing', () => {
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
