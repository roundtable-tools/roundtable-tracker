import { UUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
	newCharacterProps: Partial<Character>;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

export class UpdateCharacterCommand implements Command {
	readonly type = 'UpdateCharacterCommand';
	data: CommandData;
	description = 'Update Character Command';
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		getDeps(this.deps)
			.encounterStore.getState()
			.updateCharacter(this.data.uuid, (oldCharacter) => {
				this.data.oldCharacter = structuredClone(oldCharacter);
				return {
					...oldCharacter,
					...this.data.newCharacterProps,
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
