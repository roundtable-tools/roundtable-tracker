import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EndTurnCommand } from './EndTurnCommand';
import {
	createEncounterStore,
	INITIATIVE_PHASE,
} from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '../common';

describe('EndTurnCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;
	let character: Character;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		character = {
			uuid: '00000000-0000-0000-0000-000000000001',
			name: 'Test Character',
			initiative: 10,
			turnState: 'normal',
			hasTurn: false,
			group: 'players',
			wounded: 0,
			health: 100,
			maxHealth: 100,
			tempHealth: 0,
		};
		encounterStore.getState().startEncounter([character]);
	});

	it("should end a character's turn and return success", () => {
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(false);
		expect(
			encounterStore.getState().charactersOrder[
				encounterStore.getState().charactersOrder.length - 1
			]
		).toBe(character.uuid);
	});

	it('should return failure if character does not have a turn', () => {
		const command = new EndTurnCommand({ uuid: 'non-existent-uuid' });

		const status = command.execute();

		expect(status).toBe(STATUS.failure);
	});

	it("should undo the end of a character's turn and return success", () => {
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
		expect(encounterStore.getState().charactersOrder).toContain(character.uuid);
	});

	it('should return failure if undo is called without executing', () => {
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});

	it('should finalize elapsed turn timing and restore it on undo', () => {
		encounterStore.setState(() => ({
			initiativePhase: INITIATIVE_PHASE.Active,
			activeTurnParticipantId: character.uuid,
			activeTurnRound: 1,
			activeTurnStartedAtMs: 1000,
			activeRoundStartedAtMs: 1000,
			turnElapsedByRoundParticipant: {},
			roundElapsedByRound: {},
			turnDurationHistory: [],
			lastTurnElapsedMs: 0,
		}));

		const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1400);
		const command = new EndTurnCommand(
			{ uuid: character.uuid },
			{ encounterStore }
		);

		const status = command.execute();
		expect(status).toBe(STATUS.success);

		const executedState = encounterStore.getState();
		expect(executedState.lastTurnElapsedMs).toBe(400);
		expect(executedState.turnElapsedByRoundParticipant['1:00000000-0000-0000-0000-000000000001']).toBe(400);
		expect(executedState.turnDurationHistory).toHaveLength(1);

		const undoStatus = command.undo();
		expect(undoStatus).toBe(STATUS.success);

		const undoneState = encounterStore.getState();
		expect(undoneState.lastTurnElapsedMs).toBe(0);
		expect(undoneState.turnDurationHistory).toHaveLength(0);
		expect(undoneState.turnElapsedByRoundParticipant['1:00000000-0000-0000-0000-000000000001']).toBeUndefined();

		nowSpy.mockRestore();
	});
});
