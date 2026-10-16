import { useEffect, useState } from 'react';
import { type EncounterTimer, getElapsed } from '@/store/encounterTimer';

/**
 * The round and turn time of a timer, counting up every second while it
 * runs. A paused or missing timer doesn't tick.
 */
export const useTimerElapsed = (timer: EncounterTimer | null | undefined) => {
	const [now, setNow] = useState(() => Date.now());
	const isRunning = Boolean(timer) && timer?.pausedAt === null;

	useEffect(() => {
		setNow(Date.now());

		if (!isRunning) return;

		const interval = window.setInterval(() => setNow(Date.now()), 1000);

		return () => window.clearInterval(interval);
	}, [isRunning, timer]);

	return timer ? getElapsed(timer, now) : null;
};
