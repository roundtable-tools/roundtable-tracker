import { describe, expect, test } from 'vitest';

import { RandomIntCommand } from './RandomIntCommand';

describe('RandomIntCommand', () => {
	test('should initialize the data property with a random number within the specified range', () => {
		const range = 10;
		const command = new RandomIntCommand(range);

		expect(command.data.number).toBeGreaterThanOrEqual(0);
		expect(command.data.number).toBeLessThan(range);
	});

	test('should set the description property to "Random Int Command"', () => {
		const command = new RandomIntCommand();

		expect(command.description).toBe('Random Int Command');
	});
});
