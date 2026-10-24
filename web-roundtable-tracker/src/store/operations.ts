import { type UUID } from '@/utils/uuid';
import { type Character } from './data';

type TurnStates = Record<UUID, Pick<Character, 'turnState'>>;

/** Whether the participant is delaying. A delayer keeps its spot in the order. */
export const isDelaying = (charactersMap: TurnStates, uuid: UUID) =>
	charactersMap[uuid]?.turnState === 'delayed';

/**
 * The delaying participants, in the order they started delaying: only the
 * current participant can delay, and it moves to the end of the queue.
 */
export const delayingIds = ({
	charactersOrder,
	charactersMap,
}: {
	charactersOrder: UUID[];
	charactersMap: TurnStates;
}) => charactersOrder.filter((uuid) => isDelaying(charactersMap, uuid));

/**
 * The rotating queue holds the participants still to act first and the ones
 * that already acted after them, so a round runs from the first one that
 * acted to the last one still to act. Delaying participants are left out.
 */
export function roundOrderOf(
	currentOrder: UUID[],
	charactersWithTurn: Set<UUID>,
	charactersMap: TurnStates,
	isStillToAct: (uuid: UUID) => boolean = (uuid) => charactersWithTurn.has(uuid)
): UUID[] {
	const inRound = currentOrder.filter(
		(uuid) => !isDelaying(charactersMap, uuid)
	);

	return [
		...inRound.filter((uuid) => !isStillToAct(uuid)),
		...inRound.filter(isStillToAct),
	];
}

export const nextRound = (state: {
	round: number;
	charactersOrder: UUID[];
	charactersWithTurn: Set<UUID>;
}) => {
	const charactersWithTurn = new Set(state.charactersOrder);

	return {
		round: state.round + 1,
		charactersWithTurn,
	};
};

/**
 * The initiative queue rotates: index 0 is the current actor. A participant
 * that has already acted this round (for example one moved up by a manual
 * reorder) must not act again, so it is skipped: the queue is rotated until a
 * participant with a turn, or a delaying participant (who is asked whether to
 * return), is at the front. Rotating keeps the cyclic order, so the skipped
 * participants keep their place for the next round. If nobody has a turn left
 * (the round's last turn just ended), the order is returned unchanged, so a
 * delaying participant isn't moved to the top of the next round.
 */
export const skipParticipantsWithoutTurn = (state: {
	charactersOrder: UUID[];
	charactersWithTurn: Set<UUID>;
	charactersMap: TurnStates;
}) => {
	const { charactersOrder, charactersWithTurn, charactersMap } = state;

	if (!charactersOrder.some((uuid) => charactersWithTurn.has(uuid))) {
		return charactersOrder;
	}

	const firstActorIndex = charactersOrder.findIndex(
		(uuid) => charactersWithTurn.has(uuid) || isDelaying(charactersMap, uuid)
	);

	if (firstActorIndex <= 0) {
		return charactersOrder;
	}

	return charactersOrder
		.slice(firstActorIndex)
		.concat(charactersOrder.slice(0, firstActorIndex));
};
