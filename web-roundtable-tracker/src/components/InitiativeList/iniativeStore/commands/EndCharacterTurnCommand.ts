import { getIninitativeStore } from '../initiativeStore';
import { Command, STATUS } from '@/CommandHistory/common';

export class EndCharacterTurnCommand implements Command {
	readonly type = 'EndCharacterTurnCommand';
	description = "End a character's turn";
	data: { uuid: string; oldTimestamps?: any };

	constructor(uuid: string) {
		this.data = { uuid };
	}

	execute() {
		const { encounterStore$ } = getIninitativeStore();
		this.data.oldTimestamps = structuredClone(
			encounterStore$.characterTurnTimestamps[this.data.uuid].peek()
		);

		const start =
			encounterStore$.characterTurnTimestamps[this.data.uuid]?.start?.peek();
		const end = Date.now();

		if (!start) return STATUS.failure;
		encounterStore$.characterTurnTimestamps[this.data.uuid].set({
			start,
			end,
			duration: end - start,
		});

		return STATUS.success;
	}
	undo() {
		const { encounterStore$ } = getIninitativeStore();
		if (this.data.oldTimestamps) {
			encounterStore$.characterTurnTimestamps[this.data.uuid].set(
				this.data.oldTimestamps
			);
		}

		return STATUS.success;
	}
}
