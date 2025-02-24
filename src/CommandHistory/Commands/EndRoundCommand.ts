import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandData = {
	originalRound?: number;
	originalCharactersWithTurn?: Set<string>;
};

export class EndRoundCommand implements Command {
	readonly type = 'EndRoundCommand';
	description = 'End Round Command';

	constructor(
		public data: CommandData = {},
		private deps?: CommandDeps
	) {}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		this.data.originalRound = state.round;
		this.data.originalCharactersWithTurn = new Set(state.charactersWithTurn);

		encounterStore.setState((state) => {
			return {
				round: state.round + 1,
				charactersWithTurn: new Set(state.charactersOrder),
			};
		});

		return STATUS.success;
	}

	undo() {
		if (
			this.data.originalRound === undefined ||
			this.data.originalCharactersWithTurn === undefined
		) {
			console.error(`Original state is not defined`);
			return STATUS.failure;
		}

		const { encounterStore } = getDeps(this.deps);

		encounterStore.setState(() => {
			return {
				round: this.data.originalRound,
				charactersWithTurn: new Set(this.data.originalCharactersWithTurn),
			};
		});

		return STATUS.success;
	}
}
