import { Level } from './Level';

export class LevelRange {
	public min: number;
	public max: number;
	constructor(min: number, max: number) {
		this.min = min;
		this.max = max;
	}
	public static fromLevels(
		levels: Level[],
		minLevel = -1,
		maxLevel = 24
	): LevelRange {
		const [min, max] = levels.reduce<[number, number]>(
			([minAcc, maxAcc], level) => {
				const levelValue = level.valueOf();

				return [Math.min(minAcc, levelValue), Math.max(maxAcc, levelValue)];
			},
			[Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
		);

		return new LevelRange(Math.max(min, minLevel), Math.min(max, maxLevel));
	}
	toString(): string {
		return `${this.min} - ${this.max}`;
	}
}
