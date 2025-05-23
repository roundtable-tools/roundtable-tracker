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
    toExperience(simpleHazardModdifier:boolean = false): ExperienceBudget {
        if (this.value <= -7) {
            return new ExperienceBudget(0); // Default case for too low level difference
        }
        const baseCost = 40; // Base cost for equivalent levels
        const absMultiplier = Math.floor(1+Math.abs(this.value)/2) // Absolute value of level difference
        const oddMultipier = this.value % 2 === 0 ? 1 : Math.SQRT2; // Odd multiplier for odd level differences
        const getMultiplier = () => {
            switch (true) {
                case this.value > 0:
                    return Math.pow(2,oddMultipier) * absMultiplier;

                case this.value < 0:
                    return 1 / (Math.pow(2,oddMultipier) * absMultiplier);

                default:
                    return 1; // For level difference of 0
            }
        }
        const rawExp = baseCost * getMultiplier() / (simpleHazardModdifier ? 5 : 1); // Simple hazard modifier for smaller exp gain
        switch (true){
            case rawExp >= 10:
                return new ExperienceBudget(rawExp).round(10); // Round up to the nearest tens

            case rawExp >= 4.5:
                return new ExperienceBudget(rawExp).roundIfHigher(5) // Round up to the nearest int
                
            default:
                return new ExperienceBudget(0);
        }

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