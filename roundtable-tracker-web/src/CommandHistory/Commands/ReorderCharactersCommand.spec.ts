import { describe, it, expect, beforeEach } from 'vitest';
import { ReorderCharactersCommand } from './ReorderCharactersCommand';
import { createEncounterStore } from '@/store/store';
import { Character } from '@/store/data';
import { STATUS } from '../common';

describe('ReorderCharactersCommand', () => {
	let initialCharacters: Character[];
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		initialCharacters = [
			{
				name: 'Alice',
				initiative: 0,
				turnState: 'normal',
				uuid: '00000000-0000-0000-0000-000000000001',
				group: 'players',
				wounded: 0,
				health: 100,
				maxHealth: 100,
				tempHealth: 0,
			},
			{
				name: 'Bob',
				initiative: 0,
				turnState: 'normal',
				uuid: '00000000-0000-0000-0000-000000000002',
				group: 'players',
				wounded: 0,
				health: 100,
				maxHealth: 100,
				tempHealth: 0,
			},
			{
				name: 'Charlie',
				initiative: 0,
				turnState: 'normal',
				uuid: '00000000-0000-0000-0000-000000000003',
				group: 'players',
				wounded: 0,
				health: 100,
				maxHealth: 100,
				tempHealth: 0,
			},
		];

		encounterStore = createEncounterStore();
		encounterStore.getState().setCharacters(initialCharacters);
	});

	it('should execute and reorder characters', () => {
		const newOrder = [
			initialCharacters[2].uuid,
			initialCharacters[0].uuid,
			initialCharacters[1].uuid,
		];
		const command = new ReorderCharactersCommand(
			{ newOrder },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().charactersOrder).toEqual(newOrder);
	});

	it('should revert character order on undo', () => {
		const newOrder = [
			initialCharacters[2].uuid,
			initialCharacters[0].uuid,
			initialCharacters[1].uuid,
		];
		const command = new ReorderCharactersCommand(
			{ newOrder },
			{ encounterStore }
		);
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().charactersOrder).toEqual(
			initialCharacters.map((c) => c.uuid)
		);
	});

	it('should return failure status if undo is called without calling execute', () => {
		const newOrder = [
			initialCharacters[2].uuid,
			initialCharacters[0].uuid,
			initialCharacters[1].uuid,
		];
		const command = new ReorderCharactersCommand(
			{ newOrder },
			{ encounterStore }
		);

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
