import encounterStore$ from '../initiativeStore';
import { InitiativeElement } from '../../initiativeTypes';
import { Command, STATUS } from '@/CommandHistory/common';

export class ReorderInitiativeQueueCommand implements Command {
	readonly type = 'ReorderInitiativeQueueCommand';
	description = 'Reorder initiative queue';
	data: { newQueue: InitiativeElement[]; prevQueue?: InitiativeElement[] };

	constructor(newQueue: InitiativeElement[]) {
		this.data = { newQueue };
	}

	execute() {
		this.data.prevQueue = encounterStore$.initiativeQueue
			.peek()
			.map((item) => structuredClone(item));
		encounterStore$.initiativeQueue.set(this.data.newQueue);

		return STATUS.success;
	}

	undo() {
		if (!this.data.prevQueue) return STATUS.failure;
		encounterStore$.initiativeQueue.set(this.data.prevQueue);

		return STATUS.success;
	}
}
