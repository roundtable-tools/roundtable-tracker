import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, STATUS, getDeps } from '../common';
import { CompositeCommand } from './CompositeCommand';
import { DelayCharacterCommand } from './DelayCharacterCommand';
import { EndRoundCommand } from './EndRoundCommand';
import { EndTurnCommand } from './EndTurnCommand';
import { KnockOutCharacterCommand } from './KnockOutCharacterCommand';

export type FinalizeTurnAction = 'end-turn' | 'delay' | 'ko';

type CommandData = {
	uuid: UUID;
	action: FinalizeTurnAction;
	command?: Command;
};

const getRemainingTurnCount = (
	charactersOrder: UUID[],
	charactersWithTurn: Set<UUID>
) => charactersOrder.filter((uuid) => charactersWithTurn.has(uuid)).length;

const getActionCommand = (
	action: FinalizeTurnAction,
	uuid: UUID,
	deps?: CommandDeps
) => {
	if (action === 'delay') {
		return new DelayCharacterCommand({ uuid }, deps);
	}

	if (action === 'ko') {
		return new KnockOutCharacterCommand({ uuid }, deps);
	}

	return new EndTurnCommand({ uuid }, deps);
};

export class FinalizeTurnAndAdvanceRoundCommand implements Command {
	readonly type = 'FinalizeTurnAndAdvanceRoundCommand';
	description = 'Finalize Turn And Advance Round Command';
	data: CommandData;

	constructor(
		data: Pick<CommandData, 'uuid' | 'action'>,
		private deps?: CommandDeps
	) {
		this.data = {
			uuid: data.uuid,
			action: data.action,
		};
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const remainingTurnCount = getRemainingTurnCount(
			state.charactersOrder,
			state.charactersWithTurn
		);

		if (
			remainingTurnCount !== 1 ||
			!state.charactersWithTurn.has(this.data.uuid)
		) {
			console.error(
				`Character with uuid ${this.data.uuid} is not the final active participant in the round`
			);

			return STATUS.failure;
		}

		if (!this.data.command) {
			this.data.command = new CompositeCommand({
				commands: [
					getActionCommand(this.data.action, this.data.uuid, this.deps),
					new EndRoundCommand({}, this.deps),
				],
			});
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
