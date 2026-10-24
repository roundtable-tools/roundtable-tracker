import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '../common';
import { skipParticipantsWithoutTurn } from '@/store/operations';
import { roundOrderOf } from '@/store/initiativePlacement';
import {
	movedInReorder,
	PendingReinforcement,
	respotAfterReorder,
} from '@/store/pendingReinforcements';

type CommandProps = {
	newOrder: UUID[];
	oldOrder?: UUID[];
	/**
	 * The participants the user dragged. Without it, the ones outside the
	 * longest run that kept its order count as moved.
	 */
	movedIds?: UUID[];
	/** The spots of pending reinforcements before the reorder, by uuid. */
	oldPendingSpots?: Record<UUID, Pick<PendingReinforcement, 'above' | 'below'>>;
};

export class ReorderCharactersCommand implements Command {
	readonly type = 'ReorderCharactersCommand';
	description = 'Reorder initiative';
	data: CommandProps;
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		getDeps(this.deps).encounterStore.setState((state) => {
			const currentOrder = state.charactersOrder;
			this.data.oldOrder = structuredClone(currentOrder);

			const charactersOrder = skipParticipantsWithoutTurn({
				charactersOrder: reconcileWithCurrentOrder(
					unique(this.data.newOrder),
					currentOrder
				),
				charactersWithTurn: state.charactersWithTurn,
				charactersMap: state.charactersMap,
			});
			const pendingReinforcements = state.pendingReinforcements ?? [];
			this.data.oldPendingSpots = Object.fromEntries(
				pendingReinforcements.map(({ character, above, below }) => [
					character.uuid,
					{ above, below },
				])
			);
			const roundOrder = (order: UUID[]) =>
				roundOrderOf(order, state.charactersWithTurn, state.charactersMap);
			const oldRoundOrder = roundOrder(currentOrder);
			const newRoundOrder = roundOrder(charactersOrder);

			return {
				charactersOrder,
				pendingReinforcements: respotAfterReorder(
					pendingReinforcements,
					oldRoundOrder,
					newRoundOrder,
					this.data.movedIds
						? new Set(this.data.movedIds)
						: movedInReorder(oldRoundOrder, newRoundOrder),
					state.charactersMap
				),
			};
		});

		return STATUS.success;
	}
	undo() {
		const orderToRestore = this.data.oldOrder;

		if (!orderToRestore) {
			console.error(`Old Order is not defined`);

			return STATUS.failure;
		}

		const spotsToRestore = this.data.oldPendingSpots;

		getDeps(this.deps).encounterStore.setState((state) => ({
			charactersOrder: structuredClone(orderToRestore),
			...(spotsToRestore && {
				pendingReinforcements: (state.pendingReinforcements ?? []).map(
					(reinforcement) => ({
						...reinforcement,
						...spotsToRestore[reinforcement.character.uuid],
					})
				),
			}),
		}));

		return STATUS.success;
	}
}

const unique = (order: UUID[]) => Array.from(new Set(order));

/**
 * A reorder of the initiative queue is a permutation of it. The new order can
 * be stale (built from a drag that started before another command, such as a
 * Delay, changed the queue) or contain a participant twice. Applying it as is
 * would duplicate, drop or resurrect participants (#28), so keep only the
 * participants that are in the queue now, once each, and put the ones the new
 * order misses back at their current index.
 */
const reconcileWithCurrentOrder = (newOrder: UUID[], currentOrder: UUID[]) => {
	const current = new Set(currentOrder);
	const reconciled = newOrder.filter((uuid) => current.has(uuid));
	const included = new Set(reconciled);

	currentOrder.forEach((uuid, index) => {
		if (!included.has(uuid)) {
			reconciled.splice(index, 0, uuid);
			included.add(uuid);
		}
	});

	return reconciled;
};
