import { ExperienceBudget } from "../experienceBudget/ExperienceBudget";
import { Level } from "./Level";

export class LevelDifference {
    public value: number;
    constructor(value?: number) {
        this.value = value ?? Number.NaN;
    }
    toString(): string { // render + sign if positive
        return `${this.value >= 0 ? '+' : ''}${this.value}`;
    }
    toExperience(isComplexHazard: boolean = true): ExperienceBudget {
        if (this.value < -4) {
            return new ExperienceBudget(0);
        }

        const baseCost = 40;
        const isSimpleHazard = isComplexHazard === false;
        const difference = Math.trunc(this.value);

        const multiplier = (() => {
            if (difference === 0) return 1;

            if (difference > 0) {
                if (difference % 2 === 0) {
                    return Math.pow(2, difference / 2);
                }

                return 1.5 * Math.pow(2, (difference - 1) / 2);
            }

            const absoluteDifference = Math.abs(difference);
            if (absoluteDifference % 2 === 0) {
                return 1 / Math.pow(2, absoluteDifference / 2);
            }

            return 0.75 / Math.pow(2, (absoluteDifference - 1) / 2);
        })();

        const complexHazardXp = baseCost * multiplier;
        const finalXp = isSimpleHazard ? complexHazardXp / 5 : complexHazardXp;

        return new ExperienceBudget(finalXp);
    }
    valueOf(): number {
        return this.value;
    }
    toLevel(baseLevel: number): Level {
        if (isNaN(this.value)) {
            return new Level(baseLevel); // Default case for out-of-range differences or invalid levels
        }
        const level = baseLevel + this.value;
        
        return new Level(level)
    }
}