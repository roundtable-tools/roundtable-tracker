import { ReorderCharactersCommand } from './Commands/ReorderCharactersCommand';
import { UpdateCharacterCommand } from './Commands/UpdateCharacterCommand';
import { Command } from './common';

const commandMap: Record<string, new (data: Command['data']) => Command> = {};

export const getCommand = (
	type: string,
	classesMap = commandMap
): new (data: Command['data']) => Command => {
	if (!(type in classesMap)) throw new Error(`Invalid command type: ${type}`);
	return classesMap[type];
};

export const registerSerializableCommand = <T extends Command>(
	command: new (data: T['data']) => T,
	type: T['type'],
	classesMap = commandMap
) => {
	if (type in classesMap)
		throw new Error(`Command type already registered: ${type}`);

	classesMap[type] = command;
};

export const registerSerializableCommands = () => {
	registerSerializableCommand(UpdateCharacterCommand, 'UpdateCharacterCommand');
	registerSerializableCommand(
		ReorderCharactersCommand,
		'ReorderCharactersCommand'
	);
};
