import { CompositeCommand } from './Commands/CompositeCommand';
import { EndRoundCommand } from './Commands/EndRoundCommand';
import { EndTurnCommand } from './Commands/EndTurnCommand';
import { RemoveCharacterCommand } from './Commands/RemoveCharacterCommand';
import { ReorderCharactersCommand } from './Commands/ReorderCharactersCommand';
import { UpdateCharacterDataCommand } from './Commands/UpdateCharacterDataCommand';
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
	registerSerializableCommand(CompositeCommand, 'CompositeCommand');
	registerSerializableCommand(
		UpdateCharacterDataCommand,
		'UpdateCharacterCommand'
	);
	registerSerializableCommand(RemoveCharacterCommand, 'RemoveCharacterCommand');
	registerSerializableCommand(
		ReorderCharactersCommand,
		'ReorderCharactersCommand'
	);
	registerSerializableCommand(EndTurnCommand, 'EndTurnCommand');
	registerSerializableCommand(EndRoundCommand, 'EndRoundCommand');
};
