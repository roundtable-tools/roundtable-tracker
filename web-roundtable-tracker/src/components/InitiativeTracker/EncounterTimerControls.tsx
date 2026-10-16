import { Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	formatDuration,
	pauseTimer,
	resumeTimer,
} from '@/store/encounterTimer';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { useTimerElapsed } from './useTimerElapsed';

/** The round and turn time with a pause/resume button, for the tracker toolbar. */
export function EncounterTimerControls() {
	const timer = useEncounterStore((state) => state.timer);
	const setTimer = useEncounterStore((state) => state.setTimer);
	const elapsed = useTimerElapsed(timer);

	if (!timer || !elapsed) return null;

	const isPaused = timer.pausedAt !== null;
	const label = isPaused ? 'Resume Timer' : 'Pause Timer';

	return (
		<div className="flex shrink-0 items-center gap-2">
			<dl
				className={`flex gap-3 text-sm tabular-nums ${isPaused ? 'text-muted-foreground' : ''}`}
			>
				<div className="flex items-baseline gap-1">
					<dt className="text-xs uppercase tracking-wide text-muted-foreground">
						Round
					</dt>
					<dd data-slot="tracker-round-time">
						{formatDuration(elapsed.roundMs)}
					</dd>
				</div>
				<div className="flex items-baseline gap-1">
					<dt className="text-xs uppercase tracking-wide text-muted-foreground">
						Turn
					</dt>
					<dd data-slot="tracker-turn-time">
						{formatDuration(elapsed.turnMs)}
					</dd>
				</div>
			</dl>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						aria-label={label}
						variant="secondary"
						size="icon"
						onClick={() => {
							const now = Date.now();

							setTimer(
								(current) =>
									current &&
									(isPaused
										? resumeTimer(current, now)
										: pauseTimer(current, now))
							);
						}}
					>
						{isPaused ? (
							<Play className="h-4 w-4" />
						) : (
							<Pause className="h-4 w-4" />
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent side="bottom">{label}</TooltipContent>
			</Tooltip>
		</div>
	);
}
