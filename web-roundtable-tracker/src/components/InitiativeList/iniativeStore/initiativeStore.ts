import {
	observable,
	event,
	observe,
	ObserveEvent,
	computed,
} from '@legendapp/state';
import { Character } from '@/store/data';
import { InitiativeElement } from '../initiativeTypes';
import { Command } from '@/CommandHistory/common';
import {
	StartCharacterTurnCommand,
	EndCharacterTurnCommand,
	ResolveActiveItemCommand,
} from './commands';

const events = {
	onNextTurn$: event(),
};

const encounterStore$ = observable({
	initiativeQueue: [] as InitiativeElement[],
	elementsMap: computed(
		(): Record<string, InitiativeElement> =>
			encounterStore$.initiativeQueue.get().reduce(
				(map, item) => {
					map[item.element.uuid] = item;

					return map;
				},
				{} as Record<string, InitiativeElement>
			)
	),
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
	undoQueue: [] as Command[],
	redoQueue: [] as Command[],

	executeCommand(command: Command, partOfTransaction = false) {
		command.execute();
		command.partOfTransaction = partOfTransaction;
		encounterStore$.undoQueue.push(command);
		encounterStore$.redoQueue.set([]); // Clear redo queue on new command
	},

	undo() {
		let command = encounterStore$.undoQueue.pop();

		if (!command) return;
		command.undo();
		encounterStore$.redoQueue.push(command);

		// Continue undoing if partOfTransaction is true
		while (
			command.partOfTransaction === true &&
			encounterStore$.undoQueue.length > 0
		) {
			command = encounterStore$.undoQueue.pop();

			if (!command) break;
			command.undo();
			encounterStore$.redoQueue.push(command);
		}
	},

	redo() {
		let command = encounterStore$.redoQueue.pop();

		if (!command) return;
		command.execute();
		encounterStore$.undoQueue.push(command);

		// Continue redoing if partOfTransaction is true
		while (
			command.partOfTransaction === true &&
			encounterStore$.redoQueue.length > 0
		) {
			command = encounterStore$.redoQueue.pop();

			if (!command) break;
			command.execute();
			encounterStore$.undoQueue.push(command);
		}
	},
});

// Delegate all imperative operations to commands
// e.g. commands.populateInitiativeQueue, commands.nextTurn, commands.resolveActiveItem, etc.

events.onNextTurn$.on(() => {
	console.log('Next turn event triggered');
	encounterStore$.executeCommand(new ResolveActiveItemCommand(), true);
});

// Observe character turn changes and use commands
const handleCharacterTurn = (e: ObserveEvent<void>) => {
	const activeCharacter = encounterStore$.activeCharacter.get(true);

	console.log('Active character:', activeCharacter?.name);

	if (activeCharacter) {
		encounterStore$.executeCommand(
			new StartCharacterTurnCommand(activeCharacter.uuid),
			true
		);

		e.onCleanup = () => {
			encounterStore$.executeCommand(
				new EndCharacterTurnCommand(activeCharacter.uuid),
				true
			);
		};
	}
};

observe(handleCharacterTurn);
export { encounterStore$, events };

export default encounterStore$;
