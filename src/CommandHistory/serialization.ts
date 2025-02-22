import { ReorderCharactersCommand } from './Commands/ReorderCharactersCommand';
import { UpdateCharacterCommand } from './Commands/UpdateCharacterCommand';
import { Command } from './common';

const commandMap: Record<string, new (data: Command['data']) => Command> = {};

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
		data: command.data,
	} as CommandJSON<typeof command.data>;
};

export const commandFromJSON = (json: Record<string, unknown>) => {
	const type = json?.type as string;
	const commandType = type.split('.')[1];

	const data = json.data as Command['data'];

	const CommandClass = getCommand(commandType);
	const command = new CommandClass(data);

	return command;
};

export const getCommand = (
	type: string
): new (data: Command['data']) => Command => {
	if (!(type in commandMap)) throw new Error(`Invalid command type: ${type}`);
	return commandMap[type];
};

const registerSerializableCommand = <T extends Command>(
	command: new (data: T['data']) => T,
	type: T['type']
) => {
	if (type in commandMap)
		throw new Error(`Command type already registered: ${type}`);

	commandMap[type] = command;
};

export const registerSerializableCommands = () => {
	registerSerializableCommand(UpdateCharacterCommand, 'UpdateCharacterCommand');
	registerSerializableCommand(
		ReorderCharactersCommand,
		'ReorderCharactersCommand'
	);
};
