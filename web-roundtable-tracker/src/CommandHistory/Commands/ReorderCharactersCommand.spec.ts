import { describe, it, expect, beforeEach } from 'vitest';
import { ReorderCharactersCommand } from './ReorderCharactersCommand';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { EndTurnCommand } from './EndTurnCommand';
import { GiveAdditionalTurnCommand } from './GiveAdditionalTurnCommand';
import { DelayCharacterCommand } from './DelayCharacterCommand';
import { RemoveCharacterCommand } from './RemoveCharacterCommand';
import { delayingIds } from '@/store/operations';

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

	describe('participants that already acted this round', () => {
		const [alice, bob, charlie] = [
			'00000000-0000-0000-0000-000000000001',
			'00000000-0000-0000-0000-000000000002',
			'00000000-0000-0000-0000-000000000003',
		];

		beforeEach(() => {
			encounterStore.getState().startEncounter(initialCharacters);
		});

		const endTurn = (uuid: string) =>
			new EndTurnCommand({ uuid }, { encounterStore }).execute();

		it('skips a participant moved to the top after its turn (#26)', () => {
			expect(endTurn(alice)).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder).toEqual([
				bob,
				charlie,
				alice,
			]);

			const command = new ReorderCharactersCommand(
				{ newOrder: [alice, bob, charlie] },
				{ encounterStore }
			);

			expect(command.execute()).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder[0]).toBe(bob);

			expect(endTurn(bob)).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder[0]).toBe(charlie);
			expect(endTurn(charlie)).toBe(STATUS.success);
			expect(encounterStore.getState().charactersWithTurn.size).toBe(0);
		});

		it('skips a participant that already acted when the turn reaches it', () => {
			expect(endTurn(alice)).toBe(STATUS.success);

			new ReorderCharactersCommand(
				{ newOrder: [bob, alice, charlie] },
				{ encounterStore }
			).execute();

			expect(encounterStore.getState().charactersOrder).toEqual([
				bob,
				alice,
				charlie,
			]);

			expect(endTurn(bob)).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder).toEqual([
				charlie,
				bob,
				alice,
			]);

			expect(endTurn(charlie)).toBe(STATUS.success);
			// Next round keeps the reordered sequence: Bob, Alice, Charlie.
			expect(encounterStore.getState().charactersOrder).toEqual([
				bob,
				alice,
				charlie,
			]);
		});

		it('lets a participant act again once its turn is given back', () => {
			expect(endTurn(alice)).toBe(STATUS.success);
			new GiveAdditionalTurnCommand(
				{ uuid: alice },
				{ encounterStore }
			).execute();

			new ReorderCharactersCommand(
				{ newOrder: [alice, bob, charlie] },
				{ encounterStore }
			).execute();

			expect(encounterStore.getState().charactersOrder[0]).toBe(alice);
		});

		it('restores the unskipped order on undo', () => {
			expect(endTurn(alice)).toBe(STATUS.success);
			const command = new ReorderCharactersCommand(
				{ newOrder: [alice, bob, charlie] },
				{ encounterStore }
			);
			command.execute();

			expect(command.undo()).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder).toEqual([
				bob,
				charlie,
				alice,
			]);
		});
	});

	describe('stale or duplicated initiative orders (#28)', () => {
		const [alice, bob, charlie] = [
			'00000000-0000-0000-0000-000000000001',
			'00000000-0000-0000-0000-000000000002',
			'00000000-0000-0000-0000-000000000003',
		];

		beforeEach(() => {
			encounterStore.getState().startEncounter(initialCharacters);
		});

		it('does not duplicate a participant that delayed while the order was being dragged', () => {
			// The drag started on [Alice, Bob, Charlie] and the dragged list ended
			// up holding Alice twice: once from before her Delay, once after it.
			const staleDraggedOrder = [charlie, alice, bob, alice];

			new DelayCharacterCommand({ uuid: alice }, { encounterStore }).execute();
			expect(encounterStore.getState().charactersOrder).toEqual([
				bob,
				charlie,
				alice,
			]);

			const command = new ReorderCharactersCommand(
				{ newOrder: staleDraggedOrder },
				{ encounterStore }
			);

			expect(command.execute()).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder).toEqual([
				charlie,
				alice,
				bob,
			]);
			expect(delayingIds(encounterStore.getState())).toEqual([alice]);

			expect(command.undo()).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder).toEqual([
				bob,
				charlie,
				alice,
			]);
		});

		it('keeps participants that a stale order misses', () => {
			const command = new ReorderCharactersCommand(
				{ newOrder: [charlie, alice] },
				{ encounterStore }
			);

			command.execute();

			expect(encounterStore.getState().charactersOrder).toEqual([
				charlie,
				bob,
				alice,
			]);
		});

		it('does not bring back a participant removed after the order was built', () => {
			const staleOrder = [charlie, bob, alice];

			new RemoveCharacterCommand({ uuid: bob }, { encounterStore }).execute();
			new ReorderCharactersCommand(
				{ newOrder: staleOrder },
				{ encounterStore }
			).execute();

			expect(encounterStore.getState().charactersOrder).toEqual([
				charlie,
				alice,
			]);
		});

		it('drops a duplicate already in the queue that the new order misses', () => {
			// A queue saved before the #28 fix can already hold a participant twice.
			encounterStore.setState({ charactersOrder: [alice, bob, alice] });

			new ReorderCharactersCommand(
				{ newOrder: [bob] },
				{ encounterStore }
			).execute();

			expect(encounterStore.getState().charactersOrder).toEqual([alice, bob]);
		});
	});
});
