import { describe, it, expect, vi } from 'vitest';
import { CompositeCommand } from './CompositeCommand';
import { Command, STATUS } from '../common';

/** A mock that records its call in `order` and returns `status`. */
const trackCall = (
	order: string[],
	name: string,
	status: string = STATUS.success
) =>
	vi.fn().mockImplementation(() => {
		order.push(name);

		return status;
	});

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

	it('stops at the first failing command, undoes the ones that ran in reverse and returns the failure status', () => {
		const order: string[] = [];
		const command1: Command = {
			execute: trackCall(order, 'command1.execute'),
			undo: trackCall(order, 'command1.undo'),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: trackCall(order, 'command2.execute'),
			undo: trackCall(order, 'command2.undo'),
			type: '',
			data: {},
		};
		const command3: Command = {
			execute: trackCall(order, 'command3.execute', STATUS.failure),
			undo: trackCall(order, 'command3.undo'),
			type: '',
			data: {},
		};
		const command4: Command = {
			execute: trackCall(order, 'command4.execute'),
			undo: trackCall(order, 'command4.undo'),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2, command3, command4],
		});

		const result = compositeCommand.execute();

		expect(order).toEqual([
			'command1.execute',
			'command2.execute',
			'command3.execute',
			'command2.undo',
			'command1.undo',
		]);
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

	it('stops at the first failing undo, executes the undone commands again and returns the failure status', () => {
		const order: string[] = [];
		const command1: Command = {
			execute: trackCall(order, 'command1.execute'),
			undo: trackCall(order, 'command1.undo'),
			type: '',
			data: {},
		};
		const command2: Command = {
			execute: trackCall(order, 'command2.execute'),
			undo: trackCall(order, 'command2.undo', STATUS.failure),
			type: '',
			data: {},
		};
		const command3: Command = {
			execute: trackCall(order, 'command3.execute'),
			undo: trackCall(order, 'command3.undo'),
			type: '',
			data: {},
		};
		const command4: Command = {
			execute: trackCall(order, 'command4.execute'),
			undo: trackCall(order, 'command4.undo'),
			type: '',
			data: {},
		};
		const compositeCommand = new CompositeCommand({
			commands: [command1, command2, command3, command4],
		});

		const result = compositeCommand.undo();

		expect(order).toEqual([
			'command4.undo',
			'command3.undo',
			'command2.undo',
			'command3.execute',
			'command4.execute',
		]);
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

	it('preserves execute order after an undo', () => {
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
		compositeCommand.undo();

		order.length = 0;
		compositeCommand.execute();

		expect(order).toEqual(['command1.execute', 'command2.execute']);
	});

	it('names its parts unless given a description', () => {
		const part = (type: string, description?: string): Command => ({
			execute: vi.fn(),
			undo: vi.fn(),
			type,
			description,
			data: {},
		});
		const commands = [part('KnockOut', 'Knock Out'), part('Remove')];

		expect(new CompositeCommand({ commands }).description).toBe(
			'Knock Out + Remove'
		);
		expect(new CompositeCommand({ commands }, 'Slay').description).toBe('Slay');
	});
});
