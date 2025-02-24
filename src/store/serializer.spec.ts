import { describe, it, expect, vi } from 'vitest';
import { jsonConfiguration } from './serializer';
import { Command, STATUS } from '@/CommandHistory/common';
import { commandToJSON } from '@/CommandHistory/serialization';
import { CompositeCommand } from '@/CommandHistory/Commands/CompositeCommand';
import { registerSerializableCommand } from '@/CommandHistory/commandRegistry';

class MockCommand implements Command {
	readonly type = 'MockCommand';
	description = 'Mock Command';
	data = { key: 'value' };

	execute() {
		return STATUS.success;
	}

	undo() {
		return STATUS.success;
	}
}
const classes = {};
registerSerializableCommand(MockCommand, 'MockCommand', classes);
registerSerializableCommand(CompositeCommand, 'CompositeCommand', classes);

vi.mock('@/CommandHistory/commandRegistry', async (importOriginal) => {
	const actual =
		await importOriginal<typeof import('@/CommandHistory/commandRegistry')>();

	return {
		...actual,
		getCommand: vi.fn((type: string) => {
			return actual.getCommand(type, classes);
		}),
	};
});

describe('jsonConfiguration', () => {
	it('should correctly revive a Command object from JSON', () => {
		const command = new MockCommand();
		const jsonString = JSON.stringify(commandToJSON(command));
		const parsedObject = JSON.parse(jsonString, jsonConfiguration.reviver);

		expect(parsedObject).toBeInstanceOf(MockCommand);
		expect(parsedObject.type).toBe(command.type);
		expect(parsedObject.data).toEqual(command.data);
	});

	it('should correctly replace a Command object to JSON', () => {
		const command = new MockCommand();
		const jsonString = JSON.stringify(command, jsonConfiguration.replacer);
		const parsedObject = JSON.parse(jsonString);

		expect(parsedObject).toHaveProperty('type', `Command.${command.type}`);
		expect(parsedObject).toHaveProperty('data', command.data);
	});

	it('should correctly handle non-Command objects during reviving', () => {
		const jsonString = JSON.stringify({ key: 'value' });
		const parsedObject = JSON.parse(jsonString, jsonConfiguration.reviver);

		expect(parsedObject).toEqual({ key: 'value' });
	});

	it('should correctly handle non-Command objects during replacing', () => {
		const jsonString = JSON.stringify(
			{ key: 'value' },
			jsonConfiguration.replacer
		);
		const parsedObject = JSON.parse(jsonString);

		expect(parsedObject).toEqual({ key: 'value' });
	});

	it('should correctly serialize and deserialize a CompositeCommand', () => {
		const command1 = new MockCommand();
		const command2 = new MockCommand();
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2],
		});

		const jsonString = JSON.stringify(
			commandToJSON(compositeCommand),
			jsonConfiguration.replacer
		);
		const parsedObject = JSON.parse(jsonString, jsonConfiguration.reviver);

		expect(parsedObject).toBeInstanceOf(CompositeCommand);
		expect(parsedObject.type).toBe(compositeCommand.type);
		expect(parsedObject.data.commands.length).toBe(2);
		expect(parsedObject.data.commands[0]).toBeInstanceOf(MockCommand);
		expect(parsedObject.data.commands[1]).toBeInstanceOf(MockCommand);
	});
});
