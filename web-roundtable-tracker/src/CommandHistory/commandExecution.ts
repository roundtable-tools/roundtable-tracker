import { type EncounterStore } from '@/store/encounterRuntimeStore';
import {
	advanceTimer,
	type EncounterTimer,
	rewindTimer,
	startTimer,
	type TurnPosition,
} from '@/store/encounterTimer';
import { isDelaying } from '@/store/operations';
import { CompositeCommand } from './Commands/CompositeCommand';
import { SetHiddenFromPlayersCommand } from './Commands/SetHiddenFromPlayersCommand';
import { Command, type CommandDeps, STATUS } from './common';

type EncounterStoreApi = CommandDeps['encounterStore'];

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
 * The name of the participant the timer is on, for its turn's log entry.
 * Read before a command runs: Slay / Destroy removes the participant.
 */
const timedParticipantName = (state: EncounterStore) => {
	const participantId = state.timer?.turnParticipantId;

	return participantId ? (state.charactersMap[participantId]?.name ?? '') : '';
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

/**
 * The timer after a command changed whose turn it is or the round.
 * `endedTurnName` names the turn the command ended, or is null when it
 * ended none.
 */
const movedTimer = (
	state: EncounterStore,
	direction: 'forward' | 'back',
	endedTurnName: string | null,
	now: number
): EncounterTimer | null => {
	const position = getTurnPosition(state);
	const { timer } = state;

	if (!timer) {
		return position.participantId ? startTimer(position, now) : null;
	}

	return direction === 'forward'
		? advanceTimer(timer, position, now, endedTurnName)
		: rewindTimer(timer, position, now);
};

/**
 * Reveals a participant hidden from the players when the command started its
 * turn: the current participant or the round changed, and the new current
 * participant acts (it has a turn and isn't delaying). Returns the command
 * to record: the command alone, or it with the reveal in one undo step.
 */
const withRevealOnTurnStart = (
	store: EncounterStoreApi,
	command: Command,
	before: TurnPosition
): Command => {
	const state = store.getState();
	const after = getTurnPosition(state);
	const participantId = after.participantId;

	if (
		!participantId ||
		(after.participantId === before.participantId &&
			after.round === before.round) ||
		!state.charactersWithTurn.has(participantId) ||
		isDelaying(state.charactersMap, participantId) ||
		state.trackerMetaMap[participantId]?.hiddenUntilFirstTurn !== true
	) {
		return command;
	}

	const reveal = new SetHiddenFromPlayersCommand(
		{ uuid: participantId, hidden: false },
		{ encounterStore: store }
	);

	if (reveal.execute() === STATUS.failure) return command;

	return new CompositeCommand({ commands: [command, reveal] });
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
	const before = store.getState();
	const hadTurn = timedParticipantHasTurn(before);
	const timedName = timedParticipantName(before);

	if (command.execute() === STATUS.failure) return false;

	const done = withRevealOnTurnStart(store, command, getTurnPosition(before));
	const state = store.getState();

	store.setState({
		history: record(state.history, done),
		redoStack: redoStack(state.redoStack),
		timer: movedTimer(
			state,
			'forward',
			timedTurnEnded(state, hadTurn) ? timedName : null,
			now
		),
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
 * step while `step` is the last one recorded and the command doesn't move
 * the turn or the round (an undo rewinds the timer only once); otherwise the
 * command is recorded as a step of its own. Throws when it fails.
 */
export const amendCommand = (
	store: EncounterStoreApi,
	step: Command | undefined,
	command: Command,
	now = Date.now()
) => {
	const before = getTurnPosition(store.getState());
	const keepsTurn = () => {
		const after = getTurnPosition(store.getState());

		return (
			after.participantId === before.participantId &&
			after.round === before.round
		);
	};
	const amended = runForward(
		store,
		command,
		() => [],
		now,
		(history, done) =>
			step && history.at(-1) === step && keepsTurn()
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
		timer: movedTimer(state, 'back', null, now),
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
