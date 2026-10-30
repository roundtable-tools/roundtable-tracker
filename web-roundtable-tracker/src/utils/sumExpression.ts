const SUM_EXPRESSION = /^\s*[+-]?\s*\d+(\s*[+-]\s*\d+)*\s*$/;

/**
 * Evaluates whole numbers joined by `+` and `-`, e.g. "12+5-3" is 14.
 * Spaces are allowed around the signs, not inside a number. Returns null for
 * anything else, and for terms or totals beyond the safe integer range.
 */
export function evaluateSumExpression(input: string): number | null {
	if (!SUM_EXPRESSION.test(input)) return null;

	const terms = (input.replace(/\s+/g, '').match(/[+-]?\d+/g) ?? []).map(
		(term) => parseInt(term, 10)
	);
	const sum = terms.reduce((total, term) => total + term, 0);

	return [...terms, sum].every(Number.isSafeInteger) ? sum : null;
}
