import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, STATUS, getDeps } from '../common';
import { CompositeCommand } from './CompositeCommand';
import { EndRoundCommand } from './EndRoundCommand';
import { FinalizeTurnAction } from './FinalizeTurnAndAdvanceRoundCommand';
import { ReturnToInitiativeCommand } from './ReturnToInitiativeCommand';

type CommandData = {
	activeUuid: UUID;
	returningUuid: UUID;
	action: FinalizeTurnAction;
	command?: Command;
};

const getRemainingTurnCount = (
	charactersOrder: UUID[],
	charactersWithTurn: Set<UUID>
) => charactersOrder.filter((uuid) => charactersWithTurn.has(uuid)).length;

export class FinalizeTurnAndReturnToInitiativeCommand implements Command {
	readonly type = 'FinalizeTurnAndReturnToInitiativeCommand';
	description = 'Finalize Turn And Return To Initiative Command';
	data: CommandData;

	constructor(
		data: Pick<CommandData, 'activeUuid' | 'returningUuid' | 'action'>,
		private deps?: CommandDeps
	) {
		this.data = {
			activeUuid: data.activeUuid,
			returningUuid: data.returningUuid,
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
			!state.charactersWithTurn.has(this.data.activeUuid)
		) {
			console.error(
				`Character with uuid ${this.data.activeUuid} is not the final active participant in the round`
			);

			return STATUS.failure;
		}

		if (!state.delayedOrder.includes(this.data.returningUuid)) {
			console.error(
				`Returning character with uuid ${this.data.returningUuid} is not delayed`
			);

			return STATUS.failure;
		}

		if (!this.data.command) {
			this.data.command = new CompositeCommand({
				commands: [
					new ReturnToInitiativeCommand(
						{
							activeUuid: this.data.activeUuid,
							returningUuid: this.data.returningUuid,
							action: this.data.action,
						},
						this.deps
					),
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
