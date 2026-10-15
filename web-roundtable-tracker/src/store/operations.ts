import { type UUID } from '@/utils/uuid';

export const nextRound = (state: {
	round: number;
	charactersOrder: UUID[];
	charactersWithTurn: Set<UUID>;
	delayedOrder: UUID[];
}) => {
	const charactersWithTurn = new Set(
		state.delayedOrder.concat(state.charactersOrder)
	);

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
	delayedOrder: UUID[];
}) => {
	const { charactersOrder, charactersWithTurn, delayedOrder } = state;

	if (!charactersOrder.some((uuid) => charactersWithTurn.has(uuid))) {
		return charactersOrder;
	}

	const firstActorIndex = charactersOrder.findIndex(
		(uuid) => charactersWithTurn.has(uuid) || delayedOrder.includes(uuid)
	);

	if (firstActorIndex <= 0) {
		return charactersOrder;
	}

	return charactersOrder
		.slice(firstActorIndex)
		.concat(charactersOrder.slice(0, firstActorIndex));
};
