export function resolveXpBasisLevel(
	partyLevel: number | undefined,
	fallbackLevel: number
): number {
	const numericPartyLevel = Number.isFinite(partyLevel)
		? Math.trunc(partyLevel as number)
		: fallbackLevel;

	return Math.max(1, Math.min(20, numericPartyLevel));
}
