import { InitiativeElement } from '../../initiativeTypes';
import { isCharacter } from '../../initiativeHelpers';
import encounterStore$ from '../initiativeStore';
import { Command, STATUS } from '@/CommandHistory/common';

export class ReturnFromDelayCommand implements Command {
	readonly type = 'ReturnFromDelayCommand';
	description = 'Return a character from delay';
	data: { uuid: string; removed?: InitiativeElement; oldIndex?: number };

	constructor(uuid: string) {
		this.data = { uuid };
	}

	execute() {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === this.data.uuid);

		if (characterIndex === -1) return STATUS.failure;
		this.data.oldIndex = characterIndex;
		const character = encounterStore$.initiativeQueue.splice(
			characterIndex,
			1
		)[0];
		this.data.removed = structuredClone(character);

		if (!isCharacter(character)) return STATUS.failure;

		if (!character.element.hasTurn) return STATUS.failure;
		character.element.turnState = 'normal';
		encounterStore$.initiativeQueue.unshift(character);

		return STATUS.success;
	}
	undo() {
		const front = encounterStore$.initiativeQueue.peek()[0];

		if (front && front.element.uuid === this.data.uuid) {
			encounterStore$.initiativeQueue.shift();
		}

		if (this.data.removed && this.data.oldIndex !== undefined) {
			encounterStore$.initiativeQueue.splice(
				this.data.oldIndex,
				0,
				this.data.removed
			);
		}

		return STATUS.success;
	}
}
