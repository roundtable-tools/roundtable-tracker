import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = { newOrder: UUID[]; oldOrder?: UUID[] };

export class ReorderCharactersCommand implements Command {
	readonly type = 'ReorderCharactersCommand';
	description = 'Reorder Characters Command';
	data: CommandProps;
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		getDeps(this.deps).encounterStore.setState((state) => {
			this.data.oldOrder = structuredClone(state.charactersOrder);

			return {
				charactersOrder: structuredClone(this.data.newOrder),
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
			charactersOrder: structuredClone(orderToRestore),
		}));

		return STATUS.success;
	}
}
