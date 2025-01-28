import { UUID } from '@/utils/uuid';
import { encounterStore } from '@/store/store';
import { Command, STATUS } from '../CommandHistoryContext';

export class ReorderCharactersCommand implements Command {
	description = 'Reorder Characters Command';

	constructor(
		public data: { newOrder: UUID[]; oldOrder?: UUID[] },
		private deps = { encounterStore }
	) {}

	execute() {
		this.deps.encounterStore.setState((state) => {
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

		this.deps.encounterStore.setState(() => ({
			charactersOrder: structuredClone(orderToRestore),
		}));

		return STATUS.success;
	}
}
