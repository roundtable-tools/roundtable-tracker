import { getCommand } from './commandRegistry';
import { Command } from './common';

export type CommandJSON<T extends Command['data'] = Command['data']> = {
	type: string;
	data: T;
};

export const isCommandJSON = (
	data: object
): data is CommandJSON<Command['data']> => {
	const json = data as Record<string, unknown>;

	if (typeof json?.type === 'string' && 'data' in json) {
		return json.type.startsWith('Command.');
	}

	return false;
};

export const commandToJSON = (command: Command) => {
	return {
		type: `Command.${command.type}`,
		description: command.description,
		data: command.data,
	} as CommandJSON<typeof command.data>;
};

export const commandFromJSON = (json: Record<string, unknown>) => {
	const type = json?.type as string;
	const commandType = type.split('.')[1];

	const data = json.data as Command['data'];

	let CommandClass: ReturnType<typeof getCommand>;

	try {
		CommandClass = getCommand(commandType);
	} catch (error) {
		console.warn(
			`Skipping stored command of unknown type ${commandType}; undo and redo stop at it`,
			error
		);

		return new UnknownCommand(commandType);
	}

	const command = new CommandClass(data);
	command.description = json.description as string;

	return command;
};

/**
 * Placeholder for a stored command whose type is not registered.
 * `keepUndoableCommands` and `keepRedoableCommands` drop it, and the commands
 * that cannot be replayed past it, after loading.
 */
export class UnknownCommand {
	constructor(readonly commandType: string) {}
}

const containsUnknownCommand = (value: unknown): boolean => {
	if (value instanceof UnknownCommand) return true;

	if (value instanceof Set) return [...value].some(containsUnknownCommand);

	if (Array.isArray(value)) return value.some(containsUnknownCommand);

	if (value && typeof value === 'object')
		return Object.values(value).some(containsUnknownCommand);

	return false;
};

/**
 * Returns the undo history (oldest first, `undo()` pops from the end) after the
 * last command that is, or contains, an unknown command. Undo cannot step back
 * past the unknown command, so the older commands cannot be undone either.
 */
export const keepUndoableCommands = (history: Command[]) => {
	const lastUnknown = history.findLastIndex(containsUnknownCommand);

	return history.slice(lastUnknown + 1);
};

/**
 * Returns the redo stack (next first, `redo()` takes from the front) before the
 * first command that is, or contains, an unknown command. Redo cannot step past
 * the unknown command, so the later commands cannot be redone either.
 */
export const keepRedoableCommands = (redoStack: Command[]) => {
	const firstUnknown = redoStack.findIndex(containsUnknownCommand);

	return firstUnknown === -1 ? redoStack : redoStack.slice(0, firstUnknown);
};
