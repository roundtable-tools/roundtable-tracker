import { beforeEach, describe, expect, it } from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';
import { ReturnToInitiativeCommand } from './ReturnToInitiativeCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from './FinalizeTurnAndAdvanceRoundCommand';
import { delayingIds } from '@/store/operations';

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
			{
				uuid: '00000000-0000-0000-0000-000000000003',
				name: 'Goblin',
				initiative: 10,
				turnState: 'normal',
				group: 'enemies',
				health: 12,
				maxHealth: 12,
				tempHealth: 0,
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
		expect(delayingIds(stateAfterExecute)).toEqual([characters[0].uuid]);
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
		expect(delayingIds(stateAfterUndo)).toEqual([characters[1].uuid]);
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

	it('keeps the round when a delayer is picked after the last turn, until its turn ends', () => {
		const [hero, rogue, goblin] = characters.map(({ uuid }) => uuid);
		encounterStore.setState(() => ({
			charactersOrder: [goblin, hero, rogue],
			charactersWithTurn: new Set([goblin]),
		}));

		const pick = new ReturnToInitiativeCommand(
			{ activeUuid: goblin, returningUuid: rogue, action: 'end-turn' },
			{ encounterStore }
		);

		expect(pick.execute()).toBe(STATUS.success);
		expect(encounterStore.getState()).toMatchObject({
			round: 1,
			charactersOrder: [rogue, hero, goblin],
			charactersWithTurn: new Set([rogue]),
		});
		expect(delayingIds(encounterStore.getState())).toEqual([]);

		const endReturnersTurn = new FinalizeTurnAndAdvanceRoundCommand(
			{ uuid: rogue, action: 'end-turn' },
			{ encounterStore }
		);

		expect(endReturnersTurn.execute()).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
	});
});
