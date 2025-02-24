import { describe, it, expect, vi } from 'vitest';
import { CompositeCommand } from './CompositeCommand';
import { Command, STATUS } from '../common';

describe('CompositeCommand', () => {
	it('should execute all commands and return success if all succeed', () => {
		const command1: Command = {
			execute: vi.fn().mockReturnValue(STATUS.success),
			undo: vi.fn(),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: vi.fn().mockReturnValue(STATUS.success),
			undo: vi.fn(),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2],
		});

		const result = compositeCommand.execute();

		expect(command1.execute).toHaveBeenCalled();
		expect(command2.execute).toHaveBeenCalled();
		expect(result).toBe(STATUS.success);
	});

	it('should execute all commands and return the failure status', () => {
		const command1: Command = {
			execute: vi.fn().mockReturnValue(STATUS.success),
			undo: vi.fn(),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: vi.fn().mockReturnValue(STATUS.failure),
			undo: vi.fn(),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2],
		});

		const result = compositeCommand.execute();

		expect(command1.execute).toHaveBeenCalled();
		expect(command2.execute).toHaveBeenCalled();
		expect(result).toBe(STATUS.failure);
	});

	it('should undo all commands in reverse order and return success if all succeed', () => {
		const command1: Command = {
			execute: vi.fn(),
			undo: vi.fn().mockReturnValue(STATUS.success),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: vi.fn(),
			undo: vi.fn().mockReturnValue(STATUS.success),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2],
		});

		const result = compositeCommand.undo();

		expect(command2.undo).toHaveBeenCalled();
		expect(command1.undo).toHaveBeenCalled();
		expect(result).toBe(STATUS.success);
	});

	it('should undo all commands in reverse order and return the failure status', () => {
		const command1: Command = {
			execute: vi.fn(),
			undo: vi.fn().mockReturnValue(STATUS.success),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: vi.fn(),
			undo: vi.fn().mockReturnValue(STATUS.failure),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2],
		});

		const result = compositeCommand.undo();

		expect(command2.undo).toHaveBeenCalled();
		expect(command1.undo).toHaveBeenCalled();
		expect(result).toBe(STATUS.failure);
	});

	it('should execute commands in the correct order', () => {
		const order: string[] = [];
		const command1: Command = {
			execute: vi.fn().mockImplementation(() => {
				order.push('command1.execute');
				return STATUS.success;
			}),
			undo: vi.fn().mockImplementation(() => {
				order.push('command1.undo');
				return STATUS.success;
			}),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: vi.fn().mockImplementation(() => {
				order.push('command2.execute');
				return STATUS.success;
			}),
			undo: vi.fn().mockImplementation(() => {
				order.push('command2.undo');
				return STATUS.success;
			}),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2],
		});

		compositeCommand.execute();
		expect(order).toEqual(['command1.execute', 'command2.execute']);

		order.length = 0; // Clear the order array
		compositeCommand.undo();
		expect(order).toEqual(['command2.undo', 'command1.undo']);
	});
});
