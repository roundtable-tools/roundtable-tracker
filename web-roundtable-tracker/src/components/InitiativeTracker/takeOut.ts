import { type Command, type CommandDeps } from '@/CommandHistory/common';
import { ChangeHealthCommand } from '@/CommandHistory/Commands/ChangeHealthCommand';
import { CompositeCommand } from '@/CommandHistory/Commands/CompositeCommand';
import { RecordDisableProgressCommand } from '@/CommandHistory/Commands/RecordDisableProgressCommand';
import {
	type EncounterStore,
	hasFullDisableChecks,
} from '@/store/encounterRuntimeStore';
import { type UUID } from '@/utils/uuid';

/**
 * What a manual K.O. or Disable sets so the participant's data matches its
 * new state: HP to 0, or the disable checks to full.
 */
export type TakeOutEffect = 'hp' | 'checks';

/** What each effect sets, as the K.O. / Disable buttons say it. */
export const TAKE_OUT_EFFECT_TEXT: Record<TakeOutEffect, string> = {
	hp: 'sets HP to 0',
	checks: 'fills the disable checks',
};

export const TAKE_OUT_EFFECT_SHORT_LABEL: Record<TakeOutEffect, string> = {
	hp: '0 HP',
	checks: 'Checks',
};

type TakeOutState = Pick<EncounterStore, 'charactersMap' | 'trackerMetaMap'>;

/**
 * The effects a manual K.O. or Disable can have: one per value the
 * participant has (HP, disable checks), or none.
 */
export function getTakeOutEffects(
	uuid: UUID,
	{ trackerMetaMap }: Pick<TakeOutState, 'trackerMetaMap'>
): TakeOutEffect[] {
	const meta = trackerMetaMap[uuid];
	const effects: TakeOutEffect[] = [];

	if (meta?.hasHealthData !== false) effects.push('hp');

	if ((meta?.disableChecksRequired ?? 0) > 0) effects.push('checks');

	return effects;
}

/** The command that applies a take-out effect, or null if nothing changes. */
export function getTakeOutEffectCommand(
	uuid: UUID,
	effect: TakeOutEffect,
	{ charactersMap, trackerMetaMap }: TakeOutState,
	deps?: CommandDeps
): Command | null {
	if (effect === 'hp') {
		const character = charactersMap[uuid];
		const hitPoints = (character?.health ?? 0) + (character?.tempHealth ?? 0);

		return hitPoints > 0
			? new ChangeHealthCommand({ uuid, delta: -hitPoints }, deps)
			: null;
	}

	const meta = trackerMetaMap[uuid];

	return meta && meta.disableChecksRequired > 0 && !hasFullDisableChecks(meta)
		? new RecordDisableProgressCommand(
				{ uuid, value: meta.disableChecksRequired },
				deps
			)
		: null;
}

/**
 * Whether damage takes a participant that is still in the fight to 0 HP,
 * which asks the GM whether it is knocked out or slain.
 */
export function damageDropsToZeroHp(
	uuid: UUID,
	damage: number,
	{ charactersMap, trackerMetaMap }: TakeOutState
) {
	const character = charactersMap[uuid];

	if (
		!character ||
		character.turnState === 'knocked-out' ||
		trackerMetaMap[uuid]?.hasHealthData === false
	) {
		return false;
	}

	return (
		character.health > 0 && character.health + character.tempHealth <= damage
	);
}

/**
 * Whether a disable progress change fills the checks of a participant that
 * is still in the fight, which asks the GM whether it is taken out or
 * removed.
 */
export function disableProgressFillsChecks(
	uuid: UUID,
	change: { delta: number } | { value: number },
	{ charactersMap, trackerMetaMap }: TakeOutState
) {
	const character = charactersMap[uuid];
	const meta = trackerMetaMap[uuid];

	if (
		!character ||
		!meta ||
		character.turnState === 'knocked-out' ||
		meta.disableChecksRequired <= 0 ||
		hasFullDisableChecks(meta)
	) {
		return false;
	}

	const succeeded =
		'value' in change
			? change.value
			: meta.disableChecksSucceeded + change.delta;

	return succeeded >= meta.disableChecksRequired;
}

/** Runs `before` and `command` as one undo step. */
export function withPrecedingCommand(
	before: Command | null | undefined,
	command: Command
): Command {
	return before
		? new CompositeCommand({ commands: [before, command] })
		: command;
}
