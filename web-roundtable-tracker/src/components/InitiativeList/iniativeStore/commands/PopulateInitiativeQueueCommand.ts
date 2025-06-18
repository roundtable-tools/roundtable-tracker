import { generateUUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { InitiativeElement } from '../../initiativeTypes';
import encounterStore$ from '../initiativeStore';

import { Command, STATUS } from '@/CommandHistory/common';
import { initializeRoundTimer } from './utils';

export class PopulateInitiativeQueueCommand implements Command {
	readonly type = 'PopulateInitiativeQueueCommand';
	description = 'Populate initiative queue';
	data: { characters: Character[]; removedItems?: InitiativeElement[] };

	constructor(characters: Character[]) {
		this.data = { characters };
	}

	execute() {
		this.data.removedItems = encounterStore$.initiativeQueue
			.peek()
			.map((item) => structuredClone(item));
		const items: InitiativeElement[] = [
			{
				type: 'roundDisplay',
				element: { uuid: generateUUID() },
			},
		];
		const characterItems = this.data.characters.map(
			(character) =>
				({
					type: 'character',
					element: { ...character, hasTurn: true },
				}) as const
		);
		items.push(...characterItems);
		encounterStore$.initiativeQueue.set(items);
		initializeRoundTimer(0, Date.now());

		return STATUS.success;
	}
	undo() {
		if (!this.data.removedItems) return STATUS.failure;
		encounterStore$.initiativeQueue.set(this.data.removedItems);

		return STATUS.success;
	}
}
