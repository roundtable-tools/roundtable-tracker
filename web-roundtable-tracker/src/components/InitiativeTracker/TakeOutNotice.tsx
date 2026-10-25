import { Button } from '@/components/ui/button';
import {
	getOutOfFightNames,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import { TimedNotice } from './TimedNotice';
import {
	getDefaultTakeOut,
	TAKE_OUT_EFFECT_TEXT,
	type TakeOutEffect,
} from './takeOut';

/**
 * Asks what follows a manual K.O. or Disable, which has already run: the
 * participant stays knocked out or is slain (disabled or destroyed for a
 * hazard), and whether its `effects` values are set to match. The default
 * (see TimedNotice) follows the participant's side (getDefaultTakeOut), is
 * named in the title, changes no value, and has the least visible button.
 */
export function TakeOutNotice({
	participant,
	effects,
	onTakeOut,
	onRemove,
}: {
	participant: Pick<TrackerParticipant, 'name' | 'role' | 'sideTheme'>;
	effects: TakeOutEffect[];
	onTakeOut: (effects: TakeOutEffect[]) => void;
	onRemove: () => void;
}) {
	const names = getOutOfFightNames(participant);
	const removeByDefault = getDefaultTakeOut(participant) === 'remove';
	const takeOut = () => onTakeOut([]);
	// Each value on its own, then all of them together.
	const effectChoices =
		effects.length > 1 ? [...effects.map((e) => [e]), effects] : [effects];

	return (
		<TimedNotice
			title={`${removeByDefault ? names.removedState : names.outState}?`}
			description={`${participant.name} is out of the fight.`}
			closeLabel={removeByDefault ? names.remove : names.takeOut}
			onDismiss={removeByDefault ? onRemove : takeOut}
		>
			{(settle) => (
				<div className="grid gap-2">
					<Button
						size="sm"
						variant={removeByDefault ? 'outline' : 'destructive'}
						className="w-full"
						onClick={() => settle(removeByDefault ? takeOut : onRemove)}
					>
						{removeByDefault ? names.takeOut : names.remove}
					</Button>
					{effects.length > 0 &&
						effectChoices.map((choice) => (
							<Button
								key={choice.join('+')}
								size="sm"
								variant="outline"
								className="w-full"
								onClick={() => settle(() => onTakeOut(choice))}
							>
								{names.takeOut} and{' '}
								{choice
									.map((effect) => TAKE_OUT_EFFECT_TEXT[effect])
									.join(' and ')}
							</Button>
						))}
					<Button
						size="sm"
						variant="outline"
						className="w-full text-muted-foreground"
						onClick={() => settle(removeByDefault ? onRemove : takeOut)}
					>
						{removeByDefault ? names.remove : names.takeOut}
					</Button>
				</div>
			)}
		</TimedNotice>
	);
}
