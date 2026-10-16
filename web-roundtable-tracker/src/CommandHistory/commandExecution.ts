import { type EncounterStore } from '@/store/encounterRuntimeStore';
import {
	advanceTimer,
	rewindTimer,
	startTimer,
	type TurnPosition,
} from '@/store/encounterTimer';
import { type StoreApi } from 'zustand/vanilla';
import { Command, STATUS } from './common';

type EncounterStoreApi = StoreApi<EncounterStore>;

const commandName = (command: Command) => command.description ?? command.type;

// The tracker's current participant is the first in the order.
const getTurnPosition = (state: EncounterStore): TurnPosition => ({
	participantId: state.charactersOrder[0] ?? null,
	round: state.round,
});

/**
 * Whether the participant the timer is on still has a turn this round. Read
 * before a command runs: commands change charactersWithTurn in place.
 */
const timedParticipantHasTurn = (state: EncounterStore) => {
	const participantId = state.timer?.turnParticipantId;

	return Boolean(participantId && state.charactersWithTurn.has(participantId));
};

/**
 * Moves the timer after a command changed whose turn it is or the round.
 * Going forward, the turn that ended is logged only if its participant had a
 * turn (one skipped because it already acted didn't take one).
 */
const moveTimer = (
	store: EncounterStoreApi,
	direction: 'forward' | 'back',
	endedTurnWasTaken: boolean,
	now: number
) => {
	const state = store.getState();
	const position = getTurnPosition(state);
	const { timer } = state;

	if (!timer) {
		if (position.participantId) {
			state.setTimer(startTimer(position, now));
		}

		return;
	}

	state.setTimer(
		direction === 'forward'
			? advanceTimer(timer, position, now, endedTurnWasTaken)
			: rewindTimer(timer, position, now)
	);
};

/**
 * Runs a command and records it for undo. A command that fails leaves the
 * state unchanged, so there is nothing to roll back here (CompositeCommand
 * rolls back its own parts); it throws.
 */
export const executeCommand = (
	store: EncounterStoreApi,
	command: Command,
	now = Date.now()
) => {
	const endedTurnWasTaken = timedParticipantHasTurn(store.getState());

	if (command.execute() === STATUS.failure) {
		throw new Error('Failed to execute command');
	}

	const state = store.getState();
	state.setHistory((prev) => [...prev, command]);
	state.setRedoStack([]);
	moveTimer(store, 'forward', endedTurnWasTaken, now);
};

/** Undoes the last command; logs and keeps it when its undo fails. */
export const undoLastCommand = (store: EncounterStoreApi, now = Date.now()) => {
	const lastCommand = store.getState().history.at(-1);

	if (!lastCommand) return;

	if (lastCommand.undo() === STATUS.failure) {
		console.error(`Failed to undo command: ${commandName(lastCommand)}`);

		return;
	}

	const state = store.getState();
	state.setHistory((prev) => prev.slice(0, -1));
	state.setRedoStack((prev) => [lastCommand, ...prev]);
	moveTimer(store, 'back', false, now);
};

/** Redoes the next undone command; logs and keeps it when it fails. */
export const redoNextCommand = (store: EncounterStoreApi, now = Date.now()) => {
	const endedTurnWasTaken = timedParticipantHasTurn(store.getState());
	const nextCommand = store.getState().redoStack[0];

	if (!nextCommand) return;

	if (nextCommand.execute() === STATUS.failure) {
		console.error(`Failed to redo command: ${commandName(nextCommand)}`);

		return;
	}

	const state = store.getState();
	state.setRedoStack((prev) => prev.slice(1));
	state.setHistory((prev) => [...prev, nextCommand]);
	moveTimer(store, 'forward', endedTurnWasTaken, now);
};
