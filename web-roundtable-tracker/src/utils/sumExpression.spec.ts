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
		expect(evaluateSumExpression('1 2')).toBeNull();
	});

	it('rejects terms and totals beyond the safe integer range', () => {
		const huge = '9'.repeat(400);

		expect(evaluateSumExpression(`${huge}-${huge}`)).toBeNull();
		expect(evaluateSumExpression('9007199254740992')).toBeNull();
		expect(evaluateSumExpression('9007199254740991+1')).toBeNull();
		expect(evaluateSumExpression('9007199254740991')).toBe(
			Number.MAX_SAFE_INTEGER
		);
	});
});
