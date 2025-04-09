import { UUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import {
	Command,
	CommandDeps,
	getDeps,
	STATUS,
	undoOriginalState,
} from '../common';

type CommandProps = {
	uuid: UUID;
};

type CommandData = CommandProps & {
	original?: {
		charactersMap: Record<UUID, Character>;
		charactersOrder: UUID[];
		delayedOrder: UUID[];
		charactersWithTurn: Set<UUID>;
	};
};

export class RemoveCharacterCommand implements Command {
	readonly type = 'RemoveCharacterCommand';
	data: CommandData;
	description = 'Remove Character Command';
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		if (!(this.data.uuid in state.charactersMap)) {
			console.error(`Character with uuid ${this.data.uuid} not found`);

			return STATUS.failure;
		}

		this.data.original = {
			charactersMap: structuredClone(state.charactersMap),
			charactersOrder: structuredClone(state.charactersOrder),
			delayedOrder: structuredClone(state.delayedOrder),
			charactersWithTurn: structuredClone(state.charactersWithTurn),
		};

		encounterStore.setState((state) => {
			const charactersMap = { ...state.charactersMap };
			delete charactersMap[this.data.uuid];

			const charactersOrder = state.charactersOrder.filter(
				(uuid) => uuid !== this.data.uuid
			);

			const delayedOrder = state.delayedOrder.filter(
				(uuid) => uuid !== this.data.uuid
			);

			const charactersWithTurn = new Set(state.charactersWithTurn);
			charactersWithTurn.delete(this.data.uuid);

			return {
				charactersMap,
				charactersOrder,
				charactersWithTurn,
				delayedOrder,
			};
		});

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
