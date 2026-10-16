import { Timer } from 'lucide-react';
import { type EncounterTimer, formatDuration } from '@/store/encounterTimer';
import { useTimerElapsed } from './useTimerElapsed';

/** The current turn's time, counting up; ticks on its own, not the page. */
export function TurnTimeChip({
	timer,
	className = '',
}: {
	timer: EncounterTimer | null | undefined;
	className?: string;
}) {
	const elapsed = useTimerElapsed(timer);

	if (!elapsed) return null;

	return (
		<span
			data-slot="turn-time"
			aria-label="Turn time"
			className={`inline-flex shrink-0 items-center gap-1 tabular-nums ${className}`}
		>
			<Timer className="h-3 w-3" />
			{formatDuration(elapsed.turnMs)}
		</span>
	);
}
