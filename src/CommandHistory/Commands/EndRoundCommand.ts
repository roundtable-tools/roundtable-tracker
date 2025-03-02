import { nextRound } from '@/store/operations';
import {
	Command,
	CommandDeps,
	getDeps,
	STATUS,
	undoOriginalState,
} from '../common';

type CommandData = {
	original?: ReturnType<typeof nextRound>;
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

		encounterStore.setState((state) => {
			this.data.original = {
				round: state.round,
				charactersWithTurn: new Set(state.charactersWithTurn),
			};

			return nextRound(state);
		});

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
