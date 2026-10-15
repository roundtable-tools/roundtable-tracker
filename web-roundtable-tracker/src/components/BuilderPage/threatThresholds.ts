const ADDITIONAL_IMPOSSIBLE_UNITS = 3;
const ADDITIONAL_TRIVIAL_UNITS = 1;

export type ThresholdGroup = {
	keys: number[];
	baseLabel: string;
	minXp: number;
	maxXp: number;
	color: string;
};

const CHARACTER_ADJUSTMENT_BY_THREAT: Record<string, number> = {
	Trivial: 10,
	Low: 20,
	Moderate: 20,
	Severe: 30,
	Extreme: 40,
	Impossible: 40,
};

function getBaseXpFromThreatKey(key: number): number {
	return 60 + key * 20;
}

function getCharacterAdjustmentForThreat(baseLabel: string): number {
	return CHARACTER_ADJUSTMENT_BY_THREAT[baseLabel] ?? 40;
}

function getAdjustedXpForThreat(
	threatKey: number,
	baseLabel: string,
	partySize: number
): number {
	const baseXp = getBaseXpFromThreatKey(threatKey);
	const adjustment = getCharacterAdjustmentForThreat(baseLabel);

	return Math.max(0, baseXp + adjustment * (partySize - 4));
}

export function getMergedThresholds(
	threatEntries: [number, string][],
	partySize: number
): ThresholdGroup[] {
	const colors = [
		'bg-green-400',
		'bg-lime-400',
		'bg-yellow-400',
		'bg-orange-400',
		'bg-red-400',
		'bg-gray-700',
	];

	type Group = { keys: number[]; baseLabel: string };
	const groups: Group[] = [];

	threatEntries.forEach(([key, label]) => {
		const base = label.replace(/(\+|-)+$/g, '').trim();
		let group = groups.find((g) => g.baseLabel === base);

		if (!group) {
			group = { keys: [], baseLabel: base };
			groups.push(group);
		}

		group.keys.push(key);
	});

	let previousMaxXp = 0;
	const merged = groups.map((group, i) => {
		const computedMaxXp = Math.max(
			...group.keys.map((key) =>
				getAdjustedXpForThreat(key, group.baseLabel, partySize)
			)
		);
		const maxXp = Math.max(computedMaxXp, previousMaxXp);
		const threshold: ThresholdGroup = {
			...group,
			minXp: previousMaxXp,
			maxXp: maxXp,
			color: colors[i % colors.length],
		};

		previousMaxXp = maxXp;

		return threshold;
	});

	if (merged.length > 0) {
		const firstThreshold = merged[0];
		const lastThreshold = merged[merged.length - 1];
		const firstAdjustment = getCharacterAdjustmentForThreat(
			firstThreshold.baseLabel
		);
		const lastAdjustment = getCharacterAdjustmentForThreat(
			lastThreshold.baseLabel
		);

		firstThreshold.minXp = Math.max(
			0,
			firstThreshold.minXp - firstAdjustment * ADDITIONAL_TRIVIAL_UNITS
		);
		lastThreshold.maxXp += lastAdjustment * ADDITIONAL_IMPOSSIBLE_UNITS;
	}

	return merged;
}
