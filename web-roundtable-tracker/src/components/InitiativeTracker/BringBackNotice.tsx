import { Button } from '@/components/ui/button';
import {
	getOutOfFightNames,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import { TimedNotice } from './TimedNotice';
import { getBringBackEffectText, type TakeOutEffect } from './takeOut';

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
 * value left its take-out level (`reason`). If other values (`stillOut`) are
 * still there, it stays out unless the GM also sets them back; otherwise it
 * comes back unless the GM keeps it out. The default (see TimedNotice) is
 * the one that changes no other value.
 */
export function BringBackNotice({
	participant,
	reason,
	stillOut,
	onStayOut,
	onReactivate,
}: {
	participant: Pick<
		TrackerParticipant,
		'name' | 'role' | 'disableChecksRequired'
	>;
	reason: TakeOutEffect;
	stillOut: TakeOutEffect[];
	onStayOut: () => void;
	onReactivate: () => void;
}) {
	const names = getOutOfFightNames(participant);
	const keepOut = `Keep ${names.outState}`;

	if (stillOut.length === 0) {
		return (
			<TimedNotice
				title="Reactivate?"
				description={`${participant.name} ${BACK_TEXT[reason]}.`}
				closeLabel="Reactivate"
				onDismiss={onReactivate}
			>
				{(settle) => (
					<Button
						size="sm"
						variant="outline"
						className="w-full"
						onClick={() => settle(onStayOut)}
					>
						{keepOut}
					</Button>
				)}
			</TimedNotice>
		);
	}

	const setBack = stillOut
		.map((effect) =>
			getBringBackEffectText(effect, participant.disableChecksRequired)
		)
		.join(' and ');

	return (
		<TimedNotice
			title={`Still ${names.outState}?`}
			description={`${participant.name} ${BACK_TEXT[reason]}, but ${stillOut
				.map((effect) => STILL_OUT_TEXT[effect])
				.join(' and ')}.`}
			closeLabel={keepOut}
			onDismiss={onStayOut}
		>
			{(settle) => (
				<Button
					size="sm"
					className="w-full"
					onClick={() => settle(onReactivate)}
				>
					Also {setBack} and reactivate
				</Button>
			)}
		</TimedNotice>
	);
}
