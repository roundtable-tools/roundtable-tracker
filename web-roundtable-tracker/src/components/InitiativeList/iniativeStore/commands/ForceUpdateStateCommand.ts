import { Character } from '@/store/data';
import { isCharacter } from '../../initiativeHelpers';
import encounterStore$ from '../initiativeStore';
import { Command, STATUS } from '@/CommandHistory/common';

export class ForceUpdateStateCommand implements Command {
	readonly type = 'ForceUpdateStateCommand';
	description = 'Force update character state';
	data: {
		uuid: string;
		newState: Character['turnState'];
		oldState?: Character['turnState'];
	};

	constructor(uuid: string, newState: Character['turnState']) {
		this.data = { uuid, newState };
	}

	execute() {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === this.data.uuid);

		if (characterIndex === -1) return STATUS.failure;
		const character = encounterStore$.initiativeQueue.peek()[characterIndex];

		if (!isCharacter(character)) return STATUS.failure;
		this.data.oldState = character.element.turnState;
		encounterStore$.initiativeQueue[characterIndex].element.assign({
			turnState: this.data.newState,
		});

		return STATUS.success;
	}

	undo() {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === this.data.uuid);

		if (characterIndex === -1 || this.data.oldState === undefined)
			return STATUS.failure;
		encounterStore$.initiativeQueue[characterIndex].element.assign({
			turnState: this.data.oldState,
		});

		return STATUS.success;
	}
}
