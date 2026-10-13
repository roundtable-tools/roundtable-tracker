import { describe, expect, it } from 'vitest';
import { registerSerializableCommands } from './commandRegistry';
import { Command } from './common';

type CommandClass = new (data: Command['data']) => Command;

// Commands that are never stored in the history, so they need no registration.
const notSerializable = new Set(['RandomIntCommand']);

const sources = import.meta.glob<string>(
	['./Commands/**/*Command.ts', '!./Commands/**/*.spec.ts'],
	{ query: '?raw', import: 'default', eager: true }
);
const modules = import.meta.glob<Record<string, unknown>>(
	['./Commands/**/*Command.ts', '!./Commands/**/*.spec.ts'],
	{ eager: true }
);

const isCommandClass = (value: unknown): value is CommandClass =>
	typeof value === 'function' &&
	typeof value.prototype?.execute === 'function' &&
	typeof value.prototype?.undo === 'function';

const commandClasses = Object.entries(modules).flatMap(([path, module]) =>
	Object.entries(module)
		.filter(([, value]) => isCommandClass(value))
		.map(([name, value]) => {
			const type = sources[path].match(
				new RegExp(`class ${name}\\b[\\s\\S]*?readonly type = '([^']+)'`)
			)?.[1];

			return { name, type, commandClass: value as CommandClass };
		})
);

describe('commandRegistry', () => {
	const registry: Record<string, CommandClass> = {};
	registerSerializableCommands(registry);

	it('finds the command classes', () => {
		expect(commandClasses.map(({ name }) => name)).toContain(
			'ReturnToInitiativeCommand'
		);
	});

	it.each(commandClasses.filter(({ name }) => !notSerializable.has(name)))(
		'registers $name under its type',
		({ type, commandClass }) => {
			expect(type).toBeDefined();
			expect(registry[type!]).toBe(commandClass);
		}
	);
});
