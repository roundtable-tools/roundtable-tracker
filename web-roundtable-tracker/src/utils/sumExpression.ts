const SUM_EXPRESSION = /^[+-]?\d+([+-]\d+)*$/;

/**
 * Evaluates whole numbers joined by `+` and `-`, e.g. "12+5-3" is 14.
 * Spaces are ignored. Returns null for anything else.
 */
export function evaluateSumExpression(input: string): number | null {
	const expression = input.replace(/\s+/g, '');

	if (!SUM_EXPRESSION.test(expression)) return null;

	return (expression.match(/[+-]?\d+/g) ?? []).reduce(
		(sum, term) => sum + parseInt(term, 10),
		0
	);
}
