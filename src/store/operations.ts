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
