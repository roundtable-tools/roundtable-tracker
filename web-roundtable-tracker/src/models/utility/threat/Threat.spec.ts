import { describe, it, expect } from 'vitest';
import { Threat } from './Threat.class';
import { ExperienceBudget } from '../experienceBudget/ExperienceBudget';

describe('Threat', () => {
    it('should construct with correct properties', () => {
        const threat = new Threat({ threat: 2, level: 5 });
        expect(threat.threat).toBe(2);
        expect(threat.level).toBe(5);
    });

    it('toLabel should return correct label', () => {
        expect(new Threat({ threat: 0 }).toLabel()).toBe('Trivial');
        expect(new Threat({ threat: 3 }).toLabel()).toBe('Moderate+');
        expect(new Threat({ threat: 10 }).toLabel()).toBe('Impossible');
    });

    it('toProperty should return correct property string', () => {
        expect(new Threat({ threat: 3 }).toProperty()).toBe('ModeratePlus');
        expect(new Threat({ threat: 8 }).toProperty()).toBe('Extreme2Plus');
        expect(new Threat({ threat: 9 }).toProperty()).toBe('Extreme3Plus');
        expect(new Threat({ threat: 0 }).toProperty()).toBe('Trivial');
    });

    it('toString should return label and level', () => {
        const threat = new Threat({ threat: 2, level: 7 });
        expect(threat.toString()).toBe('Moderate (7)');
    });

    it('static getters should return correct Threat instances', () => {
        expect(Threat.Trivial.threat).toBe(0);
        expect(Threat.Low.threat).toBe(1);
        expect(Threat.ModeratePlus.threat).toBe(3);
        expect(Threat.Impossible.threat).toBe(10);
    });

    it('toExpBudget should return an ExpreirenceBudget', () => {
        const threat = Threat.Moderate;
        const budget = threat.toExpBudget(4);
        expect(budget).toBeInstanceOf(ExperienceBudget);
    });

    it('fromExpBudget should return correct Threat instance', () => {
        const budget = new ExperienceBudget(40);
        expect(Threat.fromExperienceBudget(budget, 4).threat).toBe(0); // Trivial
        expect(Threat.fromExperienceBudget(new ExperienceBudget(100), 4).threat).toBe(3); // ModeratePlus
        expect(Threat.fromExperienceBudget(new ExperienceBudget(220), 4).threat).toBe(9); // Extreme3Plus
        expect(Threat.fromExperienceBudget(new ExperienceBudget(300), 4).threat).toBe(10); // Impossible
    });
});