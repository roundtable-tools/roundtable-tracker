import { Character } from '@/store/data';
import { isCharacter } from '../../initiativeHelpers';
import encounterStore$ from '../initiativeStore';
import { Command, STATUS } from '@/CommandHistory/common';

export class ResolveActiveItemCommand implements Command {
	readonly type = 'ResolveActiveItemCommand';
	description = 'Resolve the active item in the queue';
	isUserAction = false;
	partOfTransaction = true;
	data: { oldActive?: Character | null } = {};

	execute() {
		this.data.oldActive = encounterStore$.activeCharacter.peek();
		const list = encounterStore$.initiativeQueue.peek();

		if (list.length === 0) return STATUS.failure;
		const activeItem = list[0];

		if (isCharacter(activeItem)) {
			encounterStore$.activeCharacter.set(activeItem.element);
		} else {
			encounterStore$.activeCharacter.set(null);
		}

		return STATUS.success;
	}
	undo() {
		encounterStore$.activeCharacter.set(this.data.oldActive ?? null);

		return STATUS.success;
	}
}
