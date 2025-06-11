import { observable, event } from '@legendapp/state';
import { generateUUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { InitiativeElement } from './initiativeTypes';
import { isCharacter, isRoundDisplay } from './initiativeHelpers';

const events = {
	onNextTurn$: event(),
};

const encounterStore$ = observable({
	initiativeQueue: [] as InitiativeElement[],
	activeCharacter: null as Character | null,
	round: 0,
	characterTurnTimestamps: {} as Record<
		string,
		{ start: number; end?: number; duration?: number }
	>,
	populateInitiativeQueue: (characters: Character[]) => {
		const items: InitiativeElement[] = [
			{
				type: 'roundDisplay',
				element: {
					uuid: generateUUID(),
				},
			},
		];

		const characterItems = characters.map(
			(character) =>
				({
					type: 'character',
					element: { ...character, hasTurn: true },
				}) as const
		);

		items.push(...characterItems);

		encounterStore$.initiativeQueue.set(items);
	},
	nextTurn: () => {
		console.log('Next Turn');

		if (encounterStore$.initiativeQueue.length === 0) return;

		const item = encounterStore$.initiativeQueue.shift()!;
		if (isRoundDisplay(item)) {
			encounterStore$.round.set(encounterStore$.round.peek() + 1);
			encounterStore$.initiativeQueue.push({
				type: 'roundDisplay',
				element: {
					uuid: generateUUID(),
				},
			});

			for (const character of encounterStore$.initiativeQueue) {
				if (isCharacter(character.peek())) {
					character.element.assign({
						hasTurn: true,
					});
				}
			}
		} else if (isCharacter(item)) {
			item.element.hasTurn = false;
			encounterStore$.initiativeQueue.push({
				...item,
				element: {
					...item.element,
					turnState:
						item.element.turnState == 'active'
							? 'normal'
							: item.element.turnState,
					hasTurn: false,
				},
			});
		}
		console.log(
			'Initiative Queue next:',
			encounterStore$.initiativeQueue.peek()
		);
		events.onNextTurn$.fire();
	},
	resolveActiveItem: () => {
		const list = encounterStore$.initiativeQueue.peek();
		if (list.length === 0)
			return console.warn(
				'No items in initiative queue to resolve active item.'
			);

		const activeItem = list[0];

		if (isCharacter(activeItem)) {
			encounterStore$.activeCharacter.set(activeItem.element);
		} else {
			encounterStore$.activeCharacter.set(null);
		}
	},
	startCharacterTurn: (uuid: string) => {
		encounterStore$.characterTurnTimestamps[uuid].set({ start: Date.now() });
	},
	endCharacterTurn: (uuid: string) => {
		const start = encounterStore$.characterTurnTimestamps[uuid]?.start.peek();
		const end = Date.now();
		if (!start) {
			console.warn(`No start time found for character with UUID: ${uuid}`);
			return;
		}

		encounterStore$.characterTurnTimestamps[uuid].set({
			start: start,
			end,
			duration: end - start,
		});
	},
});

events.onNextTurn$.on(() => {
	encounterStore$.resolveActiveItem();
});

export default encounterStore$;
