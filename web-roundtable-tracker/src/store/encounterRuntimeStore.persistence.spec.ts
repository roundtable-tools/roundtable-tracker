import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createEncounterStore } from './encounterRuntimeStore';
import { getEncounterStore } from './encounterRuntimeInstance';
import { Character } from './data';
import { Command, STATUS } from '@/CommandHistory/common';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { GiveAdditionalTurnCommand } from '@/CommandHistory/Commands/GiveAdditionalTurnCommand';
import { CompositeCommand } from '@/CommandHistory/Commands/CompositeCommand';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { DelayCharacterCommand } from '@/CommandHistory/Commands/DelayCharacterCommand';
import { KnockOutCharacterCommand } from '@/CommandHistory/Commands/KnockOutCharacterCommand';
import { ReactivateCharacterCommand } from '@/CommandHistory/Commands/ReactivateCharacterCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from '@/CommandHistory/Commands/FinalizeTurnAndAdvanceRoundCommand';
import { FinalizeTurnAndReturnToInitiativeCommand } from '@/CommandHistory/Commands/FinalizeTurnAndReturnToInitiativeCommand';

const characters: Character[] = [
	{
		uuid: '00000000-0000-0000-0000-000000000001',
		name: 'Hero',
		initiative: 20,
		turnState: 'normal',
		group: 'players',
		health: 30,
		maxHealth: 30,
		tempHealth: 0,
	},
	{
		uuid: '00000000-0000-0000-0000-000000000002',
		name: 'Rogue',
		initiative: 18,
		turnState: 'delayed',
		group: 'players',
		health: 24,
		maxHealth: 24,
		tempHealth: 0,
	},
];

// The Rogue has delayed out of the order and can return.
const startWithRogueDelaying = (
	store: ReturnType<typeof createEncounterStore>
) => {
	store.getState().startEncounter(characters);
	store.setState({
		charactersOrder: [characters[0].uuid],
		delayedOrder: [characters[1].uuid],
	});
};

const giveTurn = (uuid: string) =>
	new GiveAdditionalTurnCommand({ uuid: uuid as Character['uuid'] });

/**
 * Rewrites the stored GiveAdditionalTurnCommand for the uuid 'removed' as a
 * command type that is no longer registered.
 */
const storeUnknownCommandInPlaceOfRemoved = () => {
	const stored = localStorage.getItem('encounter-store')!;
	const withUnknown = stored.replace(
		/"type":"Command\.GiveAdditionalTurnCommand"(,"description":"[^"]*")?,"data":\{"uuid":"removed"/g,
		'"type":"Command.RemovedCommand","data":{"uuid":"removed"'
	);
	expect(withUnknown).not.toBe(stored);
	localStorage.setItem('encounter-store', withUnknown);
};

