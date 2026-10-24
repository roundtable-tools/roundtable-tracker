import { CompositeCommand } from './Commands/CompositeCommand';
import { ChangeHealthCommand } from './Commands/ChangeHealthCommand';
import { DelayCharacterCommand } from './Commands/DelayCharacterCommand';
import { EndRoundCommand } from './Commands/EndRoundCommand';
import { EndTurnCommand } from './Commands/EndTurnCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from './Commands/FinalizeTurnAndAdvanceRoundCommand';
import { FinalizeTurnAndReturnToInitiativeCommand } from './Commands/FinalizeTurnAndReturnToInitiativeCommand';
import { KnockOutCharacterCommand } from './Commands/KnockOutCharacterCommand';
import { ReactivateCharacterCommand } from './Commands/ReactivateCharacterCommand';
import { GiveAdditionalTurnCommand } from './Commands/GiveAdditionalTurnCommand';
import { RemoveCharacterCommand } from './Commands/RemoveCharacterCommand';
import { ReorderCharactersCommand } from './Commands/ReorderCharactersCommand';
import { ReturnToInitiativeCommand } from './Commands/ReturnToInitiativeCommand';
import { TriggerReinforcementEventCommand } from './Commands/TriggerReinforcementEventCommand';
import { UpdateCharacterDataCommand } from './Commands/UpdateCharacterDataCommand';
import { SetTempHealthCommand } from './Commands/SetTempHealthCommand';
import { RecordHazardDisableProgressCommand } from './Commands/RecordHazardDisableProgressCommand';
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

export const registerSerializableCommands = (classesMap = commandMap) => {
	const register = <T extends Command>(
		command: new (data: T['data']) => T,
		type: T['type']
	) => registerSerializableCommand(command, type, classesMap);

	register(CompositeCommand, 'CompositeCommand');
	register(UpdateCharacterDataCommand, 'UpdateCharacterCommand');
	register(RemoveCharacterCommand, 'RemoveCharacterCommand');
	register(ReorderCharactersCommand, 'ReorderCharactersCommand');
	register(EndTurnCommand, 'EndTurnCommand');
	register(EndRoundCommand, 'EndRoundCommand');
	register(
		FinalizeTurnAndAdvanceRoundCommand,
		'FinalizeTurnAndAdvanceRoundCommand'
	);
	register(
		FinalizeTurnAndReturnToInitiativeCommand,
		'FinalizeTurnAndReturnToInitiativeCommand'
	);
	register(DelayCharacterCommand, 'DelayCharacterCommand');
	register(KnockOutCharacterCommand, 'KnockOutCharacterCommand');
	register(ReactivateCharacterCommand, 'ReactivateCharacterCommand');
	register(
		TriggerReinforcementEventCommand,
		'TriggerReinforcementEventCommand'
	);
	register(ChangeHealthCommand, 'ChangeHealthCommand');
	register(SetTempHealthCommand, 'SetTempHealthCommand');
	register(ReturnToInitiativeCommand, 'ReturnToInitiativeCommand');
	register(GiveAdditionalTurnCommand, 'GiveAdditionalTurnCommand');
	register(
		RecordHazardDisableProgressCommand,
		'RecordHazardDisableProgressCommand'
	);
};
