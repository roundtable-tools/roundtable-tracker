import { beforeEach, describe, expect, it } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { FinalizeTurnAndAdvanceRoundCommand } from './FinalizeTurnAndAdvanceRoundCommand';
import { EndTurnCommand } from './EndTurnCommand';
import { DelayCharacterCommand } from './DelayCharacterCommand';

describe('FinalizeTurnAndAdvanceRoundCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	let characters: Character[];

	beforeEach(() => {
		encounterStore = createEncounterStore();
		characters = [
			{
				uuid: '00000000-0000-0000-0000-000000000001',
				name: 'Hero',
				initiative: 18,
				turnState: 'normal',
				group: 'players',
				health: 20,
				maxHealth: 20,
				tempHealth: 0,
			},
			{
				uuid: '00000000-0000-0000-0000-000000000002',
				name: 'Goblin',
				initiative: 12,
				turnState: 'normal',
				group: 'enemies',
				health: 10,
				maxHealth: 10,
				tempHealth: 0,
			},
		];
		encounterStore.getState().startEncounter(characters);
	});

	it('ends the round atomically for the last active participant', () => {
		encounterStore.setState(() => ({
			charactersOrder: [characters[1].uuid, characters[0].uuid],
			charactersWithTurn: new Set([characters[1].uuid]),
		}));

		const command = new FinalizeTurnAndAdvanceRoundCommand(
			{ uuid: characters[1].uuid, action: 'end-turn' },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
		expect(encounterStore.getState().charactersOrder).toEqual([
			characters[0].uuid,
			characters[1].uuid,
		]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([characters[0].uuid, characters[1].uuid])
		);

		const undoStatus = command.undo();

		expect(undoStatus).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(1);
		expect(encounterStore.getState().charactersOrder).toEqual([
			characters[1].uuid,
			characters[0].uuid,
		]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([characters[1].uuid])
		);
	});

	it('supports delayed participants while advancing the round', () => {
		encounterStore.setState((state) => ({
			charactersMap: {
				...state.charactersMap,
				[characters[0].uuid]: {
					...state.charactersMap[characters[0].uuid],
					turnState: 'delayed',
				},
			},
			charactersOrder: [characters[1].uuid],
			delayedOrder: [characters[0].uuid],
			charactersWithTurn: new Set([characters[0].uuid, characters[1].uuid]),
		}));

		const command = new FinalizeTurnAndAdvanceRoundCommand(
			{ uuid: characters[1].uuid, action: 'ko' },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
		expect(
			encounterStore.getState().charactersMap[characters[1].uuid].turnState
		).toBe('knocked-out');
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([characters[0].uuid, characters[1].uuid])
		);

		const undoStatus = command.undo();

		expect(undoStatus).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(1);
		expect(
			encounterStore.getState().charactersMap[characters[1].uuid].turnState
		).toBe('normal');
		expect(encounterStore.getState().delayedOrder).toEqual([
			characters[0].uuid,
		]);
	});

	it('keeps the initiative order when a participant delays through the round', () => {
		const [alice, bob, charlie, dana] = [
			'00000000-0000-0000-0000-00000000000a',
			'00000000-0000-0000-0000-00000000000b',
			'00000000-0000-0000-0000-00000000000c',
			'00000000-0000-0000-0000-00000000000d',
		];
		encounterStore.getState().startEncounter(
			[alice, bob, charlie, dana].map((uuid, index) => ({
				...characters[0],
				uuid,
				name: uuid,
				initiative: 20 - index,
			}))
		);
		const deps = { encounterStore };

		expect(new EndTurnCommand({ uuid: alice }, deps).execute()).toBe(
			STATUS.success
		);
		expect(new DelayCharacterCommand({ uuid: bob }, deps).execute()).toBe(
			STATUS.success
		);
		expect(new EndTurnCommand({ uuid: charlie }, deps).execute()).toBe(
			STATUS.success
		);
		expect(
			new FinalizeTurnAndAdvanceRoundCommand(
				{ uuid: dana, action: 'end-turn' },
				deps
			).execute()
		).toBe(STATUS.success);

		expect(encounterStore.getState().round).toBe(2);
		expect(encounterStore.getState().charactersOrder).toEqual([
			alice,
			bob,
			charlie,
			dana,
		]);
	});

	it('fails when the participant is not the final active turn in the round', () => {
		const command = new FinalizeTurnAndAdvanceRoundCommand(
			{ uuid: characters[0].uuid, action: 'end-turn' },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
		expect(encounterStore.getState().round).toBe(1);
	});
});
