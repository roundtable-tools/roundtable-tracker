import { Button } from '@/components/ui/button';
import { TimedNotice } from './TimedNotice';
import { type ReturnPromptEntry } from './roundActionCommand';

type DelayedParticipant = ReturnPromptEntry & { name: string };

/**
 * Asks whether a delaying participant returns before the turn ends, listing
 * each one's distance from its old spot. Picking one returns it; anything
 * else (see TimedNotice) means nobody returns.
 */
export function ReturnToInitiativeNotice({
	participants,
	onReturn,
	onDismiss,
}: {
	participants: DelayedParticipant[];
	onReturn: (participantId: string) => void;
	onDismiss: () => void;
}) {
	return (
		<TimedNotice
			title="Return to Initiative?"
			description="Before this turn ends, does a delaying participant return?"
			closeLabel="Nobody returns"
			onDismiss={onDismiss}
		>
			{(settle) => (
				<div className="space-y-2">
					{participants.map((participant) => (
						<div
							key={participant.id}
							className="flex items-center justify-between gap-2 rounded-md border p-2 pl-3"
						>
							<p className="text-sm font-semibold">
								{participant.name}
								<span className="font-normal text-muted-foreground">
									{` (${participant.distance})`}
								</span>
							</p>
							<Button
								size="sm"
								onClick={() => settle(() => onReturn(participant.id))}
							>
								Return
							</Button>
						</div>
					))}
				</div>
			)}
		</TimedNotice>
	);
}
