import { type UUID } from '@/utils/uuid';

/**
 * A finished turn: whose it was, in which round, and how long it took. The
 * name is the one the participant had then, so the turn keeps it after the
 * participant leaves the encounter.
 */
export type TurnLogEntry = {
	participantId: UUID;
	name: string;
	round: number;
	durationMs: number;
};

/** A finished round and how long it took. */
export type RoundLogEntry = { round: number; durationMs: number };

/**
 * Round and turn timing of a running encounter. Times are epoch
 * milliseconds; views count up from them, so they survive a reload and reach
 * the player window with the rest of the encounter.
 */
export type EncounterTimer = {
	round: number;
	roundStartedAt: number;
	/** Whose turn the turn time measures; null with nobody in the order. */
	turnParticipantId: UUID | null;
	turnStartedAt: number;
	/** When the timer was paused, or null while it runs. */
	pausedAt: number | null;
	turnLog: TurnLogEntry[];
	roundLog: RoundLogEntry[];
};

/** Whose turn it is and in which round, as the tracker sees it. */
export type TurnPosition = { participantId: UUID | null; round: number };

// While paused, time stands still at the pause.
const clock = (timer: EncounterTimer, now: number) => timer.pausedAt ?? now;

const isSamePosition = (timer: EncounterTimer, position: TurnPosition) =>
	timer.turnParticipantId === position.participantId &&
	timer.round === position.round;

export const startTimer = (
	position: TurnPosition,
	now: number
): EncounterTimer => ({
	round: position.round,
	roundStartedAt: now,
	turnParticipantId: position.participantId,
	turnStartedAt: now,
	pausedAt: null,
	turnLog: [],
	roundLog: [],
});

export const getElapsed = (timer: EncounterTimer, now: number) => ({
	roundMs: Math.max(0, clock(timer, now) - timer.roundStartedAt),
	turnMs: Math.max(0, clock(timer, now) - timer.turnStartedAt),
});

/**
 * Moves the timer to a new position after a tracker action: logs the turn
 * that ended under `endedTurnName` (unless it is null, e.g. for a participant
 * skipped because it already acted) and, when the round changed, the round.
 */
export const advanceTimer = (
	timer: EncounterTimer,
	position: TurnPosition,
	now: number,
	endedTurnName: string | null
): EncounterTimer => {
	if (isSamePosition(timer, position)) return timer;

	const at = clock(timer, now);
	const roundChanged = position.round !== timer.round;

	return {
		...timer,
		round: position.round,
		roundStartedAt: roundChanged ? at : timer.roundStartedAt,
		turnParticipantId: position.participantId,
		turnStartedAt: at,
		turnLog:
			timer.turnParticipantId && endedTurnName !== null
				? [
						...timer.turnLog,
						{
							participantId: timer.turnParticipantId,
							name: endedTurnName,
							round: timer.round,
							durationMs: at - timer.turnStartedAt,
						},
					]
				: timer.turnLog,
		roundLog: roundChanged
			? [
					...timer.roundLog,
					{ round: timer.round, durationMs: at - timer.roundStartedAt },
				]
			: timer.roundLog,
	};
};

/**
 * Moves the timer back after an undo. The turn that comes back drops its log
 * entry and continues from the time it had; so does a round that comes back.
 * Without a matching entry, the turn starts again from now.
 */
export const rewindTimer = (
	timer: EncounterTimer,
	position: TurnPosition,
	now: number
): EncounterTimer => {
	if (isSamePosition(timer, position)) return timer;

	const at = clock(timer, now);
	const lastTurn = timer.turnLog.at(-1);
	const turnComesBack =
		lastTurn?.participantId === position.participantId &&
		lastTurn?.round === position.round;
	const lastRound = timer.roundLog.at(-1);
	const roundComesBack =
		position.round !== timer.round && lastRound?.round === position.round;

	return {
		...timer,
		round: position.round,
		roundStartedAt: roundComesBack
			? at - lastRound.durationMs
			: position.round !== timer.round
				? at
				: timer.roundStartedAt,
		turnParticipantId: position.participantId,
		turnStartedAt: turnComesBack ? at - lastTurn.durationMs : at,
		turnLog: turnComesBack ? timer.turnLog.slice(0, -1) : timer.turnLog,
		roundLog: roundComesBack ? timer.roundLog.slice(0, -1) : timer.roundLog,
	};
};

export const pauseTimer = (
	timer: EncounterTimer,
	now: number
): EncounterTimer =>
	timer.pausedAt === null ? { ...timer, pausedAt: now } : timer;

/** Resumes a paused timer; the pause counts toward neither the round nor the turn. */
export const resumeTimer = (
	timer: EncounterTimer,
	now: number
): EncounterTimer => {
	if (timer.pausedAt === null) return timer;

	const pause = now - timer.pausedAt;

	return {
		...timer,
		roundStartedAt: timer.roundStartedAt + pause,
		turnStartedAt: timer.turnStartedAt + pause,
		pausedAt: null,
	};
};

export type ParticipantTurnStats = {
	participantId: UUID;
	/** The name logged with the participant's latest turn. */
	name: string;
	turns: number;
	totalMs: number;
	averageMs: number;
	longestMs: number;
};

/** Turn count, total, average and longest turn per participant, in log order. */
export const getTurnStats = (
	turnLog: TurnLogEntry[]
): ParticipantTurnStats[] => {
	const byParticipant = new Map<UUID, ParticipantTurnStats>();

	for (const { participantId, name, durationMs } of turnLog) {
		const stats = byParticipant.get(participantId) ?? {
			participantId,
			name,
			turns: 0,
			totalMs: 0,
			averageMs: 0,
			longestMs: 0,
		};

		stats.name = name;
		stats.turns += 1;
		stats.totalMs += durationMs;
		stats.longestMs = Math.max(stats.longestMs, durationMs);
		stats.averageMs = stats.totalMs / stats.turns;
		byParticipant.set(participantId, stats);
	}

	return [...byParticipant.values()];
};

/** `m:ss`, or `h:mm:ss` from an hour on. */
export const formatDuration = (ms: number) => {
	const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = String(totalSeconds % 60).padStart(2, '0');

	return hours > 0
		? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
		: `${minutes}:${seconds}`;
};
