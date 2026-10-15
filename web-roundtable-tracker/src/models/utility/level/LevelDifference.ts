import { ExperienceBudget } from '../experienceBudget/ExperienceBudget';
import { Level } from './Level';

export class LevelDifference {
	public value: number;
	constructor(value?: number) {
		this.value = value ?? Number.NaN;
	}
	toString(): string {
		// render + sign if positive
		return `${this.value >= 0 ? '+' : ''}${this.value}`;
	}
	toExperience(isComplexHazard: boolean = true): ExperienceBudget {
		return ExperienceBudget.fromLevel(this.value, isComplexHazard);
	}
	valueOf(): number {
		return this.value;
	}
	toLevel(baseLevel: number): Level {
		if (isNaN(this.value)) {
			return new Level(baseLevel); // Default case for out-of-range differences or invalid levels
		}
		const level = baseLevel + this.value;

		return new Level(level);
	}
}
