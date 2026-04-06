import { TemplateSlot } from "@/models/templates/TemplateSlot.class";
import { Level } from "./Level";
import { LevelDifference } from "./LevelDifference";

export class LevelRange {
    public min: number;
    public max: number;
    constructor(min: number, max: number) {
        this.min = min;
        this.max = max;
    }
    public static fromLevels(levels: Level[], minLevel = -1, maxLevel = 24): LevelRange {
        const [min, max] = levels.reduce<[number, number]>(
            ([minAcc, maxAcc], level) => {
                const levelValue = level.valueOf();

                return [Math.min(minAcc, levelValue), Math.max(maxAcc, levelValue)];
            },
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
        );
        
        return new LevelRange(Math.max(min, minLevel), Math.min(max, maxLevel));
    }
    static fromTemplateSlots(slots: TemplateSlot[], minLevel = -1, maxLevel = 24): LevelRange {

        const nonEmptyFirst = (e: [LevelDifference | undefined, Level | undefined]): e is [LevelDifference, Level | undefined] => e[0] !== undefined;
        const offsetBounds = slots.map(
            slot => [slot.offset, slot.statblock?.level] as [LevelDifference | undefined, Level | undefined]
        ).filter(nonEmptyFirst).reduce<[[number, number], [number, number]]>((acc, [offset, level]) => {
            const [offsetAcc, levelAcc] = acc;
            const [origin, bound] = [minLevel, maxLevel].map(v => v - offset?.valueOf());
            const levelBound = level !== undefined ? offset.toLevel(level.valueOf()).valueOf() : Number.NaN;

            if (origin > offsetAcc[0]) {
                offsetAcc[0] = origin;
            }

            if (bound < offsetAcc[1]) {
                offsetAcc[1] = bound;
            }

            if (levelAcc[0] > levelBound) {
                levelAcc[0] = levelBound;
            }

            if (levelAcc[1] < levelBound) {
                levelAcc[1] = levelBound;
            }
            
            return [offsetAcc, levelAcc];
        }, [
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY], 
            [Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]
        ])
        const [[x1, y1], [x2, y2]] = offsetBounds;

        return new LevelRange(Math.max(x1, x2), Math.min(y1, y2));
    }
    toString(): string {
        return `${this.min} - ${this.max}`;
    }
}