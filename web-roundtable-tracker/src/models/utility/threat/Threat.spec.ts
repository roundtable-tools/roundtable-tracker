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

	it('fromExpBudget should return the highest threat reached', () => {
		const threatFor = (xp: number, partySize = 4) =>
			Threat.fromExperienceBudget(new ExperienceBudget(xp), partySize).threat;

		expect(threatFor(0)).toBe(0); // Trivial
		expect(threatFor(40)).toBe(0); // Trivial
		expect(threatFor(59)).toBe(0); // Trivial, below the Low budget
		expect(threatFor(60)).toBe(1); // Low
		expect(threatFor(100)).toBe(3); // ModeratePlus
		expect(threatFor(110)).toBe(3); // ModeratePlus, Severe needs 120
		expect(threatFor(220)).toBe(9); // Extreme3Plus
		expect(threatFor(300)).toBe(10); // Impossible
		expect(threatFor(-40)).toBe(0); // allies outweigh enemies
	});

	it('fromExpBudget should scale the bands with party size', () => {
		const threatFor = (xp: number, partySize: number) =>
			Threat.fromExperienceBudget(
				new ExperienceBudget(xp),
				partySize
			).toLabel();

		// 3 PCs: Low 40, Moderate 60, Severe 90, Extreme 120
		expect(threatFor(39, 3)).toBe('Trivial');
		expect(threatFor(40, 3)).toBe('Low');
		expect(threatFor(60, 3)).toBe('Moderate');
		expect(threatFor(90, 3)).toBe('Severe');
		expect(threatFor(120, 3)).toBe('Extreme');
		// 6 PCs: Low 100, Moderate 120, Severe 180, Extreme 240
		expect(threatFor(99, 6)).toBe('Trivial');
		expect(threatFor(100, 6)).toBe('Low');
		expect(threatFor(120, 6)).toBe('Moderate');
		expect(threatFor(180, 6)).toBe('Severe');
		expect(threatFor(240, 6)).toBe('Extreme');
	});

	it('an empty encounter is Trivial for any party size', () => {
		for (const partySize of [1, 2, 3, 4, 5, 6, 8]) {
			expect(
				Threat.fromExperienceBudget(
					new ExperienceBudget(0),
					partySize
				).toLabel()
			).toBe('Trivial');
		}
	});

	it('thresholds never decrease, even for tiny parties', () => {
		for (const partySize of [1, 2, 3, 4, 5, 6, 8]) {
			const thresholds = Threat.thresholds(partySize);

			for (let i = 1; i < thresholds.length; i++) {
				expect(thresholds[i].minXp).toBeGreaterThanOrEqual(
					thresholds[i - 1].minXp
				);
			}
		}
	});
});
