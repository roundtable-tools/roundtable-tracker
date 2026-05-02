import { beforeEach, describe, expect, it } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { FinalizeTurnAndReturnToInitiativeCommand } from './FinalizeTurnAndReturnToInitiativeCommand';

describe('FinalizeTurnAndReturnToInitiativeCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	let characters: Character[];

	beforeEach(() => {
		encounterStore = createEncounterStore();
		characters = [
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
			{
				uuid: '00000000-0000-0000-0000-000000000003',
				name: 'Goblin',
				initiative: 10,
				turnState: 'normal',
				group: 'enemies',
				wounded: 0,
				health: 12,
				maxHealth: 12,
				tempHealth: 0,
				hasTurn: false,
			},
		];
		encounterStore.getState().startEncounter(characters);
	});

	it('returns delayed participant and advances round for final active turn', () => {
		encounterStore.setState((state) => ({
			charactersOrder: [
				characters[0].uuid,
				characters[1].uuid,
				characters[2].uuid,
			],
			delayedOrder: [characters[1].uuid],
			charactersWithTurn: new Set([characters[0].uuid]),
			charactersMap: {
				...state.charactersMap,
				[characters[1].uuid]: {
					...state.charactersMap[characters[1].uuid],
					turnState: 'delayed',
				},
			},
		}));

		const command = new FinalizeTurnAndReturnToInitiativeCommand(
			{
				activeUuid: characters[0].uuid,
				returningUuid: characters[1].uuid,
				action: 'end-turn',
			},
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
		expect(encounterStore.getState().charactersOrder).toEqual([
			characters[1].uuid,
			characters[2].uuid,
			characters[0].uuid,
		]);
		expect(encounterStore.getState().delayedOrder).toEqual([]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([characters[1].uuid, characters[2].uuid, characters[0].uuid])
		);
	});

	it('undo restores pre-command round and initiative state', () => {
		encounterStore.setState((state) => ({
			charactersOrder: [
				characters[0].uuid,
				characters[1].uuid,
				characters[2].uuid,
			],
			delayedOrder: [characters[1].uuid],
			charactersWithTurn: new Set([characters[0].uuid]),
			charactersMap: {
				...state.charactersMap,
				[characters[1].uuid]: {
					...state.charactersMap[characters[1].uuid],
					turnState: 'delayed',
				},
			},
		}));

		const command = new FinalizeTurnAndReturnToInitiativeCommand(
			{
				activeUuid: characters[0].uuid,
				returningUuid: characters[1].uuid,
				action: 'ko',
			},
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);
		expect(command.undo()).toBe(STATUS.success);

		expect(encounterStore.getState().round).toBe(1);
		expect(encounterStore.getState().charactersOrder).toEqual([
			characters[0].uuid,
			characters[1].uuid,
			characters[2].uuid,
		]);
		expect(encounterStore.getState().delayedOrder).toEqual([
			characters[1].uuid,
		]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([characters[0].uuid])
		);
		expect(
			encounterStore.getState().charactersMap[characters[1].uuid].turnState
		).toBe('delayed');
	});

	it('fails if active participant is not final active turn', () => {
		encounterStore.setState(() => ({
			charactersOrder: [
				characters[0].uuid,
				characters[1].uuid,
				characters[2].uuid,
			],
			delayedOrder: [characters[1].uuid],
			charactersWithTurn: new Set([characters[0].uuid, characters[2].uuid]),
		}));

		const command = new FinalizeTurnAndReturnToInitiativeCommand(
			{
				activeUuid: characters[0].uuid,
				returningUuid: characters[1].uuid,
				action: 'end-turn',
			},
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
		expect(encounterStore.getState().round).toBe(1);
	});
});
