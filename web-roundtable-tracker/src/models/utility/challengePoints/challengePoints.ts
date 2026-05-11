export const CHALLENGE_POINT_TIER_STARTS = [
	1, 3, 5, 7, 9, 11, 13, 15, 17,
] as const;

export type ChallengePointTierStart =
	(typeof CHALLENGE_POINT_TIER_STARTS)[number];

export type PartySetupMode = 'simple' | 'specific' | 'challenge-points';

export interface NormalizedPartySetup {
	effectivePartyLevel: number;
	effectivePartySize: number;
	partyLevels: number[];
	challengePointBasisLevel: number;
	challengePointTierLabel: string;
	challengePointBudget: number;
	challengePointPerCharacter: number[];
	inferredChallengePointPartySize: number;
	inferredChallengePointPerCharacter: number[];
	xpBudgetEquivalent: number;
}

function clampToIntegerRange(value: number, min: number, max: number): number {
	const numeric = Number.isFinite(value) ? Math.trunc(value) : min;

	return Math.max(min, Math.min(max, numeric));
}

function sanitizePartyLevel(level: number): number {
	return clampToIntegerRange(level, 1, 20);
}

function sanitizePartySize(size: number): number {
	return clampToIntegerRange(size, 1, 8);
}

function sanitizeChallengePointBudget(value: number): number {
	const numeric = Number.isFinite(value) ? Math.trunc(value) : 0;

	return Math.max(0, numeric);
}

function sanitizeChallengePointBudgetForInput(value: number): number {
	const budget = sanitizeChallengePointBudget(value);

	return Math.max(2, budget);
}

export function challengePointTierLabel(tierStart: number): string {
	const normalizedStart = sanitizePartyLevel(tierStart);

	return `${normalizedStart}-${normalizedStart + 3}`;
}

export function toChallengePointTierStart(
	value: number
): ChallengePointTierStart {
	const max =
		CHALLENGE_POINT_TIER_STARTS[CHALLENGE_POINT_TIER_STARTS.length - 1];
	const min = CHALLENGE_POINT_TIER_STARTS[0];
	const truncated = Math.trunc(value);
	const oddFloor = truncated % 2 === 0 ? truncated - 1 : truncated;

	switch (true) {
		case value <= min:
			return min;
		case value >= max:
			return max;
		case CHALLENGE_POINT_TIER_STARTS.includes(
			oddFloor as ChallengePointTierStart
		):
			return oddFloor as ChallengePointTierStart;
		default:
			return 1;
	}
}

export function challengePointsFromLevelDelta(delta: number): number {
	const normalizedDelta = Math.max(0, Math.trunc(delta));

	if (normalizedDelta === 0) {
		return 2;
	}

	if (normalizedDelta === 1) {
		return 3;
	}

	if (normalizedDelta === 2) {
		return 4;
	}

	return 6;
}

export function deriveChallengePointBasisFromLowestLevel(
	lowestLevel: number
): ChallengePointTierStart {
	const normalized = sanitizePartyLevel(lowestLevel);

	return toChallengePointTierStart(normalized);
}

export function challengePointsToXp(challengePoints: number): number {
	return sanitizeChallengePointBudget(challengePoints) * 20;
}

type ChallengePointPartyAssumption = {
	partySize: number;
	perCharacter: number[];
	totalChallengePoints: number;
};

const CHALLENGE_POINT_VALUES = [2, 3, 4, 6, 9] as const;

type ChallengePointAssumptionCounts = readonly [
	countTwo: number,
	countThree: number,
	countFour: number,
	countSix: number,
	countNine: number,
];

const CHALLENGE_POINT_ASSUMPTION_COUNTS_BY_BUDGET: Record<
	number,
	ChallengePointAssumptionCounts
