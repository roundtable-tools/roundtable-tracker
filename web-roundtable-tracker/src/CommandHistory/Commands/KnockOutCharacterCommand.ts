import { Command, CommandDeps, STATUS, getDeps } from '../common';
import { UUID } from '@/utils/uuid';
import { getChangeCharacterState } from './composites/ChangeCharacterState';

type CommandData = {
	uuid: UUID;
	command?: Command;
};

export class KnockOutCharacterCommand implements Command {
	readonly type = 'KnockOutCharacterCommand';
	description = 'Knock Out Character Command';
	data: CommandData;

	constructor(data: Pick<CommandData, 'uuid'>, private deps?: CommandDeps) {
		this.data = {
			uuid: data.uuid,
		};
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const character = state.charactersMap[this.data.uuid];

		if (!character) {
			console.error(`Character with uuid ${this.data.uuid} not found`);

			return STATUS.failure;
		}

		if (!this.data.command) {
			this.data.command = getChangeCharacterState(character, 'knocked-out', {
				charactersWithTurn: state.charactersWithTurn,
				charactersOrder: state.charactersOrder,
				delayedOrder: state.delayedOrder,
			}, this.deps);
		}

		return this.data.command.execute();
	}

	undo() {
		if (!this.data.command) {
			return STATUS.failure;
		}

		return this.data.command.undo();
	}
}
