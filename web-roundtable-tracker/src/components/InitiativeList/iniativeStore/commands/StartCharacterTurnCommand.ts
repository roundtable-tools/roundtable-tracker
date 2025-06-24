import { getInitiativeStore } from '../initiativeStore';
import { Command, STATUS } from '@/CommandHistory/common';

export class StartCharacterTurnCommand implements Command {
	readonly type = 'StartCharacterTurnCommand';
	description = "Start a character's turn";
	data: { uuid: string; oldTimestamps?: any };

	constructor(uuid: string) {
		this.data = { uuid };
	}

	execute() {
		const { encounterStore$ } = getInitiativeStore();
		this.data.oldTimestamps = structuredClone(
			encounterStore$.characterTurnTimestamps[this.data.uuid].peek()
		);
		encounterStore$.characterTurnTimestamps[this.data.uuid].set({
			start: Date.now(),
		});

		return STATUS.success;
	}
	undo() {
		const { encounterStore$ } = getInitiativeStore();
		if (this.data.oldTimestamps) {
			encounterStore$.characterTurnTimestamps[this.data.uuid].set(
				this.data.oldTimestamps
			);
		}

		return STATUS.success;
	}
}
