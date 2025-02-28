import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCharacterCommand } from './UpdateCharacterCommand';
import { createEncounterStore, EncounterStore } from '../../store/store';
import { Character } from '../../store/data';
import { STATUS } from '../CommandHistoryContext';
import { StoreApi } from 'zustand';

describe('UpdateCharacterCommand', () => {
	let uuid: string;
	let oldCharacter: Character;
	let encounterStore: StoreApi<EncounterStore>;

	beforeEach(() => {
		uuid = 'some-unique-uuid';
		oldCharacter = {
			uuid,
			name: 'Old Name',
			initiative: 0,
			turnState: 'normal',
		};

		encounterStore = createEncounterStore();
		encounterStore.getState().setCharacters([oldCharacter]);
	});

	it('should update character properties on execute', () => {
		const command = new UpdateCharacterCommand(
			{
				uuid,
				newCharacterProps: { name: 'New Name' },
			},
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().charactersMap[uuid].name).toBe('New Name');
		expect(command.data.oldCharacter).toEqual(oldCharacter);

		const command2 = new UpdateCharacterCommand(
			{
				uuid,
				newCharacterProps: { name: 'Another Name' },
			},
			{ encounterStore }
		);

		const status2 = command2.execute();

		expect(status2).toBe(STATUS.success);
		expect(encounterStore.getState().charactersMap[uuid].name).toBe(
			'Another Name'
		);
	});

	it('should revert character properties on undo', () => {
		const command = new UpdateCharacterCommand(
			{
				uuid,
				newCharacterProps: { name: 'New Name' },
			},
			{ encounterStore }
		);
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().charactersMap[uuid].name).toBe('Old Name');
	});

	it('should return failure status if undo is called without calling execute', () => {
		const command = new UpdateCharacterCommand(
			{
				uuid,
				newCharacterProps: {},
			},
			{ encounterStore }
		);

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
