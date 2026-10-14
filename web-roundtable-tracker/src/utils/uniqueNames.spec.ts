import { describe, expect, it } from 'vitest';
import { uniqueNames } from './uniqueNames';

describe('uniqueNames', () => {
	it('keeps names that are used once', () => {
		expect(uniqueNames(['Guard', 'Bandit'], ['Hero'])).toEqual([
			'Guard',
			'Bandit',
		]);
	});

	it('letters repeated names', () => {
		expect(uniqueNames(['Guard', 'Guard', 'Bandit'])).toEqual([
			'Guard A',
			'Guard B',
			'Bandit',
		]);
	});

	it('letters a name that clashes with a taken one, without renaming the taken one', () => {
		expect(uniqueNames(['Guard'], ['Guard'])).toEqual(['Guard A']);
	});

	it('continues the letters of copies already taken', () => {
		expect(uniqueNames(['Bandit', 'Bandit'], ['Bandit A', 'Bandit B'])).toEqual(
			['Bandit C', 'Bandit D']
		);
		expect(uniqueNames(['Bandit'], ['Bandit A', 'Bandit C'])).toEqual([
			'Bandit B',
		]);
	});
});
