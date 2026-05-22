import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EndRoundCommand } from './EndRoundCommand';
import {
	createEncounterStore,
	INITIATIVE_PHASE,
} from '@/store/encounterRuntimeStore';
import { Character } from '@/store/data';
import { STATUS } from '@/CommandHistory/common';

describe('EndRoundCommand', () => {
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

	it('should end the current round and return success', () => {
		const command = new EndRoundCommand({}, { encounterStore });

		const status = command.execute();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
	});

	it('should undo the end of the round and return success', () => {
		const command = new EndRoundCommand({}, { encounterStore });
		command.execute();

		const status = command.undo();

		expect(status).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(1);
		expect(
			encounterStore.getState().charactersWithTurn.has(character.uuid)
		).toBe(true);
	});

	it('should return failure if undo is called without executing', () => {
		const command = new EndRoundCommand({}, { encounterStore });

		const status = command.undo();

		expect(status).toBe(STATUS.failure);
	});

	it('should finalize round elapsed timing and restore it on undo', () => {
		encounterStore.setState(() => ({
			initiativePhase: INITIATIVE_PHASE.Active,
			activeTurnParticipantId: character.uuid,
			activeTurnRound: 1,
			activeTurnStartedAtMs: 1000,
			activeRoundStartedAtMs: 1000,
			turnElapsedByRoundParticipant: {},
			roundElapsedByRound: {},
			roundDurationHistory: [],
			lastRoundElapsedMs: 0,
		}));

		const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(1800);
		const command = new EndRoundCommand({}, { encounterStore });

		expect(command.execute()).toBe(STATUS.success);

		const executedState = encounterStore.getState();
		expect(executedState.round).toBe(2);
		expect(executedState.lastRoundElapsedMs).toBe(800);
		expect(executedState.roundElapsedByRound[1]).toBe(800);
		expect(executedState.roundDurationHistory).toEqual([
			{ round: 1, elapsedMs: 800 },
		]);

		expect(command.undo()).toBe(STATUS.success);

		const undoneState = encounterStore.getState();
		expect(undoneState.round).toBe(1);
		expect(undoneState.lastRoundElapsedMs).toBe(0);
		expect(undoneState.roundElapsedByRound[1]).toBeUndefined();
		expect(undoneState.roundDurationHistory).toHaveLength(0);

		nowSpy.mockRestore();
	});
});
