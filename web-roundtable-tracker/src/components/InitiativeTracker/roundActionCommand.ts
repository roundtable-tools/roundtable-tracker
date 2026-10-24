import { type Command, type CommandDeps } from '@/CommandHistory/common';
import { CompositeCommand } from '@/CommandHistory/Commands/CompositeCommand';
import { DelayCharacterCommand } from '@/CommandHistory/Commands/DelayCharacterCommand';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from '@/CommandHistory/Commands/FinalizeTurnAndAdvanceRoundCommand';
import { FinalizeTurnAndReturnToInitiativeCommand } from '@/CommandHistory/Commands/FinalizeTurnAndReturnToInitiativeCommand';
import { KnockOutCharacterCommand } from '@/CommandHistory/Commands/KnockOutCharacterCommand';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { type EncounterStore } from '@/store/encounterRuntimeStore';
import { delayingIds, isDelaying } from '@/store/operations';
import { runtimeToInitiativeQueue } from '@/store/trackerMappers';
import { isFinalActiveParticipant } from './isFinalActiveParticipant';
import { countParticipantsWithTurn } from './roundBoundary';

export type RoundAction = 'end-turn' | 'delay' | 'ko';

export type RoundActionState = Pick<
	EncounterStore,
	'charactersOrder' | 'charactersMap' | 'trackerMetaMap' | 'charactersWithTurn'
>;

/** Whether acting on this participant closes the round. */
export function closesRound(participantId: string, state: RoundActionState) {
	return isFinalActiveParticipant(participantId, {
		activeParticipantCount: countParticipantsWithTurn(
			runtimeToInitiativeQueue(state),
			state.charactersWithTurn
		),
		charactersWithTurn: state.charactersWithTurn,
		charactersMap: state.charactersMap,
	});
}

/**
 * The delaying participant who comes back after the current turn without
 * being asked: the one whose spot in the order is next. Its entry stays in the
 * order while it delays, so reaching that entry again means it delayed for a
 * whole round, and the rules return it to its old spot.
 */
export function delayerReturningAfterTurn({
	charactersOrder,
	charactersMap,
}: Pick<RoundActionState, 'charactersOrder' | 'charactersMap'>) {
	const nextId = charactersOrder[1];

	return charactersOrder.length > 1 && isDelaying(charactersMap, nextId)
		? nextId
		: undefined;
}

/**
 * Whether ending the current turn first asks if a delaying participant
 * returns. The one returning after this turn anyway doesn't ask on its own;
 * the prompt still lists it when another delayer asks.
 */
export function asksToReturnFromDelay(
	state: Pick<RoundActionState, 'charactersOrder' | 'charactersMap'>
) {
	const returningId = delayerReturningAfterTurn(state);

	return delayingIds(state).some((id) => id !== returningId);
}

export type ReturnPromptEntry = {
	id: string;
	/** Turns before the old spot comes up; 0 when it is right after this one. */
	distance: number;
};

/**
 * The delayers the return prompt lists, nearest old spot first. Only
 * participants that take a turn count towards the distance, not other
 * delayers' spots.
 */
export function returnPromptEntries({
	charactersOrder,
	charactersMap,
}: Pick<
	RoundActionState,
	'charactersOrder' | 'charactersMap'
>): ReturnPromptEntry[] {
	const entries: ReturnPromptEntry[] = [];
	let turnsBefore = 0;

	charactersOrder.forEach((id, index) => {
		if (isDelaying(charactersMap, id)) {
			entries.push({ id, distance: turnsBefore });
		} else if (index > 0) {
			turnsBefore++;
		}
	});

	return entries;
}

/**
 * Whether Slay / Destroy has to end the participant's turn before removing
 * it: it is the current actor, or the last one left to act this round.
 * Otherwise the round would stop with nobody left to act.
 */
export function removalEndsTurn(
	participantId: string,
	state: RoundActionState
) {
	return (
		state.charactersWithTurn.has(participantId) &&
		state.charactersMap[participantId]?.turnState !== 'delayed' &&
		(participantId === state.charactersOrder[0] ||
			closesRound(participantId, state))
	);
}

/**
 * The command the tracker runs when the GM ends a participant's turn, delays
 * or knocks them out (Disable for a hazard). It also closes the round after the last active
 * participant. Acting on the current participant also brings back a delaying
 * participant who is next in the order; acting on anyone else (e.g. a K.O.
 * during another participant's turn) leaves the current turn running.
 */
export function getRoundActionCommand(
	participantId: string,
	action: RoundAction,
	state: RoundActionState,
	deps?: CommandDeps
): Command {
	const shouldAdvanceRound = closesRound(participantId, state);
	const returningParticipantId =
		participantId === state.charactersOrder[0]
			? delayerReturningAfterTurn(state)
			: undefined;

	if (shouldAdvanceRound && returningParticipantId) {
		return new FinalizeTurnAndReturnToInitiativeCommand(
			{
				activeUuid: participantId,
				returningUuid: returningParticipantId,
				action,
			},
			deps
		);
	}

	if (shouldAdvanceRound) {
		return new FinalizeTurnAndAdvanceRoundCommand(
			{ uuid: participantId, action },
			deps
		);
	}

	if (returningParticipantId) {
		return new ReturnToInitiativeCommand(
			{
				activeUuid: participantId,
				returningUuid: returningParticipantId,
				action,
			},
			deps
		);
	}

	if (action === 'delay') {
		return new DelayCharacterCommand({ uuid: participantId }, deps);
	}

	if (action === 'ko') {
		return new KnockOutCharacterCommand({ uuid: participantId }, deps);
	}

	return new EndTurnCommand({ uuid: participantId }, deps);
}

/**
 * The command for Slay / Destroy: the participant leaves the initiative. When
 * removing it would stop the round with nobody left to act (see
 * removalEndsTurn), its turn ends first, which also closes the round after
 * the last actor.
 */
export function getRemoveCommand(
	participantId: string,
	state: RoundActionState,
	deps?: CommandDeps
): Command {
	const remove = new RemoveCharacterCommand({ uuid: participantId }, deps);

	return removalEndsTurn(participantId, state)
		? new CompositeCommand({
				commands: [
					getRoundActionCommand(participantId, 'end-turn', state, deps),
					remove,
				],
			})
		: remove;
}
