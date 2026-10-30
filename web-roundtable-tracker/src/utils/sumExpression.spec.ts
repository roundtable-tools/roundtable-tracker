import { describe, expect, it } from 'vitest';
import { evaluateSumExpression } from './sumExpression';

describe('evaluateSumExpression', () => {
	it('evaluates plain numbers', () => {
		expect(evaluateSumExpression('12')).toBe(12);
		expect(evaluateSumExpression('0')).toBe(0);
		expect(evaluateSumExpression('-4')).toBe(-4);
		expect(evaluateSumExpression('+4')).toBe(4);
	});

	it('adds and subtracts, ignoring spaces', () => {
		expect(evaluateSumExpression('12+5-3')).toBe(14);
		expect(evaluateSumExpression(' 7 + 8 + 2 ')).toBe(17);
		expect(evaluateSumExpression('3-10')).toBe(-7);
	});

	it('rejects anything else', () => {
		expect(evaluateSumExpression('')).toBeNull();
		expect(evaluateSumExpression('5+')).toBeNull();
		expect(evaluateSumExpression('5++3')).toBeNull();
		expect(evaluateSumExpression('5*3')).toBeNull();
		expect(evaluateSumExpression('1.5')).toBeNull();
		expect(evaluateSumExpression('abc')).toBeNull();
	});
});
