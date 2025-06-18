import { generateUUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { InitiativeElement } from '../../initiativeTypes';
import { isCharacter, isRoundDisplay } from '../../initiativeHelpers';
import encounterStore$, { events } from '../initiativeStore';

import { Command, STATUS } from '@/CommandHistory/common';
import { finalizeRoundTimer } from './utils';

export class NextTurnCommand implements Command {
	readonly type = 'NextTurnCommand';
	description = 'Advance to the next turn';
	data: {
		removedItem?: InitiativeElement;
		addedItem?: InitiativeElement;
		roundChanged?: boolean;
		oldRound?: number;
		oldActive?: Character | null;
	};

	constructor() {
		this.data = {};
	}

	execute() {
		this.data.oldRound = encounterStore$.round.peek();
		this.data.oldActive = encounterStore$.activeCharacter.peek();

		if (encounterStore$.initiativeQueue.length === 0) return STATUS.failure;
		const item = encounterStore$.initiativeQueue.shift()!;
		this.data.removedItem = structuredClone(item);

		if (isRoundDisplay(item)) {
			const round = encounterStore$.round.peek();
			const nextRound = round + 1;
			encounterStore$.round.set(nextRound);
			const roundDisplay: InitiativeElement = {
				type: 'roundDisplay',
				element: { uuid: generateUUID() },
			};
			encounterStore$.initiativeQueue.push(roundDisplay);
			this.data.addedItem = roundDisplay;

			for (const character of encounterStore$.initiativeQueue) {
				if (isCharacter(character.peek())) {
					character.element.assign({ hasTurn: true });
				}
			}
			finalizeRoundTimer(round, nextRound);
			this.data.roundChanged = true;
		} else if (isCharacter(item)) {
			item.element.hasTurn = false;
			const updatedItem: InitiativeElement = {
				...item,
				element: {
					...item.element,
					turnState:
						item.element.turnState == 'active'
							? 'normal'
							: item.element.turnState,
					hasTurn: false,
				},
			};
			encounterStore$.initiativeQueue.push(updatedItem);
			this.data.addedItem = updatedItem;
		}

		setTimeout(() => events.onNextTurn$.fire());

		return STATUS.success;
	}
	undo() {
		if (this.data.addedItem) {
			const idx = encounterStore$.initiativeQueue
				.peek()
				.findIndex(
					(item) => item.element.uuid === this.data.addedItem!.element.uuid
				);

			if (idx !== -1) encounterStore$.initiativeQueue.splice(idx, 1);
		}

		if (this.data.removedItem) {
			encounterStore$.initiativeQueue.unshift(this.data.removedItem);
		}

		if (this.data.roundChanged) {
			encounterStore$.round.set(this.data.oldRound!);
		}

		return STATUS.success;
	}
}
