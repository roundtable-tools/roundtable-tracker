import { UUID } from '@/utils/uuid';
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
		charactersOrder: UUID[];
		charactersWithTurn: Set<UUID>;
	};
};

export class EndTurnCommand implements Command {
	readonly type = 'EndTurnCommand';
	data: CommandData;
	description = 'End Turn Command';
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		if (!state.charactersWithTurn.has(this.data.uuid)) {
			console.error(
				`Character with uuid ${this.data.uuid} does not have a turn`
			);
			return STATUS.failure;
		}

		this.data.original = {
			charactersOrder: structuredClone(state.charactersOrder),
			charactersWithTurn: structuredClone(state.charactersWithTurn),
		};

		encounterStore.setState((state) => {
			state.charactersWithTurn.delete(this.data.uuid);
			const charactersOrder = state.charactersOrder
				.filter((id) => id !== this.data.uuid)
				.concat(this.data.uuid);

			return {
				charactersWithTurn: new Set(state.charactersWithTurn),
				charactersOrder,
			};
		});

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
