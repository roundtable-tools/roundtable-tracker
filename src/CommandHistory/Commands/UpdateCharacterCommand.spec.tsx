import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UpdateCharacterCommand } from './UpdateCharacterCommand';
import { createEncounterStore, useEncounterStore } from '../../store/store';
import { Character } from '../../store/data';
import { STATUS } from '../CommandHistoryContext';

describe('UpdateCharacterCommand', () => {
	let index: number;
	let oldCharacter: Character;
	let newCharacterProps: Partial<Character>;

	beforeEach(() => {
		index = 0;
		oldCharacter = {
			name: 'Old Name',
			initiative: 0,
			state: 'normal',
		};
		newCharacterProps = { name: 'New Name' };
		useEncounterStore.setState({ characters: [oldCharacter] });
	});

	afterEach(() => {
		useEncounterStore.setState(createEncounterStore().getState());
	});

	it('should update character properties on execute', () => {
		const command = new UpdateCharacterCommand({ index, newCharacterProps });

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(useEncounterStore.getState().characters[index].name).toBe(
			'New Name'
		);
		expect(command.data.oldCharacter).toEqual(oldCharacter);
	});

	it('should revert character properties on undo', () => {
		const command = new UpdateCharacterCommand({ index, newCharacterProps });
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(useEncounterStore.getState().characters[index].name).toBe(
			'Old Name'
		);
	});

	it('should return failure status if undo is called without calling execute', () => {
		const command = new UpdateCharacterCommand({
			index: 0,
			newCharacterProps: {},
		});

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