> = {
	2: [1, 0, 0, 0, 0],
	3: [0, 1, 0, 0, 0],
	4: [2, 0, 0, 0, 0],
	5: [1, 1, 0, 0, 0],
	6: [3, 0, 0, 0, 0],
	7: [2, 1, 0, 0, 0],
	8: [4, 0, 0, 0, 0],
	9: [3, 1, 0, 0, 0],
	10: [2, 2, 0, 0, 0],
	11: [1, 3, 0, 0, 0],
	12: [0, 4, 0, 0, 0],
	13: [0, 3, 1, 0, 0],
	14: [0, 2, 2, 0, 0],
	15: [0, 1, 3, 0, 0],
	16: [0, 0, 4, 0, 0],
	17: [0, 1, 2, 1, 0],
	18: [0, 0, 3, 1, 0],
	19: [0, 1, 1, 2, 0],
	20: [0, 0, 2, 2, 0],
	21: [0, 1, 0, 3, 0],
	22: [0, 0, 1, 3, 0],
	23: [0, 0, 2, 1, 1],
	24: [0, 0, 0, 4, 0],
	25: [0, 0, 1, 2, 1],
	26: [0, 0, 2, 0, 2],
	27: [0, 0, 0, 3, 1],
	28: [0, 0, 1, 1, 2],
	29: [0, 0, 2, 2, 1],
	30: [0, 0, 0, 2, 2],
	31: [0, 0, 1, 0, 3],
	32: [0, 0, 2, 1, 2],
	33: [0, 0, 0, 1, 3],
	34: [0, 0, 1, 2, 2],
	35: [0, 0, 2, 0, 3],
	36: [0, 0, 0, 0, 4],
	37: [0, 0, 1, 1, 3],
	38: [0, 0, 2, 2, 2],
	39: [0, 0, 0, 2, 3],
	40: [0, 0, 1, 0, 4],
	41: [0, 0, 2, 1, 3],
	42: [0, 0, 0, 1, 4],
	43: [0, 0, 1, 2, 3],
	44: [0, 0, 2, 0, 4],
	45: [0, 0, 0, 0, 5],
	46: [0, 0, 1, 1, 4],
	47: [0, 0, 2, 2, 3],
	48: [0, 0, 0, 2, 4],
	49: [0, 0, 1, 0, 5],
	50: [0, 0, 2, 1, 4],
	51: [0, 0, 0, 1, 5],
	52: [0, 0, 1, 2, 4],
	53: [0, 0, 2, 0, 5],
	54: [0, 0, 0, 0, 6],
	55: [0, 0, 1, 1, 5],
	56: [0, 0, 2, 2, 4],
	57: [0, 0, 0, 2, 5],
	58: [0, 0, 1, 0, 6],
	59: [0, 0, 2, 1, 5],
	60: [0, 0, 0, 1, 6],
	61: [0, 0, 1, 2, 5],
	62: [0, 0, 2, 0, 6],
	63: [0, 0, 3, 1, 5],
	64: [0, 0, 1, 1, 6],
	65: [0, 0, 2, 2, 5],
	66: [0, 0, 0, 2, 6],
	67: [0, 0, 1, 0, 7],
	68: [0, 0, 2, 1, 6],
	69: [0, 0, 0, 1, 7],
	70: [0, 0, 1, 2, 6],
	71: [0, 0, 2, 0, 7],
	72: [0, 0, 0, 0, 8],
};

function comparePartyAssumptions(
	left: ChallengePointPartyAssumption,
	right: ChallengePointPartyAssumption,
	targetBudget: number
): number {
	const leftBudgetDistance = Math.abs(left.totalChallengePoints - targetBudget);
	const rightBudgetDistance = Math.abs(
		right.totalChallengePoints - targetBudget
	);

	if (leftBudgetDistance !== rightBudgetDistance) {
		return leftBudgetDistance - rightBudgetDistance;
	}

	const leftCountDistance = Math.abs(left.partySize - 4);
	const rightCountDistance = Math.abs(right.partySize - 4);

	if (leftCountDistance !== rightCountDistance) {
		return leftCountDistance - rightCountDistance;
	}

	if (left.partySize !== right.partySize) {
		return left.partySize - right.partySize;
	}

	const leftHighest = Math.max(...left.perCharacter);
	const rightHighest = Math.max(...right.perCharacter);

	if (leftHighest !== rightHighest) {
		return leftHighest - rightHighest;
	}

	return 0;
}

function challengePointValueToDelta(challengePointValue: number): number {
	switch (challengePointValue) {
		case 2:
			return 0;
		case 3:
			return 1;
		case 4:
			return 2;
		case 6:
			return 3;
		case 9:
			return 4;
		default:
			return 0;
	}
}

function perCharacterSpreadWithinThreeLevels(perCharacter: number[]): boolean {
	if (perCharacter.length <= 1) {
		return true;
	}

	let minDelta = Number.POSITIVE_INFINITY;
	let maxDelta = Number.NEGATIVE_INFINITY;

	for (const value of perCharacter) {
		const delta = challengePointValueToDelta(value);
		minDelta = Math.min(minDelta, delta);
		maxDelta = Math.max(maxDelta, delta);
	}

	return maxDelta - minDelta <= 3;
}

