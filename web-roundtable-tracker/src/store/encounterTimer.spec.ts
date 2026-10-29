import { describe, expect, it } from 'vitest';
import {
	advanceTimer,
	formatDuration,
	getElapsed,
	getTurnStats,
	pauseTimer,
	resumeTimer,
	rewindTimer,
	startTimer,
} from './encounterTimer';

const SECOND = 1000;

describe('encounter timer', () => {
	const started = startTimer({ participantId: 'hero', round: 1 }, 0);

	it('counts the round and the turn up from the start', () => {
		expect(getElapsed(started, 42 * SECOND)).toEqual({
			roundMs: 42 * SECOND,
			turnMs: 42 * SECOND,
		});
	});

	it('logs a finished turn and restarts the turn time', () => {
		const timer = advanceTimer(
			started,
			{ participantId: 'goblin', round: 1 },
			30 * SECOND,
			'Hero'
		);

		expect(timer.turnLog).toEqual([
			{
				participantId: 'hero',
				name: 'Hero',
				round: 1,
				durationMs: 30 * SECOND,
			},
		]);
		expect(getElapsed(timer, 40 * SECOND)).toEqual({
			roundMs: 40 * SECOND,
			turnMs: 10 * SECOND,
		});
	});

	it('logs the round and restarts both times when the round ends', () => {
		const second = advanceTimer(
			started,
			{ participantId: 'goblin', round: 1 },
			30 * SECOND,
			'Hero'
		);
		const nextRound = advanceTimer(
			second,
			{ participantId: 'hero', round: 2 },
			50 * SECOND,
			'Goblin'
		);

		expect(nextRound.roundLog).toEqual([{ round: 1, durationMs: 50 * SECOND }]);
		expect(nextRound.turnLog.at(-1)).toEqual({
			participantId: 'goblin',
			name: 'Goblin',
			round: 1,
			durationMs: 20 * SECOND,
		});
		expect(getElapsed(nextRound, 55 * SECOND)).toEqual({
			roundMs: 5 * SECOND,
			turnMs: 5 * SECOND,
		});
	});

	it('leaves the timer alone when the turn and round stay the same', () => {
		expect(
			advanceTimer(
				started,
				{ participantId: 'hero', round: 1 },
				99 * SECOND,
				'Hero'
			)
		).toBe(started);
	});

	it('does not log a turn the caller marks as not taken', () => {
		const timer = advanceTimer(
			started,
			{ participantId: 'goblin', round: 1 },
			5 * SECOND,
			null
		);

		expect(timer.turnLog).toEqual([]);
		expect(timer.turnParticipantId).toBe('goblin');
	});

	it('undo brings the turn back with the time it had', () => {
		const advanced = advanceTimer(
			started,
			{ participantId: 'goblin', round: 1 },
			30 * SECOND,
			'Hero'
		);
		const rewound = rewindTimer(
			advanced,
			{ participantId: 'hero', round: 1 },
			100 * SECOND
		);

		expect(rewound.turnLog).toEqual([]);
		expect(getElapsed(rewound, 100 * SECOND).turnMs).toBe(30 * SECOND);
	});

	it('undo brings a round back with the time it had', () => {
		const lastTurn = advanceTimer(
			started,
			{ participantId: 'goblin', round: 1 },
			30 * SECOND,
			'Hero'
		);
		const nextRound = advanceTimer(
			lastTurn,
			{ participantId: 'hero', round: 2 },
			50 * SECOND,
			'Goblin'
		);
		const rewound = rewindTimer(
			nextRound,
			{ participantId: 'goblin', round: 1 },
			70 * SECOND
		);

		expect(rewound.roundLog).toEqual([]);
		expect(rewound.turnLog).toHaveLength(1);
		expect(getElapsed(rewound, 70 * SECOND)).toEqual({
			roundMs: 50 * SECOND,
			turnMs: 20 * SECOND,
		});
	});

	it('restarts the turn on undo when the log has no matching turn', () => {
		const rewound = rewindTimer(
			started,
			{ participantId: 'goblin', round: 1 },
			20 * SECOND
		);

		expect(getElapsed(rewound, 25 * SECOND).turnMs).toBe(5 * SECOND);
	});

	it('stops both times while paused and leaves the pause out', () => {
		const paused = pauseTimer(started, 10 * SECOND);

		expect(getElapsed(paused, 60 * SECOND)).toEqual({
			roundMs: 10 * SECOND,
			turnMs: 10 * SECOND,
		});

		const resumed = resumeTimer(paused, 60 * SECOND);

		expect(resumed.pausedAt).toBeNull();
		expect(getElapsed(resumed, 65 * SECOND)).toEqual({
			roundMs: 15 * SECOND,
			turnMs: 15 * SECOND,
		});
	});

	it('logs a turn ended while paused without the pause', () => {
		const paused = pauseTimer(started, 10 * SECOND);
		const advanced = advanceTimer(
			paused,
			{ participantId: 'goblin', round: 1 },
			60 * SECOND,
			'Hero'
		);

		expect(advanced.turnLog[0].durationMs).toBe(10 * SECOND);
		expect(getElapsed(resumeTimer(advanced, 70 * SECOND), 70 * SECOND)).toEqual(
			{
				roundMs: 10 * SECOND,
				turnMs: 0,
			}
		);
	});

	it('sums turn times per participant, under the latest logged name', () => {
		expect(
			getTurnStats([
				{
					participantId: 'hero',
					name: 'Hero',
					round: 1,
					durationMs: 30 * SECOND,
				},
				{
					participantId: 'goblin',
					name: 'Goblin',
					round: 1,
					durationMs: 10 * SECOND,
				},
				{
					participantId: 'hero',
					name: 'Kyra',
					round: 2,
					durationMs: 50 * SECOND,
				},
			])
		).toEqual([
			{
				participantId: 'hero',
				name: 'Kyra',
				turns: 2,
				totalMs: 80 * SECOND,
				averageMs: 40 * SECOND,
				longestMs: 50 * SECOND,
			},
			{
				participantId: 'goblin',
				name: 'Goblin',
				turns: 1,
				totalMs: 10 * SECOND,
				averageMs: 10 * SECOND,
				longestMs: 10 * SECOND,
			},
		]);
	});

	it('formats durations as m:ss, and h:mm:ss from an hour on', () => {
		expect(formatDuration(0)).toBe('0:00');
		expect(formatDuration(65 * SECOND)).toBe('1:05');
		expect(formatDuration(3_725 * SECOND)).toBe('1:02:05');
	});
});
