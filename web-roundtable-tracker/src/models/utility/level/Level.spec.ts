import { describe, it, expect } from 'vitest';
import { Level } from './Level';
import { LevelDifference } from './LevelDifference';
import { LevelRange } from './LevelRange';
import { TemplateSlot } from '@/models/templates/TemplateSlot.class';

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
    });

    describe('levelDifference class', () => {
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

        it('should return 0 experience for difference <= -7', () => {
            const diff = new LevelDifference(-7);
            const exp = diff.toExperience();
            expect(exp.valueOf()).toBe(0);
        });

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

        it('should return 0 for very small experience', () => {
            const diff = new LevelDifference(-7);
            const exp = diff.toExperience();
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

        describe('fromTemplateSlots', () => {
            it('should create a LevelRange from template slots with valid offsets and levels', () => {
                const slots: TemplateSlot[] = [
                    {
                        id: 'slot1',
                        name: 'Slot 1',
                        description: 'Description 1',
                        offset: new LevelDifference(2),
                        statblock: { level: new Level(5) },
                    },
                    {
                        id: 'slot2',
                        name: 'Slot 2',
                        description: 'Description 2',
                        offset: new LevelDifference(-1),
                        statblock: { level: new Level(10) },
                    },
                ];

                const range = LevelRange.fromTemplateSlots(slots, 0, 20);
                expect(typeof range.min).toBe('number');
                expect(typeof range.max).toBe('number');
            });

            it('should handle slots with undefined offsets or levels', () => {
                const slots: TemplateSlot[] = [
                    {
                        id: 'slot1',
                        name: 'Slot 1',
                        description: 'Description 1',
                        offset: undefined,
                        statblock: { level: new Level(5) },
                    },
                    {
                        id: 'slot2',
                        name: 'Slot 2',
                        description: 'Description 2',
                        offset: new LevelDifference(2),
                        statblock: undefined,
                    },
                ];

                const range = LevelRange.fromTemplateSlots(slots, 0, 20);
                expect(typeof range.min).toBe('number');
                expect(typeof range.max).toBe('number');
            });

            it('should handle empty slots array', () => {
                const slots: TemplateSlot[] = [];
                const range = LevelRange.fromTemplateSlots(slots, 0, 20);
                expect(typeof range.min).toBe('number');
                expect(typeof range.max).toBe('number');
            });

            it('should respect provided minLevel and maxLevel bounds', () => {
                const slots: TemplateSlot[] = [
                    {
                        id: 'slot1',
                        name: 'Slot 1',
                        description: 'Description 1',
                        offset: new LevelDifference(2),
                        statblock: { level: new Level(5) },
                    },
                ];

                const range = LevelRange.fromTemplateSlots(slots, 3, 15);
                expect(typeof range.min).toBe('number');
                expect(typeof range.max).toBe('number');
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