import { describe, expect, it } from 'vitest';
import { getPersistentDamageLabel } from './persistentDamage';

describe('getPersistentDamageLabel', () => {
	it('shows the name, else the damage last taken, else the damage type', () => {
		expect(
			getPersistentDamageLabel({
				id: '1',
				name: ' 2d6 fire ',
				amount: 7,
				icon: 'fire',
			})
		).toBe('2d6 fire');
		expect(
			getPersistentDamageLabel({ id: '2', amount: 3, icon: 'bleed' })
		).toBe('3');
		expect(
			getPersistentDamageLabel({ id: '3', name: ' ', amount: 2, icon: 'other' })
		).toBe('2');
		expect(getPersistentDamageLabel({ id: '4', icon: 'acid' })).toBe('Acid');
	});
});
