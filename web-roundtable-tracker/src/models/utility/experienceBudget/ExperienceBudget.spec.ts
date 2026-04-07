import { describe, it, expect } from 'vitest';
import { ExperienceBudget } from './ExperienceBudget';

describe('ExpreirenceBudget', () => {
    const threatLevels = [
        { name: 'Trivial', budget: ExperienceBudget.Trivial, adjustment: 10 },
        { name: 'Low', budget: ExperienceBudget.Low, adjustment: 20 },
        { name: 'Moderate', budget: ExperienceBudget.Moderate, adjustment: 20 },
        { name: 'ModeratePlus', budget: ExperienceBudget.ModeratePlus, adjustment: 30 },
        { name: 'Severe', budget: ExperienceBudget.Severe, adjustment: 30 },
        { name: 'SeverePlus', budget: ExperienceBudget.SeverePlus, adjustment: 40 },
        { name: 'Extreme', budget: ExperienceBudget.Extreme, adjustment: 40 },
        { name: 'ExtremePlus', budget: ExperienceBudget.ExtremePlus, adjustment: 50 },
        { name: 'Extreme2Plus', budget: ExperienceBudget.Extreme2Plus, adjustment: 50 },
        { name: 'Extreme3Plus', budget: ExperienceBudget.Extreme3Plus, adjustment: 60 },
        { name: 'Impossible', budget: ExperienceBudget.Impossible, adjustment: 60 }
    ];

    it('should construct and round value', () => {
        const budget = new ExperienceBudget(42.7);
        expect(budget.valueOf()).toBe(43);
    });

    it('toString should return correct string', () => {
        const budget = new ExperienceBudget(50);
        expect(budget.toString()).toBe('50 XP');
    });

    it('limit should clamp value within min and max', () => {
        const budget = new ExperienceBudget(100);
        expect(budget.limit({ min: 50, max: 80 }).valueOf()).toBe(80);
        expect(budget.limit({ min: 120 }).valueOf()).toBe(120);
        expect(budget.limit({ max: 90 }).valueOf()).toBe(90);
    });

    it('round should round to nearest base', () => {
        const budget = new ExperienceBudget(87);
        expect(budget.round(10).valueOf()).toBe(90);
        expect(budget.round(20).valueOf()).toBe(80);
    });

    it('roundIfHigher should round only if value is higher than base', () => {
        const budget1 = new ExperienceBudget(25);
        expect(budget1.roundIfHigher(20).valueOf()).toBe(20);
        const budget2 = new ExperienceBudget(8);
        expect(budget2.roundIfHigher(10).valueOf()).toBe(8);
    });

    it('budgetToBaseReward should preserve base reward where adjusted values are uniquely invertible', () => {
        for (let partySize = 1; partySize <= 8; partySize += 1) {
            const scenarios = threatLevels.map((threat) => ({
                ...threat,
                adjustedBudget: threat.budget.valueOf() + (partySize - 4) * threat.adjustment
            }));

            const collisions = new Map<number, number>();
            for (const scenario of scenarios) {
                collisions.set(scenario.adjustedBudget, (collisions.get(scenario.adjustedBudget) ?? 0) + 1);
            }

            for (const scenario of scenarios) {
                const baseReward = ExperienceBudget.budgetToBaseReward(
                    new ExperienceBudget(scenario.adjustedBudget),
                    partySize
                );

                if ((collisions.get(scenario.adjustedBudget) ?? 0) === 1) {
                    expect(
                        baseReward.valueOf(),
                        `${scenario.name} at party size ${partySize}`
                    ).toBe(scenario.budget.valueOf());
                }
            }
        }
    });

    it('budgetToBaseReward should choose the nearest matching base reward for overlapping scenarios', () => {
        expect(ExperienceBudget.budgetToBaseReward(new ExperienceBudget(0), 1).valueOf()).toBe(60);
        expect(ExperienceBudget.budgetToBaseReward(new ExperienceBudget(20), 2).valueOf()).toBe(40);
    });

    it('budgetToCharacterAdjustment should match table ranges', () => {
        expect(ExperienceBudget.budgetToCharacterAdjustment(new ExperienceBudget(20)).valueOf()).toBe(5);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Trivial).valueOf()).toBe(10);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Low).valueOf()).toBe(20);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Moderate).valueOf()).toBe(20);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.ModeratePlus).valueOf()).toBe(30);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Severe).valueOf()).toBe(30);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.SeverePlus).valueOf()).toBe(40);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Extreme).valueOf()).toBe(40);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.ExtremePlus).valueOf()).toBe(50);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Extreme2Plus).valueOf()).toBe(50);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Extreme3Plus).valueOf()).toBe(60);
        expect(ExperienceBudget.budgetToCharacterAdjustment(ExperienceBudget.Impossible).valueOf()).toBe(60);
    });

    it('static getters should return correct values', () => {
        expect(ExperienceBudget.Trivial.valueOf()).toBe(40);
        expect(ExperienceBudget.Low.valueOf()).toBe(60);
        expect(ExperienceBudget.Moderate.valueOf()).toBe(80);
        expect(ExperienceBudget.ModeratePlus.valueOf()).toBe(100);
        expect(ExperienceBudget.Severe.valueOf()).toBe(120);
        expect(ExperienceBudget.SeverePlus.valueOf()).toBe(140);
        expect(ExperienceBudget.Extreme.valueOf()).toBe(160);
        expect(ExperienceBudget.ExtremePlus.valueOf()).toBe(180);
        expect(ExperienceBudget.Extreme2Plus.valueOf()).toBe(200);
        expect(ExperienceBudget.Extreme3Plus.valueOf()).toBe(220);
        expect(ExperienceBudget.Impossible.valueOf()).toBe(240);
    });
});