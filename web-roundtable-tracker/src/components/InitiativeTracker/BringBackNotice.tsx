import { Button } from '@/components/ui/button';
import {
	getOutOfFightNames,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import { TimedNotice } from './TimedNotice';
import { BRING_BACK_EFFECT_TEXT, type TakeOutEffect } from './takeOut';

const STILL_OUT_TEXT: Record<TakeOutEffect, string> = {
	hp: 'it is at 0 HP',
	checks: 'its disable checks are full',
};

const BACK_TEXT: Record<TakeOutEffect, string> = {
	hp: 'is above 0 HP',
	checks: 'has disable checks left',
};

/**
 * Asks whether a knocked-out or disabled participant comes back when one
 * value left its take-out level (`reason`) while others (`stillOut`) are
 * still there. Reactivate also brings those back; anything else (see
 * TimedNotice) keeps the participant out.
 */
export function BringBackNotice({
	participant,
	reason,
	stillOut,
	onStayOut,
	onReactivate,
}: {
	participant: Pick<TrackerParticipant, 'name' | 'role'>;
	reason: TakeOutEffect;
	stillOut: TakeOutEffect[];
	onStayOut: () => void;
	onReactivate: () => void;
}) {
	const names = getOutOfFightNames(participant);
	const stayOut = `Stay ${names.outState}`;

	return (
		<TimedNotice
			title={`Still ${names.outState}?`}
			description={`${participant.name} ${BACK_TEXT[reason]}, but ${stillOut
				.map((effect) => STILL_OUT_TEXT[effect])
				.join(' and ')}. Reactivate ${stillOut
				.map((effect) => BRING_BACK_EFFECT_TEXT[effect])
				.join(' and ')}.`}
			closeLabel={stayOut}
			onDismiss={onStayOut}
		>
			{(settle) => (
				<div className="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						className="flex-1"
						onClick={() => settle(onStayOut)}
					>
						{stayOut}
					</Button>
					<Button
						size="sm"
						className="flex-1"
						onClick={() => settle(onReactivate)}
					>
						Reactivate
					</Button>
				</div>
			)}
		</TimedNotice>
	);
}