function buildAssumptionFromCounts(
	countTwo: number,
	countThree: number,
	countFour: number,
	countSix: number,
	countNine = 0
): ChallengePointPartyAssumption {
	const perCharacter = [
		...Array.from({ length: countTwo }, () => 2),
		...Array.from({ length: countThree }, () => 3),
		...Array.from({ length: countFour }, () => 4),
		...Array.from({ length: countSix }, () => 6),
		...Array.from({ length: countNine }, () => 9),
	];

	return {
		partySize: perCharacter.length,
		perCharacter,
		totalChallengePoints:
			countTwo * 2 +
			countThree * 3 +
			countFour * 4 +
			countSix * 6 +
			countNine * 9,
	};
}

function assumptionMetaFromCounts(counts: ChallengePointAssumptionCounts): {
	lowestLevelDelta: number;
	partySize: number;
} {
	const firstNonZeroIndex = counts.findIndex((count) => count > 0);
	const lowestValue =
		firstNonZeroIndex >= 0
			? CHALLENGE_POINT_VALUES[firstNonZeroIndex]
			: CHALLENGE_POINT_VALUES[0];

	return {
		lowestLevelDelta: challengePointValueToDelta(lowestValue),
		partySize: counts.reduce((sum, count) => sum + count, 0),
	};
}

export function inferPartyFromChallengePointBudget(
	challengePointBudget: number
): ChallengePointPartyAssumption {
	const targetBudget =
		sanitizeChallengePointBudgetForInput(challengePointBudget);
	const presetCounts =
		CHALLENGE_POINT_ASSUMPTION_COUNTS_BY_BUDGET[targetBudget];

	if (presetCounts) {
		return buildAssumptionFromCounts(...presetCounts);
	}

	const searchLimit = Math.max(8, Math.ceil(targetBudget / 2) + 4);

	let bestAssumption: ChallengePointPartyAssumption = {
		partySize: 1,
		perCharacter: [2],
		totalChallengePoints: 2,
	};

	for (let countNine = 0; countNine <= searchLimit; countNine++) {
		for (let countSix = 0; countSix <= searchLimit - countNine; countSix++) {
			for (
				let countFour = 0;
				countFour <= searchLimit - countNine - countSix;
				countFour++
			) {
				for (
					let countThree = 0;
					countThree <= searchLimit - countNine - countSix - countFour;
					countThree++
				) {
					for (
						let countTwo = 0;
						countTwo <=
						searchLimit - countNine - countSix - countFour - countThree;
						countTwo++
					) {
						const assumption = buildAssumptionFromCounts(
							countTwo,
							countThree,
							countFour,
							countSix,
							countNine
						);

						if (assumption.partySize === 0) {
							continue;
						}

						if (assumption.totalChallengePoints !== targetBudget) {
							continue;
						}

						if (!perCharacterSpreadWithinThreeLevels(assumption.perCharacter)) {
							continue;
						}

						if (
							comparePartyAssumptions(
								assumption,
								bestAssumption,
								targetBudget
							) < 0
						) {
							bestAssumption = assumption;
						}
					}
				}
			}
		}
	}

	if (bestAssumption.totalChallengePoints !== targetBudget) {
		const guaranteedCount = Math.ceil(targetBudget / CHALLENGE_POINT_VALUES[0]);

		return {
			partySize: guaranteedCount,
			perCharacter: Array.from({ length: guaranteedCount }, () => 2),
			totalChallengePoints: guaranteedCount * 2,
		};
	}

	return bestAssumption;
}

export function computeChallengePointBudgetForLevels(
	levels: number[],
	basisLevel: number
): number {
	const normalizedBasisLevel = sanitizePartyLevel(basisLevel);
	const safeLevels = levels.map(sanitizePartyLevel);

	return safeLevels.reduce((sum, level) => {
		const delta = level - normalizedBasisLevel;

		return sum + challengePointsFromLevelDelta(delta);
	}, 0);
}

