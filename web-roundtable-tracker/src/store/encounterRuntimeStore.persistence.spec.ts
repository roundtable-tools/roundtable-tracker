import { beforeAll, describe, expect, it } from 'vitest';
import { createEncounterStore } from './encounterRuntimeStore';
import { getEncounterStore } from './encounterRuntimeInstance';
import { Character } from './data';
import { STATUS } from '@/CommandHistory/common';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';

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
});
