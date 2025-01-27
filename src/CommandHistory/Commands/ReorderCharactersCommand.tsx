import { UUID } from '@/utils/uuid';
import { useEncounterStore } from '@/store/store';
import { Command, STATUS } from '../CommandHistoryContext';

export class ReorderCharactersCommand implements Command {
	constructor(public data: { newOrder: UUID[]; oldOrder?: string[] }) {
		this.description = 'Reorder Characters Command';
	}

	description?: string | undefined;
	execute() {
		useEncounterStore.setState((state) => {
			this.data.oldOrder = state.charactersOrder;

			return {
				charactersOrder: this.data.newOrder,
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

		useEncounterStore.setState(() => ({
			charactersOrder: orderToRestore,
		}));

		return STATUS.success;
	}
}
