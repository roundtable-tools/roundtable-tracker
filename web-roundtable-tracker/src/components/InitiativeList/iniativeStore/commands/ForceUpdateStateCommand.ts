import { Character } from '@/store/data';
import { isCharacter } from '../../initiativeHelpers';
import encounterStore$ from '../initiativeStore';
import { Command, STATUS } from '@/CommandHistory/common';

export class ForceUpdateStateCommand implements Command {
	readonly type = 'ForceUpdateStateCommand';
	description = 'Force update character fields';
	data: {
		uuid: string;
		update: Partial<Character>;
		oldValues?: Partial<Character>;
	};

	constructor(uuid: string, update: Partial<Character>) {
		this.data = { uuid, update };
	}

	execute() {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === this.data.uuid);

		if (characterIndex === -1) return STATUS.failure;
		const character = encounterStore$.initiativeQueue.peek()[characterIndex];

		if (!isCharacter(character)) return STATUS.failure;

		// Store old values for undo
		const old: Record<string, unknown> = {};
		const keys = Object.keys(this.data.update) as (keyof Character)[];
		for (const key of keys) {
			if (!this.data.oldValues) this.data.oldValues = {} as Partial<Character>;
			old[key] = character.element[key];
		}
		this.data.oldValues = old;

		encounterStore$.initiativeQueue[characterIndex].element.assign(
			this.data.update
		);

		return STATUS.success;
	}

	undo() {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === this.data.uuid);

		if (characterIndex === -1 || !this.data.oldValues) return STATUS.failure;
		encounterStore$.initiativeQueue[characterIndex].element.assign(
			this.data.oldValues
		);

		return STATUS.success;
	}
}
