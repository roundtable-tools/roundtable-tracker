import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '../common';
import { EncounterStore } from '@/store/encounterRuntimeStore';
import { skipParticipantsWithoutTurn } from '@/store/operations';

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
			this.data.oldOrder = structuredClone(getOrder(this.data, state));

			const orderName = getOrderName(this.data);

			if (orderName === 'charactersOrder') {
				return {
					charactersOrder: skipParticipantsWithoutTurn({
						charactersOrder: structuredClone(this.data.newOrder),
						charactersWithTurn: state.charactersWithTurn,
						delayedOrder: state.delayedOrder,
					}),
				};
			}

			return {
				[orderName]: structuredClone(this.data.newOrder),
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
