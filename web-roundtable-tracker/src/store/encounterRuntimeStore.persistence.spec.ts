import { beforeAll, describe, expect, it, vi } from 'vitest';
import { createEncounterStore } from './encounterRuntimeStore';
import { getEncounterStore } from './encounterRuntimeInstance';
import { Character } from './data';
import { STATUS } from '@/CommandHistory/common';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { GiveAdditionalTurnCommand } from '@/CommandHistory/Commands/GiveAdditionalTurnCommand';
import { CompositeCommand } from '@/CommandHistory/Commands/CompositeCommand';

const characters: Character[] = [
	{
		uuid: '00000000-0000-0000-0000-000000000001',
		name: 'Hero',
		initiative: 20,
		turnState: 'normal',
		group: 'players',
		wounded: 0,
		health: 30,
		maxHealth: 30,
		tempHealth: 0,
		hasTurn: false,
	},
	{
		uuid: '00000000-0000-0000-0000-000000000002',
		name: 'Rogue',
		initiative: 18,
		turnState: 'delayed',
		group: 'players',
		wounded: 0,
		health: 24,
		maxHealth: 24,
		tempHealth: 0,
		hasTurn: false,
	},
];

describe('encounter store persistence', () => {
	beforeAll(() => {
		// Registers the serializable commands, as the app does on start.
		getEncounterStore();
	});

	it('restores a history with a ReturnToInitiativeCommand after a reload', () => {
		const store = createEncounterStore();
		store.getState().startEncounter(characters);
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

	it('drops an unknown stored command and the history after it', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const store = createEncounterStore();
		store.getState().startEncounter(characters);
		const giveTurn = (uuid: string) =>
			new GiveAdditionalTurnCommand({ uuid: uuid as Character['uuid'] });
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
		const stored = localStorage.getItem('encounter-store')!;
		const withUnknown = stored.replace(
			/"type":"Command\.GiveAdditionalTurnCommand"(,"description":"[^"]*")?,"data":\{"uuid":"removed"/g,
			'"type":"Command.RemovedCommand","data":{"uuid":"removed"'
		);
		expect(withUnknown).not.toBe(stored);
		localStorage.setItem('encounter-store', withUnknown);

		const reloaded = createEncounterStore();

		const { charactersOrder, history, redoStack } = reloaded.getState();
		expect(charactersOrder).toEqual(store.getState().charactersOrder);
		expect(history.map((command) => command.data.uuid)).toEqual([
			characters[0].uuid,
		]);
		expect(redoStack.map((command) => command.data.uuid)).toEqual([
			characters[0].uuid,
		]);
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('RemovedCommand'),
			expect.any(Error)
		);
		warn.mockRestore();
	});
});
