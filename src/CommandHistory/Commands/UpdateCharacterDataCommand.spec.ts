import { describe, it, expect, beforeEach } from 'vitest';
import { Character } from '../../store/data';
import { STATUS } from '../common';
import { createEncounterStore } from '@/store/store';
import { UpdateCharacterDataCommand } from './UpdateCharacterDataCommand';

describe('UpdateCharacterCommand', () => {
	let uuid: string;
	let oldCharacter: Character;
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		uuid = 'some-unique-uuid';
		oldCharacter = {
			uuid,
			name: 'Old Name',
			initiative: 0,
			turnState: 'normal',
			group: 'players',
			wounded: 0,
		};

		encounterStore = createEncounterStore();
		encounterStore.getState().setCharacters([oldCharacter]);
	});

	it('should update character properties on execute', () => {
		const command = new UpdateCharacterDataCommand(
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

		const command2 = new UpdateCharacterDataCommand(
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
		const command = new UpdateCharacterDataCommand(
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
		const command = new UpdateCharacterDataCommand(
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
