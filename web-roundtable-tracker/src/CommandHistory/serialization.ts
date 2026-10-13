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
			`Skipping stored command of unknown type ${commandType} and the history after it`,
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
 * `keepRestorableCommands` drops it, and everything that depends on it, after loading.
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
 * Returns the commands before the first one that is, or contains, an unknown command.
 * Later commands depend on the unknown one, so they cannot be undone or redone either.
 */
export const keepRestorableCommands = (commands: Command[]) => {
	const firstUnknown = commands.findIndex(containsUnknownCommand);

	return firstUnknown === -1 ? commands : commands.slice(0, firstUnknown);
};
