import { type Command, type CommandDeps } from '@/CommandHistory/common';
import { ChangeHealthCommand } from '@/CommandHistory/Commands/ChangeHealthCommand';
import { CompositeCommand } from '@/CommandHistory/Commands/CompositeCommand';
import {
	type DisableProgressChange,
	nextDisableChecksSucceeded,
	RecordDisableProgressCommand,
} from '@/CommandHistory/Commands/RecordDisableProgressCommand';
import {
	type EncounterStore,
	hasFullDisableChecks,
} from '@/store/encounterRuntimeStore';
import {
	hasDisableChecks,
	resolveParticipantSideTheme,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import { type UUID } from '@/utils/uuid';

/**
 * What a manual K.O. or Disable can also set so the participant's data
 * matches its new state: HP to 0, or the disable checks to full.
 */
export type TakeOutEffect = 'hp' | 'checks';

/** What each effect sets, as the take-out notice's buttons say it. */
export const TAKE_OUT_EFFECT_TEXT: Record<TakeOutEffect, string> = {
	hp: 'set HP to 0',
	checks: 'fill the disable checks',
};

/**
 * The take-out notice's default answer: opponents (hazards included) are
 * slain or destroyed, everyone else is knocked out or disabled.
 */
export const getDefaultTakeOut = (
	participant: Pick<TrackerParticipant, 'role' | 'sideTheme'>
): 'out' | 'remove' =>
	resolveParticipantSideTheme(participant) === 'opponent' ? 'remove' : 'out';

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

	if (meta && hasDisableChecks(meta)) effects.push('checks');

	return effects;
}

/**
 * Whether a take-out effect would change a value (HP above 0, checks not
 * full). Temp HP doesn't count: 0 HP keeps a participant out whatever its
 * temp HP (see getValuesAtTakeOutLevel).
 */
function takeOutEffectChanges(
	uuid: UUID,
	effect: TakeOutEffect,
	{ charactersMap, trackerMetaMap }: TakeOutState
) {
	if (effect === 'hp') {
		return (charactersMap[uuid]?.health ?? 0) > 0;
	}

	const meta = trackerMetaMap[uuid];

	return Boolean(
		meta && meta.disableChecksRequired > 0 && !hasFullDisableChecks(meta)
	);
}

/**
 * The effects a manual K.O. or Disable can offer: those that would change a
 * value, e.g. not 'hp' for a participant already at 0 HP.
 */
export function getApplicableTakeOutEffects(
	uuid: UUID,
	state: TakeOutState
): TakeOutEffect[] {
	return getTakeOutEffects(uuid, state).filter((effect) =>
		takeOutEffectChanges(uuid, effect, state)
	);
}

/** The command that applies a take-out effect, or null if nothing changes. */
export function getTakeOutEffectCommand(
	uuid: UUID,
	effect: TakeOutEffect,
	state: TakeOutState,
	deps?: CommandDeps
): Command | null {
	if (!takeOutEffectChanges(uuid, effect, state)) return null;

	if (effect === 'hp') {
		const character = state.charactersMap[uuid];

		return new ChangeHealthCommand(
			{ uuid, delta: -(character.health + character.tempHealth) },
			deps
		);
	}

	return new RecordDisableProgressCommand(
		{ uuid, value: state.trackerMetaMap[uuid].disableChecksRequired },
		deps
	);
}

/**
 * Whether damage takes a participant that is still in the fight to 0 HP,
 * which knocks it out.
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
 * Whether setting HP takes a participant that is still in the fight to 0 HP,
 * which knocks it out. Temp HP doesn't count: Set changes only HP.
 */
export function settingDropsToZeroHp(
	uuid: UUID,
	health: number,
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

	return character.health > 0 && health <= 0;
}

/**
 * Whether a disable progress change fills the checks of a participant that
 * is still in the fight, which knocks it out (disables a hazard).
 */
export function disableProgressFillsChecks(
	uuid: UUID,
	change: DisableProgressChange,
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

	return nextDisableChecksSucceeded(meta, change) >= meta.disableChecksRequired;
}

/** Runs the commands, skipping missing ones, as one undo step. */
export function inOneUndoStep(
	...commands: (Command | null | undefined)[]
): Command {
	const present = commands.filter((command) => command != null);

	return present.length === 1
		? present[0]
		: new CompositeCommand({ commands: present });
}

/**
 * The values that keep a participant out of the fight: 0 HP, full disable
 * checks. A participant with 0 max HP can't leave 0 HP, so its HP never
 * keeps it out.
 */
export function getValuesAtTakeOutLevel(
	uuid: UUID,
	{ charactersMap, trackerMetaMap }: TakeOutState
): TakeOutEffect[] {
	const character = charactersMap[uuid];
	const meta = trackerMetaMap[uuid];

	return getTakeOutEffects(uuid, { trackerMetaMap }).filter((effect) =>
		effect === 'hp'
			? (character?.maxHealth ?? 0) > 0 && character.health <= 0
			: meta !== undefined && hasFullDisableChecks(meta)
	);
}

/**
 * What bringing a value back from its take-out level sets it to, e.g. "set
 * disable checks to 2/3".
 */
export function getBringBackEffectText(
	effect: TakeOutEffect,
	disableChecksRequired = 0
) {
	return effect === 'hp'
		? 'set HP to 1'
		: `set disable checks to ${disableChecksRequired - 1}/${disableChecksRequired}`;
}

/**
 * The command that brings a value back from its take-out level (HP to 1, the
 * disable checks to one below full), or null if it isn't there.
 */
export function getBringBackEffectCommand(
	uuid: UUID,
	effect: TakeOutEffect,
	state: TakeOutState,
	deps?: CommandDeps
): Command | null {
	if (!getValuesAtTakeOutLevel(uuid, state).includes(effect)) return null;

	if (effect === 'hp') {
		const health = state.charactersMap[uuid]?.health ?? 0;

		return new ChangeHealthCommand({ uuid, delta: 1 - health }, deps);
	}

	return new RecordDisableProgressCommand(
		{ uuid, value: state.trackerMetaMap[uuid].disableChecksRequired - 1 },
		deps
	);
}

/**
 * The other values (besides `changed`) still keeping a knocked-out or
 * disabled participant out of the fight, after `changed` left its take-out
 * level. With none, the participant comes back without asking.
 */
export function getOtherValuesAtTakeOutLevel(
	uuid: UUID,
	changed: TakeOutEffect,
	state: TakeOutState
) {
	return getValuesAtTakeOutLevel(uuid, state).filter(
		(effect) => effect !== changed
	);
}

/**
 * Whether healing takes a knocked-out or disabled participant from 0 HP
 * above it.
 */
export function healingLeavesZeroHp(
	uuid: UUID,
	amount: number,
	state: TakeOutState
) {
	const character = state.charactersMap[uuid];

	return (
		character?.turnState === 'knocked-out' &&
		amount > 0 &&
		getValuesAtTakeOutLevel(uuid, state).includes('hp')
	);
}

/**
 * Whether a disable progress change takes a knocked-out or disabled
 * participant's checks below full.
 */
export function disableProgressLeavesFullChecks(
	uuid: UUID,
	change: DisableProgressChange,
	state: TakeOutState
) {
	const character = state.charactersMap[uuid];
	const meta = state.trackerMetaMap[uuid];

	if (
		character?.turnState !== 'knocked-out' ||
		!meta ||
		!hasFullDisableChecks(meta)
	) {
		return false;
	}

	return nextDisableChecksSucceeded(meta, change) < meta.disableChecksRequired;
}
