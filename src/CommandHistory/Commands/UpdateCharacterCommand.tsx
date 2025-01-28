import { UUID } from '@/utils/uuid';
import { Character } from '../../store/data';
import { encounterStore } from '../../store/store';
import { Command, STATUS } from '../CommandHistoryContext';

type CommandProps = {
	uuid: UUID;
	newCharacterProps: Partial<Character>;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

export class UpdateCharacterCommand implements Command {
	data: CommandData;
	description = 'Update Character Command';
	constructor(
		props: CommandProps,
		private deps = { encounterStore }
	) {
		this.data = structuredClone(props);
	}

	execute() {
		this.deps.encounterStore
			.getState()
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

		this.deps.encounterStore
			.getState()
			.updateCharacter(this.data.uuid, this.data.oldCharacter);

		return STATUS.success;
	}
}
