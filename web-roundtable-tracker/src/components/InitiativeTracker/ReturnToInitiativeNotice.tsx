import { Button } from '@/components/ui/button';
import { TimedNotice } from './TimedNotice';

type DelayedParticipant = { id: string; name: string };

/**
 * Asks whether a delaying participant returns before the turn ends. Picking
 * one returns it; anything else (see TimedNotice) means nobody returns, apart
 * from `returningId`, whose old spot is next and who comes back anyway.
 */
export function ReturnToInitiativeNotice({
	participants,
	returningId,
	onReturn,
	onDismiss,
}: {
	participants: DelayedParticipant[];
	returningId?: string;
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
							<div>
								<p className="text-sm font-semibold">{participant.name}</p>
								{participant.id === returningId && (
									<p className="text-xs text-muted-foreground">
										Back at their spot after this turn anyway
									</p>
								)}
							</div>
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
