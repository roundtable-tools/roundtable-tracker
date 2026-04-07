import { LevelDifference } from "./LevelDifference";

export type LevelAdjustment =
    | "weak"
    | "elite"
    | "elite-offense"
    | "elite-defense"
    | "none";

export const getAdjustedLevel = (
    baseLevel: number,
    adjustment?: LevelAdjustment,
): number => {
    switch (adjustment) {
        case "elite":
            return baseLevel + (baseLevel <= 0 ? 2 : 1);
        case "weak":
            return baseLevel - (baseLevel === 1 ? 2 : 1);
        case "elite-offense":
            return baseLevel + (baseLevel <= 0 ? 1.5 : 0.75);
        case "elite-defense":
            return baseLevel + (baseLevel <= 0 ? 1 : 0.5);
        default:
            return baseLevel;
    }
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
    levelDifference(baseLevel: Level, adjustment?: LevelAdjustment): LevelDifference {
        const adjustedLevel = getAdjustedLevel(this.valueOf(), adjustment);

        return new LevelDifference(adjustedLevel - baseLevel.valueOf());
    }
}