import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
};

type CommandData = CommandProps & {
	originalOrder?: UUID[];
	originalCharactersWithTurn?: Set<UUID>;
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

		this.data.originalOrder = [...state.charactersOrder];
		this.data.originalCharactersWithTurn = new Set(state.charactersWithTurn);

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
		if (!this.data.originalOrder || !this.data.originalCharactersWithTurn) {
			console.error(`Original state is not defined`);
			return STATUS.failure;
		}

		const { encounterStore } = getDeps(this.deps);

		encounterStore.setState((state) => {
			state.charactersWithTurn = new Set(this.data.originalCharactersWithTurn!);
			state.charactersOrder = [...this.data.originalOrder!];

			return {
				charactersWithTurn: new Set(state.charactersWithTurn),
				charactersOrder: [...state.charactersOrder],
			};
		});

		return STATUS.success;
	}
}
