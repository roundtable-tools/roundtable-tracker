import { Button } from '@/components/ui/button';
import { TimedNotice } from './TimedNotice';

/**
 * Asks, after the turn moved on while the timer was paused, whether it stays
 * paused. "Stay paused" keeps it paused; anything else (see TimedNotice)
 * resumes it.
 */
export function ResumeTimerNotice({
	onStayPaused,
	onResume,
}: {
	onStayPaused: () => void;
	onResume: () => void;
}) {
	return (
		<TimedNotice
			title="Resume the timer?"
			description="The turn moved on while the timer is paused. It resumes unless you keep it paused."
			closeLabel="Resume timer"
			onDismiss={onResume}
		>
			{(settle) => (
				<div className="flex justify-end">
					<Button
						size="sm"
						variant="secondary"
						onClick={() => settle(onStayPaused)}
					>
						Stay paused
					</Button>
				</div>
			)}
		</TimedNotice>
	);
}
