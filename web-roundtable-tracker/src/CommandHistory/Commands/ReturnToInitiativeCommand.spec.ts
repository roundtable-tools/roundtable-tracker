import { beforeEach, describe, expect, it } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { ReturnToInitiativeCommand } from './ReturnToInitiativeCommand';

describe('ReturnToInitiativeCommand', () => {
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
		theEncounterStarts();
	});

	const theEncounterStarts = () => {
		encounterStore.getState().startEncounter(characters);

		encounterStore.setState(() => ({
			charactersOrder: [
				characters[0].uuid,
				characters[1].uuid,
				characters[2].uuid,
			],
			delayedOrder: [characters[1].uuid],
			charactersWithTurn: new Set([characters[0].uuid, characters[2].uuid]),
			charactersMap: {
				...encounterStore.getState().charactersMap,
				[characters[1].uuid]: {
					...encounterStore.getState().charactersMap[characters[1].uuid],
					turnState: 'delayed',
				},
			},
		}));
	};

	it('repositions a returning participant without duplicating initiative entries', () => {
		const command = new ReturnToInitiativeCommand(
			{
				activeUuid: characters[0].uuid,
				returningUuid: characters[1].uuid,
				action: 'delay',
			},
			{ encounterStore }
		);

		const status = command.execute();
		expect(status).toBe(STATUS.success);

		const stateAfterExecute = encounterStore.getState();
		expect(stateAfterExecute.charactersOrder).toEqual([
			characters[1].uuid,
			characters[2].uuid,
			characters[0].uuid,
		]);
		expect(
			stateAfterExecute.charactersOrder.filter(
				(id) => id === characters[1].uuid
			)
		).toHaveLength(1);
		expect(stateAfterExecute.delayedOrder).toEqual([characters[0].uuid]);
		expect(stateAfterExecute.charactersWithTurn).toEqual(
			new Set([characters[1].uuid, characters[2].uuid])
		);
		expect(stateAfterExecute.charactersMap[characters[0].uuid].turnState).toBe(
			'delayed'
		);
		expect(stateAfterExecute.charactersMap[characters[1].uuid].turnState).toBe(
			'normal'
		);

		const undoStatus = command.undo();
		expect(undoStatus).toBe(STATUS.success);

		const stateAfterUndo = encounterStore.getState();
		expect(stateAfterUndo.charactersOrder).toEqual([
			characters[0].uuid,
			characters[1].uuid,
			characters[2].uuid,
		]);
		expect(stateAfterUndo.delayedOrder).toEqual([characters[1].uuid]);
		expect(stateAfterUndo.charactersWithTurn).toEqual(
			new Set([characters[0].uuid, characters[2].uuid])
		);
		expect(stateAfterUndo.charactersMap[characters[0].uuid].turnState).toBe(
			'normal'
		);
		expect(stateAfterUndo.charactersMap[characters[1].uuid].turnState).toBe(
			'delayed'
		);
	});
});
