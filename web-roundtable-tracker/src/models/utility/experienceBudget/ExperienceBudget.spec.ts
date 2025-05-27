import { describe, it, expect } from 'vitest';
import { ExperienceBudget } from './ExperienceBudget';

describe('ExpreirenceBudget', () => {
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

    it('budgetToBaseReward should scale and round XP', () => {
        const budget = new ExperienceBudget(100);
        expect(ExperienceBudget.budgetToBaseReward(budget, 4).valueOf()).toBe(100);
        expect(ExperienceBudget.budgetToBaseReward(budget, 5).valueOf()).toBe(80);
        expect(ExperienceBudget.budgetToBaseReward(budget, 6).valueOf()).toBe(60);
    });

    it('budgetToCharacterAdjustment should adjust and round XP', () => {
        const budget = new ExperienceBudget(100);
        expect(ExperienceBudget.budgetToCharacterAdjustment(budget, 4).valueOf()).toBe(30);
        expect(ExperienceBudget.budgetToCharacterAdjustment(budget, 5).valueOf()).toBe(20);
        expect(ExperienceBudget.budgetToCharacterAdjustment(budget, 6).valueOf()).toBe(20);
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