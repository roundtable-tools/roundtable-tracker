import { describe, it, expect } from 'vitest';
import { formatAdjustedLevel, getAdjustedLevel, Level } from './Level';
import { LevelDifference } from './LevelDifference';
import { LevelRange } from './LevelRange';

describe('Level', () => {
    describe('constructor', () => {
        it('should initialize with a given value', () => {
            const level = new Level(5);
            expect(level.valueOf()).toBe(5);
        });

        it('should initialize with 0 if no value is provided', () => {
            const level = new Level();
            expect(level.valueOf()).toBe(0);
        });
    });

    describe('levelDifference', () => {
        it('should calculate the correct level difference for positive values', () => {
            const level1 = new Level(10);
            const level2 = new Level(5);
            const difference = level1.levelDifference(level2);
            expect(difference).toBeInstanceOf(LevelDifference);
            expect(difference.valueOf()).toBe(5);
        });

        it('should calculate the correct level difference for negative values', () => {
            const level1 = new Level(5);
            const level2 = new Level(10);
            const difference = level1.levelDifference(level2);
            expect(difference).toBeInstanceOf(LevelDifference);
            expect(difference.valueOf()).toBe(-5);
        });

        it('should calculate the correct level difference when one level is NaN', () => {
            const level1 = new Level(NaN);
            const level2 = new Level(10);
            const difference = level1.levelDifference(level2);
            expect(difference).toBeInstanceOf(LevelDifference);
            expect(difference.valueOf()).toBeNaN();
        });

        it('should calculate the correct level difference when both levels are NaN', () => {
            const level1 = new Level(NaN);
            const level2 = new Level(NaN);
            const difference = level1.levelDifference(level2);
            expect(difference).toBeInstanceOf(LevelDifference);
            expect(difference.valueOf()).toBeNaN();
        });

        it('should calculate level difference from adjusted level', () => {
            const creatureLevel = new Level(0);
            const partyLevel = new Level(0);
            const difference = creatureLevel.levelDifference(partyLevel, 'elite');

            expect(difference.valueOf()).toBe(2);
        });
    });

    describe('adjusted level helpers', () => {
        it('should apply elite/weak low-level special cases', () => {
            expect(getAdjustedLevel(0, 'elite')).toBe(2);
            expect(getAdjustedLevel(1, 'weak')).toBe(-1);
        });

        it('should format fractional levels as n(+) / n(-)', () => {
            expect(formatAdjustedLevel(10.5)).toBe('10(+)');
            expect(formatAdjustedLevel(10.6)).toBe('11(-)');
        });
    });

    describe('levelDifference class', () => {
        const xpByDifference = [
            { difference: -4, complexHazardXp: 10, simpleHazardXp: 2 },
            { difference: -3, complexHazardXp: 15, simpleHazardXp: 3 },
            { difference: -2, complexHazardXp: 20, simpleHazardXp: 4 },
            { difference: -1, complexHazardXp: 30, simpleHazardXp: 6 },
            { difference: 0, complexHazardXp: 40, simpleHazardXp: 8 },
            { difference: 1, complexHazardXp: 60, simpleHazardXp: 12 },
            { difference: 2, complexHazardXp: 80, simpleHazardXp: 16 },
            { difference: 3, complexHazardXp: 120, simpleHazardXp: 24 },
            { difference: 4, complexHazardXp: 160, simpleHazardXp: 32 },
        ] as const;

        it('should return correct string with sign', () => {
            expect(new LevelDifference(3).toString()).toBe('+3');
            expect(new LevelDifference(-2).toString()).toBe('-2');
            expect(new LevelDifference(0).toString()).toBe('+0');
        });

        it('should convert to Level correctly', () => {
            const diff = new LevelDifference(2);
            const base = 5;
            const level = diff.toLevel(base);
            expect(level.valueOf()).toBe(7);
        });

        it('should handle NaN in toLevel', () => {
            const diff = new LevelDifference(NaN);
            const base = 5;
            const level = diff.toLevel(base);
            expect(level.valueOf()).toBe(5);
        });

        it('should return correct valueOf', () => {
            expect(new LevelDifference(4).valueOf()).toBe(4);
        });

        it('should return 0 experience for difference below -4', () => {
            const diff = new LevelDifference(-5);
            const exp = diff.toExperience();
            expect(exp.valueOf()).toBe(0);
        });

        it('should still award XP at difference -4', () => {
            const diff = new LevelDifference(-4);
            const exp = diff.toExperience();
            expect(exp.valueOf()).toBeGreaterThan(0);
        });

        it.each(xpByDifference)(
            'should match complex hazard XP table at difference $difference',
            ({ difference, complexHazardXp }) => {
                const diff = new LevelDifference(difference);

                expect(diff.toExperience().valueOf()).toBe(complexHazardXp);
            }
        );

        it.each(xpByDifference)(
            'should match simple hazard XP table at difference $difference',
            ({ difference, simpleHazardXp }) => {
                const diff = new LevelDifference(difference);

                expect(diff.toExperience(false).valueOf()).toBe(simpleHazardXp);
            }
        );

        it('should return rounded experience for positive difference', () => {
            const diff = new LevelDifference(3);
            const exp = diff.toExperience();
            expect(exp.valueOf() % 10).toBe(0); // Rounded to nearest 10
            expect(exp.valueOf()).toBeGreaterThan(0);
        });

        it('should return rounded experience for negative difference', () => {
            const diff = new LevelDifference(-2);
            const exp = diff.toExperience();
            expect(exp.valueOf()).toBeGreaterThan(0);
        });

        it('should apply the simple hazard modifier', () => {
            const diff = new LevelDifference(0);
            const regularExp = diff.toExperience().valueOf();
            const simpleHazardExp = diff.toExperience(false).valueOf();

            expect(regularExp).toBe(40);
            expect(simpleHazardExp).toBe(8);
        });

        it('should return 0 for very low level differences', () => {
            const diff = new LevelDifference(-6);
            const exp = diff.toExperience();
            expect(exp.valueOf()).toBe(0);
        });

        it('should return 0 simple hazard XP for differences below -4', () => {
            const diff = new LevelDifference(-6);
            const exp = diff.toExperience(false);

            expect(exp.valueOf()).toBe(0);
        });
    });

    describe('LevelRange', () => {
        describe('constructor', () => {
            it('should initialize with given min and max values', () => {
                const range = new LevelRange(1, 10);
                expect(range.min).toBe(1);
                expect(range.max).toBe(10);
            });
        });

        describe('toString', () => {
            it('should return a string representation of the range', () => {
                const range = new LevelRange(1, 10);
                expect(range.toString()).toBe('1 - 10');
            });
        });
    });
});