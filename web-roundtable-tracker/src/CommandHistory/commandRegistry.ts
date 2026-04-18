import { CompositeCommand } from './Commands/CompositeCommand';
import { ChangeHealthCommand } from './Commands/ChangeHealthCommand';
import { DelayCharacterCommand } from './Commands/DelayCharacterCommand';
import { EndRoundCommand } from './Commands/EndRoundCommand';
import { EndTurnCommand } from './Commands/EndTurnCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from './Commands/FinalizeTurnAndAdvanceRoundCommand';
import { FinalizeTurnAndReturnToInitiativeCommand } from './Commands/FinalizeTurnAndReturnToInitiativeCommand';
import { KnockOutCharacterCommand } from './Commands/KnockOutCharacterCommand';
import { RemoveCharacterCommand } from './Commands/RemoveCharacterCommand';
import { ReorderCharactersCommand } from './Commands/ReorderCharactersCommand';
import { TriggerReinforcementEventCommand } from './Commands/TriggerReinforcementEventCommand';
import { UpdateCharacterDataCommand } from './Commands/UpdateCharacterDataCommand';
import { SetTempHealthCommand } from './Commands/SetTempHealthCommand';
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
	registerSerializableCommand(
		FinalizeTurnAndAdvanceRoundCommand,
		'FinalizeTurnAndAdvanceRoundCommand'
	);
	registerSerializableCommand(
		FinalizeTurnAndReturnToInitiativeCommand,
		'FinalizeTurnAndReturnToInitiativeCommand'
	);
	registerSerializableCommand(DelayCharacterCommand, 'DelayCharacterCommand');
	registerSerializableCommand(
		KnockOutCharacterCommand,
		'KnockOutCharacterCommand'
	);
	registerSerializableCommand(
		TriggerReinforcementEventCommand,
		'TriggerReinforcementEventCommand'
	);
	registerSerializableCommand(ChangeHealthCommand, 'ChangeHealthCommand');
	registerSerializableCommand(SetTempHealthCommand, 'SetTempHealthCommand');
};