export function normalizePartySetup(input: {
	mode: PartySetupMode;
	simplePartyLevel: number;
	simplePartySize: number;
	specificPartyLevels?: number[];
	challengePointTierStart?: number;
	challengePointBudget?: number;
}): NormalizedPartySetup {
	const fallbackLevel = sanitizePartyLevel(input.simplePartyLevel);
	const fallbackSize = sanitizePartySize(input.simplePartySize);

	if (input.mode === 'challenge-points') {
		const tierStart = toChallengePointTierStart(
			input.challengePointTierStart ?? 1
		);
		const challengePointBudget = sanitizeChallengePointBudgetForInput(
			input.challengePointBudget ?? 0
		);
		const inferredParty =
			inferPartyFromChallengePointBudget(challengePointBudget);
		const assumptionCounts =
			CHALLENGE_POINT_ASSUMPTION_COUNTS_BY_BUDGET[challengePointBudget];
		const fallbackLowestValue =
			inferredParty.perCharacter.length > 0
				? Math.min(...inferredParty.perCharacter)
				: CHALLENGE_POINT_VALUES[0];
		const assumptionMeta = assumptionCounts
			? assumptionMetaFromCounts(assumptionCounts)
			: {
					lowestLevelDelta: challengePointValueToDelta(fallbackLowestValue),
					partySize: inferredParty.partySize,
				};
		const assumedLowestLevel = sanitizePartyLevel(
			tierStart + assumptionMeta.lowestLevelDelta
		);
		const assumedPartyLevels = inferredParty.perCharacter.map((value) =>
			sanitizePartyLevel(tierStart + challengePointValueToDelta(value))
		);

		return {
			effectivePartyLevel: assumedLowestLevel,
			effectivePartySize: assumptionMeta.partySize,
			partyLevels: assumedPartyLevels,
			challengePointBasisLevel: tierStart,
			challengePointTierLabel: challengePointTierLabel(tierStart),
			challengePointBudget,
			challengePointPerCharacter: inferredParty.perCharacter,
			inferredChallengePointPartySize: inferredParty.partySize,
			inferredChallengePointPerCharacter: inferredParty.perCharacter,
			xpBudgetEquivalent: challengePointsToXp(challengePointBudget),
		};
	}

	if (input.mode === 'specific') {
		const normalizedLevels =
			input.specificPartyLevels
				?.map(sanitizePartyLevel)
				.filter((level) => Number.isFinite(level)) ?? [];

		if (normalizedLevels.length > 0) {
			const lowestLevel = Math.min(...normalizedLevels);
			const basisLevel = deriveChallengePointBasisFromLowestLevel(lowestLevel);
			const challengePointPerCharacter = normalizedLevels.map((level) =>
				challengePointsFromLevelDelta(level - basisLevel)
			);
			const challengePointBudget = challengePointPerCharacter.reduce(
				(sum, value) => sum + value,
				0
			);
			const inferredParty =
				inferPartyFromChallengePointBudget(challengePointBudget);

			return {
				effectivePartyLevel: lowestLevel,
				effectivePartySize: normalizedLevels.length,
				partyLevels: normalizedLevels,
				challengePointBasisLevel: basisLevel,
				challengePointTierLabel: challengePointTierLabel(basisLevel),
				challengePointBudget,
				challengePointPerCharacter,
				inferredChallengePointPartySize: inferredParty.partySize,
				inferredChallengePointPerCharacter: inferredParty.perCharacter,
				xpBudgetEquivalent: challengePointsToXp(challengePointBudget),
			};
		}
	}

	const simpleLevels = Array.from(
		{ length: fallbackSize },
		() => fallbackLevel
	);
	const basisLevel = deriveChallengePointBasisFromLowestLevel(fallbackLevel);
	const challengePointPerCharacter = simpleLevels.map((level) =>
		challengePointsFromLevelDelta(level - basisLevel)
	);
	const challengePointBudget = challengePointPerCharacter.reduce(
		(sum, value) => sum + value,
		0
	);
	const inferredParty =
		inferPartyFromChallengePointBudget(challengePointBudget);

	return {
		effectivePartyLevel: fallbackLevel,
		effectivePartySize: fallbackSize,
		partyLevels: simpleLevels,
		challengePointBasisLevel: basisLevel,
		challengePointTierLabel: challengePointTierLabel(basisLevel),
		challengePointBudget,
		challengePointPerCharacter,
		inferredChallengePointPartySize: inferredParty.partySize,
		inferredChallengePointPerCharacter: inferredParty.perCharacter,
		xpBudgetEquivalent: challengePointsToXp(challengePointBudget),
	};
}
