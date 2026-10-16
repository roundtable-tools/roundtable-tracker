import { useSyncExternalStore } from 'react';
import { type EncounterTimer, getElapsed } from '@/store/encounterTimer';

// One clock for every timer display, so they all show the same second. It
// ticks only while a running timer is shown.
let now = Date.now();
const listeners = new Set<() => void>();
let interval: number | undefined;

const subscribeToClock = (listener: () => void) => {
	listeners.add(listener);

	if (interval === undefined) {
		now = Date.now();
		interval = window.setInterval(() => {
			now = Date.now();
			listeners.forEach((notify) => notify());
		}, 1000);
	}

	return () => {
		listeners.delete(listener);

		if (listeners.size === 0) {
			window.clearInterval(interval);
			interval = undefined;
		}
	};
};

const subscribeToNothing = () => () => {};

const getNow = () => now;

/**
 * The round and turn time of a timer, counting up every second while it
 * runs. A paused or missing timer doesn't tick.
 */
export const useTimerElapsed = (timer: EncounterTimer | null | undefined) => {
	const isRunning = Boolean(timer) && timer?.pausedAt === null;
	const clockNow = useSyncExternalStore(
		isRunning ? subscribeToClock : subscribeToNothing,
		getNow
	);

	return timer ? getElapsed(timer, clockNow) : null;
};
