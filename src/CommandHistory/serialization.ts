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
		json.type.startsWith('Command.');
		return true;
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

	const CommandClass = getCommand(commandType);
	const command = new CommandClass(data);
	command.description = json.description as string;

	return command;
};
