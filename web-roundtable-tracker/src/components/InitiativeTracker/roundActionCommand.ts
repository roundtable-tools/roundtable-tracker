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
	const { charactersOrder, delayedOrder } = state;
	const shouldAdvanceRound = closesRound(participantId, state);
	const returningParticipantId = charactersOrder[1];
	const shouldReturnToInitiative =
		charactersOrder.length > 1 && delayedOrder.includes(returningParticipantId);

	if (shouldAdvanceRound && shouldReturnToInitiative) {
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

	if (shouldReturnToInitiative) {
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
