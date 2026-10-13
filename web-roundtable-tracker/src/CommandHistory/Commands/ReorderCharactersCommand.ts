import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '../common';
import { EncounterStore } from '@/store/encounterRuntimeStore';

type CommandProps = {
	newOrder: UUID[];
	oldOrder?: UUID[];
	type?: 'initiative' | 'delay';
};

export class ReorderCharactersCommand implements Command {
	readonly type = 'ReorderCharactersCommand';
	description = 'Reorder Characters Command';
	data: CommandProps;
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
		this.description = `Reorder ${getOrderName(this.data)} order`;
	}

	execute() {
		getDeps(this.deps).encounterStore.setState((state) => {
			const currentOrder = getOrder(this.data, state);
			this.data.oldOrder = structuredClone(currentOrder);

			const newOrder = unique(this.data.newOrder);

			return {
				[getOrderName(this.data)]:
					getOrderName(this.data) === 'charactersOrder'
						? reconcileWithCurrentOrder(newOrder, currentOrder)
						: newOrder,
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

		getDeps(this.deps).encounterStore.setState(() => ({
			[getOrderName(this.data)]: structuredClone(orderToRestore),
		}));

		return STATUS.success;
	}
}

const getOrderName = (props: CommandProps) => {
	const type = props.type || 'initiative';

	if (type === 'initiative') {
		return 'charactersOrder';
	} else {
		return 'delayedOrder';
	}
};

const getOrder = (props: CommandProps, state: EncounterStore) => {
	const orderName = getOrderName(props);

	return state[orderName];
};

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
		}
	});

	return reconciled;
};
