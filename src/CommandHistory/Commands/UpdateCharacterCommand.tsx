import { Character } from '../../store/data';
import { useEncounterStore } from '../../store/store';
import { Command, STATUS } from '../CommandHistoryContext';

type CommandProps = {
	index: number;
	newCharacterProps: Partial<Character>;
};

type CommandData = CommandProps & {
	oldCharacter?: Character;
};

export class UpdateCharacterCommand implements Command {
	data: CommandData;
	description = 'Update Character Command';
	constructor(props: CommandProps) {
		this.data = structuredClone(props);
	}

	execute() {
		useEncounterStore
			.getState()
			.updateCharacter(this.data.index, (oldCharacter) => {
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

		useEncounterStore
			.getState()
			.updateCharacter(this.data.index, this.data.oldCharacter);

		return STATUS.success;
	}
}
