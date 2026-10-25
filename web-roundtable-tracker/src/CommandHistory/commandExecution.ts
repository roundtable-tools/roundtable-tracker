import { type EncounterStore } from '@/store/encounterRuntimeStore';
import {
	advanceTimer,
	type EncounterTimer,
	rewindTimer,
	startTimer,
	type TurnPosition,
} from '@/store/encounterTimer';
import { type StoreApi } from 'zustand/vanilla';
import { CompositeCommand } from './Commands/CompositeCommand';
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
 * Whether the command ended the turn the timer is on: its participant had a
 * turn and used it up (ending it or delaying), left the order (e.g. knocked
 * out) or the round ended with it. A reorder that only moves someone else on
 * top ends no turn, and one skipped because it already acted had none to end.
 */
const timedTurnEnded = (state: EncounterStore, hadTurn: boolean) => {
	const participantId = state.timer?.turnParticipantId;

	return Boolean(
		hadTurn &&
		participantId &&
		(state.round !== state.timer?.round ||
			!state.charactersWithTurn.has(participantId) ||
			!state.charactersOrder.includes(participantId))
	);
};

/** The timer after a command changed whose turn it is or the round. */
const movedTimer = (
	state: EncounterStore,
	direction: 'forward' | 'back',
	turnEnded: boolean,
	now: number
): EncounterTimer | null => {
	const position = getTurnPosition(state);
	const { timer } = state;

	if (!timer) {
		return position.participantId ? startTimer(position, now) : null;
	}

	return direction === 'forward'
		? advanceTimer(timer, position, now, turnEnded)
		: rewindTimer(timer, position, now);
};

/**
 * Runs a command forward, records it in the history and moves the timer, in
 * one store update so the player window never sees the order without its
 * timer. Returns false when the command fails, which leaves the state
 * unchanged (CompositeCommand rolls back its own parts).
 */
const runForward = (
	store: EncounterStoreApi,
	command: Command,
	redoStack: (prev: Command[]) => Command[],
	now: number,
	record: (history: Command[], command: Command) => Command[] = (
		history,
		done
	) => [...history, done]
) => {
	const hadTurn = timedParticipantHasTurn(store.getState());

	if (command.execute() === STATUS.failure) return false;

	const state = store.getState();

	store.setState({
		history: record(state.history, command),
		redoStack: redoStack(state.redoStack),
		timer: movedTimer(state, 'forward', timedTurnEnded(state, hadTurn), now),
	});

	return true;
};

/** Runs a command and records it for undo; throws when it fails. */
export const executeCommand = (
	store: EncounterStoreApi,
	command: Command,
	now = Date.now()
) => {
	if (!runForward(store, command, () => [], now)) {
		throw new Error('Failed to execute command');
	}
};

/**
 * Runs a command in the same undo step as `step`, so one undo takes back both
 * (e.g. the GM's answer to a K.O. that already ran). They can only share a
 * step while `step` is the last one recorded; otherwise the command is
 * recorded as a step of its own. Throws when it fails.
 */
export const amendCommand = (
	store: EncounterStoreApi,
	step: Command | undefined,
	command: Command,
	now = Date.now()
) => {
	const amended = runForward(
		store,
		command,
		() => [],
		now,
		(history, done) =>
			step && history.at(-1) === step
				? [
						...history.slice(0, -1),
						new CompositeCommand({ commands: [step, done] }),
					]
				: [...history, done]
	);

	if (!amended) {
		throw new Error('Failed to execute command');
	}
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

	store.setState({
		history: state.history.slice(0, -1),
		redoStack: [lastCommand, ...state.redoStack],
		timer: movedTimer(state, 'back', false, now),
	});
};

/** Redoes the next undone command; logs and keeps it when it fails. */
export const redoNextCommand = (store: EncounterStoreApi, now = Date.now()) => {
	const nextCommand = store.getState().redoStack[0];

	if (!nextCommand) return;

	if (!runForward(store, nextCommand, (prev) => prev.slice(1), now)) {
		console.error(`Failed to redo command: ${commandName(nextCommand)}`);
	}
};
