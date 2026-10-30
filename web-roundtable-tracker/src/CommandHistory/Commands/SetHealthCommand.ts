import { UUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
	/** New HP, clamped to 0..maxHealth. Temp HP is left as it is. */
	health: number;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

export class SetHealthCommand implements Command {
	readonly type = 'SetHealthCommand';
	data: CommandData;
	description = 'Set Health';

	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		getDeps(this.deps)
			.encounterStore.getState()
			.updateCharacter(this.data.uuid, (old) => {
				this.data.oldCharacter = structuredClone(old);

				return {
					...old,
					health: Math.min(Math.max(this.data.health, 0), old.maxHealth),
				};
			});

		return STATUS.success;
	}

	undo() {
		if (!this.data.oldCharacter) return STATUS.failure;

		getDeps(this.deps)
			.encounterStore.getState()
			.updateCharacter(this.data.uuid, this.data.oldCharacter);

		return STATUS.success;
	}
}
