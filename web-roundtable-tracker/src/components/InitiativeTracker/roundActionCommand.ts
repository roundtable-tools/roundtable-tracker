import { type Command, type CommandDeps } from '@/CommandHistory/common';
import { DelayCharacterCommand } from '@/CommandHistory/Commands/DelayCharacterCommand';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from '@/CommandHistory/Commands/FinalizeTurnAndAdvanceRoundCommand';
import { FinalizeTurnAndReturnToInitiativeCommand } from '@/CommandHistory/Commands/FinalizeTurnAndReturnToInitiativeCommand';
import { KnockOutCharacterCommand } from '@/CommandHistory/Commands/KnockOutCharacterCommand';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { type EncounterStore } from '@/store/encounterRuntimeStore';
import { runtimeToInitiativeQueue } from '@/store/trackerMappers';
import { isFinalActiveParticipant } from './isFinalActiveParticipant';
import { countParticipantsWithTurn } from './roundBoundary';

export type RoundAction = 'end-turn' | 'delay' | 'ko';

export type RoundActionState = Pick<
	EncounterStore,
	| 'charactersOrder'
	| 'delayedOrder'
	| 'charactersMap'
	| 'trackerMetaMap'
	| 'charactersWithTurn'
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
	delayedOrder,
}: Pick<RoundActionState, 'charactersOrder' | 'delayedOrder'>) {
	const nextId = charactersOrder[1];

	return charactersOrder.length > 1 && delayedOrder.includes(nextId)
		? nextId
		: undefined;
}

/**
 * Whether ending the current turn first asks if a delaying participant
 * returns. Two kinds of delayers don't ask on their own: the one returning
 * after this turn anyway, and one that started the encounter silently delayed
 * and hasn't joined the order yet. The prompt still lists them when another
 * delayer asks.
 */
export function asksToReturnFromDelay(
	state: Pick<
		RoundActionState,
		'charactersOrder' | 'delayedOrder' | 'charactersMap'
	>
) {
	const returningId = delayerReturningAfterTurn(state);

	return state.delayedOrder.some(
		(uuid) =>
			uuid !== returningId &&
			!(
				state.charactersMap[uuid]?.silentDelay &&
				!state.charactersOrder.includes(uuid)
			)
	);
}

export type ReturnPromptEntry = {
	id: string;
	/** Turns before the old spot comes up; 0 when it is right after this one. */
	distance?: number;
	/** Has no spot yet (started or arrived delayed): it joins the order. */
	joins: boolean;
};

/**
 * The delayers the return prompt lists: nearest old spot first, then the ones
 * that join the order for the first time. Only participants that take a turn
 * count towards the distance, not other delayers' spots.
 */
export function returnPromptEntries({
	charactersOrder,
	delayedOrder,
}: Pick<
	RoundActionState,
	'charactersOrder' | 'delayedOrder'
>): ReturnPromptEntry[] {
	const delayed = new Set(delayedOrder);
	const withSpot = charactersOrder
		.filter((id) => delayed.has(id))
		.map((id) => ({
			id,
			distance: charactersOrder
				.slice(1, charactersOrder.indexOf(id))
				.filter((other) => !delayed.has(other)).length,
			joins: false,
		}));
	const joining = delayedOrder
		.filter((id) => !charactersOrder.includes(id))
		.map((id) => ({ id, joins: true }));

	return [...withSpot, ...joining];
}

/**
 * The command the tracker runs when the GM ends a participant's turn, delays
 * or knocks them out. It also closes the round after the last active
 * participant, and brings back a delaying participant who is next in the
 * order.
 */
export function getRoundActionCommand(
	participantId: string,
	action: RoundAction,
	state: RoundActionState,
	deps?: CommandDeps
): Command {
	const shouldAdvanceRound = closesRound(participantId, state);
	const returningParticipantId = delayerReturningAfterTurn(state);

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
