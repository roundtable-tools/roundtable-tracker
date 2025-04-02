import { describe, it, expect, beforeEach } from 'vitest';
import { RemoveCharacterCommand } from './RemoveCharacterCommand';
import { createEncounterStore } from '../../store/store';
import { Character } from '../../store/data';
import { STATUS } from '../common';

describe('RemoveCharacterCommand', () => {
	let uuid: string;
	let character: Character;
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		uuid = '00000000-0000-0000-0000-000000000001';
		character = {
			uuid,
			name: 'Test Character',
			initiative: 10,
			turnState: 'normal',
			group: 'players',
			wounded: 0,
			health: 100,
			maxHealth: 100,
			tempHealth: 0,
		};

		encounterStore = createEncounterStore();
		encounterStore.getState().setCharacters([character]);
		encounterStore.getState().charactersWithTurn.add(character.uuid);
	});

	it('should remove a character and return success', () => {
		const command = new RemoveCharacterCommand({ uuid }, { encounterStore });

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().charactersMap[uuid]).toBeUndefined();
		expect(encounterStore.getState().charactersOrder).not.toContain(uuid);
		expect(encounterStore.getState().charactersWithTurn.has(uuid)).toBe(false);
	});

	it('should return failure if character does not exist', () => {
		const command = new RemoveCharacterCommand(
			{ uuid: 'non-existent-uuid' },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
	});

	it('should undo the removal of a character and return success', () => {
		const command = new RemoveCharacterCommand({ uuid }, { encounterStore });
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().charactersMap[uuid]).toEqual(character);
		expect(encounterStore.getState().charactersOrder).toContain(uuid);
		expect(encounterStore.getState().charactersWithTurn.has(uuid)).toBe(true);
	});

	it('should return failure if undo is called without executing', () => {
		const command = new RemoveCharacterCommand({ uuid }, { encounterStore });

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