describe('encounter store persistence', () => {
	beforeAll(() => {
		// Registers the serializable commands, as the app does on start.
		getEncounterStore();
	});

	it('restores a history with a ReturnToInitiativeCommand after a reload', () => {
		const store = createEncounterStore();
		startWithRogueDelaying(store);
		const command = new ReturnToInitiativeCommand(
			{
				activeUuid: characters[0].uuid,
				returningUuid: characters[1].uuid,
				action: 'delay',
			},
			{ encounterStore: store }
		);
		expect(command.execute()).toBe(STATUS.success);
		store.getState().setHistory([command]);

		const reloaded = createEncounterStore();

		expect(reloaded.getState().charactersOrder).toEqual(
			store.getState().charactersOrder
		);
		expect(reloaded.getState().history).toHaveLength(1);
		expect(reloaded.getState().history[0]).toBeInstanceOf(
			ReturnToInitiativeCommand
		);
	});

	it('drops an unknown stored command and the commands undo or redo cannot reach past it', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createEncounterStore();
		startWithRogueDelaying(store);
		store
			.getState()
			.setHistory([
				giveTurn(characters[0].uuid),
				giveTurn('removed'),
				giveTurn(characters[1].uuid),
			]);
		store
			.getState()
			.setRedoStack([
				giveTurn(characters[0].uuid),
				new CompositeCommand({ commands: [giveTurn('removed')] }),
				giveTurn(characters[1].uuid),
			]);
		storeUnknownCommandInPlaceOfRemoved();

		const reloaded = createEncounterStore();

		const { charactersOrder, history, redoStack } = reloaded.getState();
		expect(charactersOrder).toEqual(store.getState().charactersOrder);
		// Undo pops from the end, so only the commands after the unknown one stay.
		expect(history.map((command) => command.data.uuid)).toEqual([
			characters[1].uuid,
		]);
		// Redo takes from the front, so only the commands before the unknown one stay.
		expect(redoStack.map((command) => command.data.uuid)).toEqual([
			characters[0].uuid,
		]);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('RemovedCommand'),
			expect.any(Error)
		);
		warn.mockRestore();
	});

	it('undoes the newest command after reloading a history with an unknown command', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		// Restored commands act on the app's store, so this test uses it too.
		const store = getEncounterStore();
		const wizard: Character = {
			...characters[0],
			uuid: '00000000-0000-0000-0000-000000000003',
			name: 'Wizard',
			initiative: 15,
		};
		const [hero, rogue] = characters;
		store
			.getState()
			.startEncounter([hero, { ...rogue, turnState: 'normal' }, wizard]);
		const endTurn = new EndTurnCommand({ uuid: hero.uuid });
		expect(endTurn.execute()).toBe(STATUS.success);
		const beforeRemove = store.getState();
		const removeRogue = new RemoveCharacterCommand({ uuid: rogue.uuid });
		expect(removeRogue.execute()).toBe(STATUS.success);
		store.getState().setHistory([endTurn, giveTurn('removed'), removeRogue]);
		storeUnknownCommandInPlaceOfRemoved();

		await store.persist.rehydrate();
		const { history } = store.getState();
		expect(history).toHaveLength(1);
		expect(history[0]).toBeInstanceOf(RemoveCharacterCommand);
		expect(history[0].undo()).toBe(STATUS.success);

		const { charactersMap, charactersOrder } = store.getState();
		expect(charactersOrder).toEqual(beforeRemove.charactersOrder);
		expect(Object.keys(charactersMap)).toEqual(
			Object.keys(beforeRemove.charactersMap)
		);
		expect(charactersOrder.every((uuid) => uuid in charactersMap)).toBe(true);
		warn.mockRestore();
	});

	describe('undoes a command restored after a reload', () => {
		const [hero, rogue] = characters;
		const bothNormal = () => [hero, { ...rogue, turnState: 'normal' as const }];
		const turnState = () => {
			const state = getEncounterStore().getState();

			return {
				round: state.round,
				charactersOrder: state.charactersOrder,
				delayedOrder: state.delayedOrder,
				charactersWithTurn: [...state.charactersWithTurn],
				turnStates: Object.values(state.charactersMap).map(
					(character) => character.turnState
				),
			};
		};

		it.each<{
			name: string;
			start: () => Character[];
			setUp?: () => void;
			command: () => Command;
		}>([
			{
				name: 'DelayCharacterCommand',
				start: bothNormal,
				command: () => new DelayCharacterCommand({ uuid: hero.uuid }),
			},
			{
				name: 'KnockOutCharacterCommand',
				start: bothNormal,
				command: () => new KnockOutCharacterCommand({ uuid: hero.uuid }),
			},
			{
				name: 'ReactivateCharacterCommand',
				start: () => characters,
				setUp: () => startWithRogueDelaying(getEncounterStore()),
				command: () => new ReactivateCharacterCommand({ uuid: rogue.uuid }),
			},
			{
				name: 'FinalizeTurnAndAdvanceRoundCommand',
				start: bothNormal,
				setUp: () =>
					expect(new EndTurnCommand({ uuid: hero.uuid }).execute()).toBe(
						STATUS.success
					),
				command: () =>
					new FinalizeTurnAndAdvanceRoundCommand({
						uuid: rogue.uuid,
						action: 'end-turn',
					}),
			},
			{
				name: 'FinalizeTurnAndReturnToInitiativeCommand',
				start: () => characters,
				setUp: () => startWithRogueDelaying(getEncounterStore()),
				command: () =>
					new FinalizeTurnAndReturnToInitiativeCommand({
						activeUuid: hero.uuid,
						returningUuid: rogue.uuid,
						action: 'end-turn',
					}),
			},
		])('$name', async ({ start, setUp, command }) => {
			// Restored commands act on the app's store, so this test uses it too.
			const store = getEncounterStore();
			store.getState().startEncounter(start());
			setUp?.();
			const before = turnState();
			const executed = command();
			expect(executed.execute()).toBe(STATUS.success);
			expect(turnState()).not.toEqual(before);
			store.getState().setHistory([executed]);

			await store.persist.rehydrate();
			const [restored] = store.getState().history;
			expect(restored).not.toBe(executed);
			expect(restored.undo()).toBe(STATUS.success);

			expect(turnState()).toEqual(before);
		});
	});
});
