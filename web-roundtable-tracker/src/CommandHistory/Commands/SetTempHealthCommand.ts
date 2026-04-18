import { UUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
	/** New temp HP amount. */
	tempHealth: number;
	/** Description of the source / duration for this temp HP. */
	description?: string;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

export class SetTempHealthCommand implements Command {
	readonly type = 'SetTempHealthCommand';
	data: CommandData;
	description = 'Set Temporary HP';

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
					tempHealth: this.data.tempHealth,
					tempHealthDescription: this.data.tempHealth > 0 ? this.data.description : undefined,
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
