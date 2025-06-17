import { observable, event, observe, ObserveEvent } from '@legendapp/state';
import { generateUUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { InitiativeElement } from './initiativeTypes';
import { isCharacter, isRoundDisplay } from './initiativeHelpers';

const events = {
	onNextTurn$: event(),
};

const initializeRoundTimer = (round: number, start: number) => {
	encounterStore$.roundTimestamps[round].set({
		start,
	});
};

const finalizeRoundTimer = (currentRound: number, nextRound: number) => {
	const start =
		encounterStore$.roundTimestamps[currentRound]?.start.peek() || Date.now();
	const end = Date.now();
	const duration = end - start;

	encounterStore$.roundTimestamps[currentRound].set({
		start,
		end,
		duration,
	});

	encounterStore$.roundTimestamps[nextRound].set({
		start: end,
	});
};

const encounterStore$ = observable({
	initiativeQueue: [] as InitiativeElement[],
	activeCharacter: null as Character | null,
	round: 0,
	characterTurnTimestamps: {} as Record<
		string,
		{ start: number; end?: number; duration?: number }
	>,
	roundTimestamps: {} as Record<
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
		initializeRoundTimer(0, Date.now());
	},
	nextTurn: () => {
		console.log('Next Turn');

		if (encounterStore$.initiativeQueue.length === 0) return;

		const item = encounterStore$.initiativeQueue.shift()!;
		if (isRoundDisplay(item)) {
			const round = encounterStore$.round.peek();
			const nextRound = round + 1;
			encounterStore$.round.set(nextRound);
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

			finalizeRoundTimer(round, nextRound);
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
		const start = encounterStore$.characterTurnTimestamps[uuid]?.start?.peek();
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
	returnFromDelay: (uuid: string) => {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === uuid);

		if (characterIndex === -1)
			return console.warn(
				`Character with UUID ${uuid} not found in initiative queue.`
			);

		const character = encounterStore$.initiativeQueue.splice(
			characterIndex,
			1
		)[0];

		if (!isCharacter(character))
			return console.warn(`Item with UUID ${uuid} is not a character.`);

		if (!character.element.hasTurn)
			return console.warn(
				`Character ${character.element.name} does not have a turn.`
			);

		character.element.turnState = 'normal';
		encounterStore$.initiativeQueue.unshift(character);
	},
	forceUpdateState: (uuid: string, newState: Character['turnState']) => {
		const characterIndex = encounterStore$.initiativeQueue
			.peek()
			.findIndex((item) => item.element.uuid === uuid);

		if (characterIndex === -1)
			return console.warn(
				`Character with UUID ${uuid} not found in initiative queue.`
			);

		const character = encounterStore$.initiativeQueue.peek()[characterIndex];

		if (!isCharacter(character))
			return console.warn(`Item with UUID ${uuid} is not a character.`);

		encounterStore$.initiativeQueue[characterIndex].element.assign({
			turnState: newState,
		});
	},
});

events.onNextTurn$.on(() => {
	encounterStore$.resolveActiveItem();
});

const handleCharacterTurn = (e: ObserveEvent<void>) => {
	const activeCharacter = encounterStore$.activeCharacter.get(true);

	if (activeCharacter) {
		encounterStore$.startCharacterTurn(activeCharacter.uuid);

		e.onCleanup = () => {
			encounterStore$.endCharacterTurn(activeCharacter.uuid);
		};
	}
};

observe(handleCharacterTurn);

export default encounterStore$;
