import encounterStore$ from '../initiativeStore';

export function initializeRoundTimer(round: number, start: number) {
	encounterStore$.roundTimestamps[round].set({ start });
}

export function finalizeRoundTimer(currentRound: number, nextRound: number) {
	const start =
		encounterStore$.roundTimestamps[currentRound]?.start.peek() || Date.now();
	const end = Date.now();
	const duration = end - start;
	encounterStore$.roundTimestamps[currentRound].set({ start, end, duration });
	encounterStore$.roundTimestamps[nextRound].set({ start: end });
}
