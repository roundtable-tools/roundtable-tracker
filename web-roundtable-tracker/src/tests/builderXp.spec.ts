import { describe, expect, it } from 'vitest';
import { computeBuilderXP, computeThreat, type BuilderSlot } from '@/components/BuilderPage/builderXp';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';

function creature(overrides: Partial<BuilderSlot> = {}): BuilderSlot {
	return {
		id: 'test',
		type: 'creature',
		name: 'Test',
		description: '',
		side: 'enemy',
		level: 5,
		count: 1,
		adjustment: 'none',
		isSimpleHazard: false,
		reinforcementRound: 1,
		eventRound: 1,
		auraCycle: 1,
		...overrides,
	};
}

describe('computeBuilderXP', () => {
	it('returns 0 for empty slot list', () => {
		expect(computeBuilderXP([], 5).valueOf()).toBe(0);
	});

	it('returns 40 XP for a single enemy at party level', () => {
		const slots = [creature({ level: 5 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(40);
	});

	it('multiplies XP by count', () => {
		const slots = [creature({ level: 5, count: 3 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(120);
	});

	it('subtracts XP for allies (same level as party)', () => {
		const slots = [
			creature({ level: 5 }), // +40 enemy
			creature({ level: 5, side: 'ally' }), // -40 ally
		];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('ignores neutral side slots', () => {
		const slots = [creature({ level: 5, side: 'neutral' })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('ignores reinforcement type slots', () => {
		const slots = [creature({ type: 'reinforcement', level: 5 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('ignores narrative type slots', () => {
		const slots = [creature({ type: 'narrative', level: 5 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('ignores aura type slots', () => {
		const slots = [creature({ type: 'aura', level: 5 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('ignores slots with NaN level', () => {
		const slots = [creature({ level: NaN })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('returns 0 XP for enemy 5+ levels below party level', () => {
		// Level diff -5 → 0 XP (cutoff rule)
		const slots = [creature({ level: 0 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('awards XP for enemy exactly 4 levels below party level', () => {
		// Level diff -4 → non-zero XP
		const slots = [creature({ level: 1 })];
		expect(computeBuilderXP(slots, 5).valueOf()).toBeGreaterThan(0);
	});

	it('reduces XP for simple hazards', () => {
		const complex = computeBuilderXP([creature({ level: 5 })], 5).valueOf();
		const simple = computeBuilderXP(
			[creature({ level: 5, isSimpleHazard: true })],
			5
		).valueOf();
		expect(simple).toBeLessThan(complex);
	});

	it('applies elite adjustment (+1 level) to XP computation', () => {
		const base = computeBuilderXP([creature({ level: 5 })], 5).valueOf();
		const elite = computeBuilderXP(
			[creature({ level: 5, adjustment: 'elite' })],
			5
		).valueOf();
		expect(elite).toBeGreaterThan(base);
	});

	it('applies weak adjustment (-1 level) to XP computation', () => {
		const base = computeBuilderXP([creature({ level: 5 })], 5).valueOf();
		const weak = computeBuilderXP(
			[creature({ level: 5, adjustment: 'weak' })],
			5
		).valueOf();
		expect(weak).toBeLessThan(base);
	});

	it('sums multiple creature slots with mixed sides', () => {
		const slots = [
			creature({ level: 5, count: 2 }), // 2 enemies at party level: 80
			creature({ level: 5, side: 'ally', count: 1 }), // 1 ally at party level: -40
		];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(40);
	});
});

describe('computeThreat', () => {
	it('returns Trivial for 0 XP', () => {
		const threat = computeThreat(new ExperienceBudget(0), 4);
		expect(threat.toLabel()).toBe('Trivial');
	});

	it('returns Moderate for standard Moderate budget', () => {
		const threat = computeThreat(new ExperienceBudget(80), 4);
		expect(threat.toLabel()).toBe('Moderate');
	});
});
