import { Character } from '../../store/data';
import { useEncounterStore } from '../../store/store';
import { Command, STATUS } from '../CommandHistoryContext';

export class ReorderCharactersCommand implements Command {
	constructor(public data: { newOrder: string[]; oldOrder?: string[] }) {
		this.description = 'Reorder Characters Command';
	}

	description?: string | undefined;
	execute() {
		useEncounterStore.setState((state) => {
			this.data.oldOrder = state.characters.map((c) => c.name);

			return {
				characters: reorderCharacters(state.characters, this.data.newOrder),
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

		useEncounterStore.setState((state) => ({
			characters: reorderCharacters(state.characters, orderToRestore),
		}));

		return STATUS.success;
	}
}

function reorderCharacters(characters: Character[], order: string[]) {
	return order.map((name) => characters.find((c) => c.name === name)!);
}
