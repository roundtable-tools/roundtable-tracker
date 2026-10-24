import { Button } from '@/components/ui/button';
import {
	getOutOfFightNames,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import { TimedNotice } from './TimedNotice';
import { type TakeOutEffect } from './takeOut';

/**
 * Asks whether a participant that dropped to 0 HP or had its disable checks
 * filled is knocked out or slain (disabled or destroyed, for a hazard).
 * Anything but Knock Out / Disable (see TimedNotice) means slain / destroyed.
 */
export function TakeOutNotice({
	participant,
	reason,
	onTakeOut,
	onRemove,
}: {
	participant: Pick<TrackerParticipant, 'name' | 'role'>;
	reason: TakeOutEffect;
	onTakeOut: () => void;
	onRemove: () => void;
}) {
	const names = getOutOfFightNames(participant);

	return (
		<TimedNotice
			title={`${names.outState} or ${names.removedState}?`}
			description={
				reason === 'hp'
					? `${participant.name} dropped to 0 HP.`
					: `${participant.name} has its disable checks full.`
			}
			closeLabel={names.removedState}
			onDismiss={onRemove}
		>
			{(settle) => (
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						className="flex-1"
						onClick={() => settle(onTakeOut)}
					>
						{names.takeOut}
					</Button>
					<Button
						size="sm"
						variant="destructive"
						className="flex-1"
						onClick={() => settle(onRemove)}
					>
						{names.remove}
					</Button>
				</div>
			)}
		</TimedNotice>
	);
}
