import { LevelDifference } from './LevelDifference';

export type LevelAdjustment =
	| 'weak'
	| 'elite'
	| 'elite-offense'
	| 'elite-defense'
	| 'none';

/**
 * The level a creature counts as after an adjustment. Used for both XP and
 * display, so the two always agree.
 *
 * - `elite` / `weak`: ±1 level, or ±2 where GM Core skips level 0.
 * - `elite-offense` (+0.75, +1.5 at level ≤ 0) and `elite-defense` (+0.5, +1):
 *   partial adjustments, a deliberate house rule counting part of an elite.
 * - `customModifier`: the custom adjustment's level modifier, added on top.
 */
export const getAdjustedLevel = (
	baseLevel: number,
	adjustment?: LevelAdjustment,
	customModifier?: number
): number => {
	const levelWithPreset = (() => {
		switch (adjustment) {
			case 'elite':
				return baseLevel + (baseLevel <= 0 ? 2 : 1);

			case 'weak':
				return baseLevel - (baseLevel === 1 ? 2 : 1);

			case 'elite-offense':
				return baseLevel + (baseLevel <= 0 ? 1.5 : 0.75);

			case 'elite-defense':
				return baseLevel + (baseLevel <= 0 ? 1 : 0.5);

			default:
				return baseLevel;
		}
	})();

	if (typeof customModifier === 'number' && Number.isFinite(customModifier)) {
		return levelWithPreset + customModifier;
	}

	return levelWithPreset;
};

export const formatAdjustedLevel = (value: number): string => {
	if (Number.isInteger(value)) {
		return `${value}`;
	}

	const lower = Math.floor(value);
	const upper = Math.ceil(value);
	const midpoint = (lower + upper) / 2;

	return value <= midpoint ? `${lower}(+)` : `${upper}(-)`;
};

export class Level extends Number {
	levelDifference(
		baseLevel: Level,
		adjustment?: LevelAdjustment
	): LevelDifference {
		const adjustedLevel = getAdjustedLevel(this.valueOf(), adjustment);

		return new LevelDifference(adjustedLevel - baseLevel.valueOf());
	}
}
