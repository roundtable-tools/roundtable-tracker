import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ReorderCharactersCommand } from './ReorderCharactersCommand';
import { createEncounterStore, useEncounterStore } from '../../store/store';
import { Character } from '../../store/data';
import { STATUS } from '../CommandHistoryContext';

describe('ReorderCharactersCommand', () => {
	let store: ReturnType<typeof createEncounterStore>;
	let initialCharacters: Character[];

	beforeEach(() => {
		store = createEncounterStore();
		useEncounterStore.setState(store.getState());

		initialCharacters = [
			{
				name: 'Alice',
				initiative: 0,
				state: 'normal',
			},
			{
				name: 'Bob',
				initiative: 0,
				state: 'normal',
			},
			{
				name: 'Charlie',
				initiative: 0,
				state: 'normal',
			},
		];
		useEncounterStore.setState({ characters: initialCharacters });
	});

	afterEach(() => {
		useEncounterStore.setState(createEncounterStore().getState());
	});

	it('should execute and reorder characters', () => {
		const newOrder = ['Charlie', 'Alice', 'Bob'];
		const command = new ReorderCharactersCommand({ newOrder });

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(useEncounterStore.getState().characters.map((c) => c.name)).toEqual(
			newOrder
		);
	});

	it('should revert character order on undo', () => {
		const newOrder = ['Charlie', 'Alice', 'Bob'];
		const command = new ReorderCharactersCommand({ newOrder });
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(useEncounterStore.getState().characters.map((c) => c.name)).toEqual(
			initialCharacters.map((c) => c.name)
		);
	});

	it('should return failure status if undo is called without calling execute', () => {
		const newOrder = ['Charlie', 'Alice', 'Bob'];
		const command = new ReorderCharactersCommand({ newOrder });

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});
});
