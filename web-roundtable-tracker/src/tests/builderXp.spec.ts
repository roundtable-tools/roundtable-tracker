import { describe, expect, it } from 'vitest';
import {
	computeBuilderXP,
	computeEncounterXpUsage,
	computeThreat,
	type BuilderSlot,
} from '@/components/BuilderPage/builderXp';
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
		successesToDisable: 1,
		adjustment: 'none',
		isSimpleHazard: false,
		reinforcementRound: 1,
		eventRound: 1,
		repeatInterval: undefined,
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

	it('treats story accomplishment narrative slots as 0 XP', () => {
		const slots = [
			creature({ type: 'narrative', accomplishmentLevel: 'story', level: 5 }),
		];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(0);
	});

	it('awards accomplishment XP for narrative slots', () => {
		const slots = [
			creature({ type: 'narrative', accomplishmentLevel: 'minor' }),
			creature({ type: 'narrative', accomplishmentLevel: 'moderate' }),
			creature({ type: 'narrative', accomplishmentLevel: 'major' }),
		];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(120);
	});

	it('awards accomplishment XP for narrative slots with repeat interval', () => {
		const slots = [
			creature({
				type: 'narrative',
				accomplishmentLevel: 'moderate',
				repeatInterval: 2,
				eventRound: 3,
			}),
		];
		expect(computeBuilderXP(slots, 5).valueOf()).toBe(30);
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

describe('computeEncounterXpUsage', () => {
	it('uses immediate threat mapping when there is no reinforcement wave', () => {
		const usage = computeEncounterXpUsage([creature({ level: 5, count: 2 })], 5, 4);

		expect(usage.immediateXp.valueOf()).toBe(80);
		expect(usage.rawReinforcementXp.valueOf()).toBe(0);
		expect(usage.effectiveReinforcementXp.valueOf()).toBe(0);
		expect(usage.effectiveXp.valueOf()).toBe(80);
		expect(usage.simulation).toBeNull();
		expect(usage.waveInteraction.effectiveThreat.toLabel()).toBe('Moderate');
	});

	it('adds narrative accomplishment XP into immediate budget totals', () => {
		const usage = computeEncounterXpUsage(
			[
				creature({ level: 5, count: 2 }),
				creature({ type: 'narrative', accomplishmentLevel: 'minor' }),
			],
			5,
			4
		);

		expect(usage.immediateXp.valueOf()).toBe(90);
		expect(usage.rawReinforcementXp.valueOf()).toBe(0);
		expect(usage.rawXp.valueOf()).toBe(90);
		expect(usage.effectiveXp.valueOf()).toBe(90);
		expect(usage.simulation).toBeNull();
	});

	it('treats reinforcement slots with explicit empty participants as 0 XP', () => {
		const usage = computeEncounterXpUsage(
			[
				creature({ level: 5, count: 2 }),
				creature({
					type: 'reinforcement',
					level: 5,
					reinforcementRound: 3,
					reinforcementParticipants: [],
				}),
			],
			5,
			4
		);

		expect(usage.immediateXp.valueOf()).toBe(80);
		expect(usage.rawReinforcementXp.valueOf()).toBe(0);
		expect(usage.rawXp.valueOf()).toBe(80);
		expect(usage.effectiveXp.valueOf()).toBe(80);
		expect(usage.simulation).toBeNull();
	});

	it('simulates delayed reinforcements using round-by-round attrition and max rounded threat', () => {
		const slots = [
			creature({ type: 'creature', level: 5, count: 2 }),
			creature({ type: 'reinforcement', level: 5, reinforcementRound: 3 }),
		];

		const usage = computeEncounterXpUsage(slots, 5, 4);

		expect(usage.immediateXp.valueOf()).toBe(80);
		expect(usage.rawReinforcementXp.valueOf()).toBe(40);
		expect(usage.rawXp.valueOf()).toBe(120);
		expect(usage.effectiveReinforcementXp.valueOf()).toBe(40);
		expect(usage.effectiveXp.valueOf()).toBe(87);
		expect(usage.simulation?.maxThreatDisplayXp).toBe(90);

		const round1 = usage.simulation?.history[0];
		const round2 = usage.simulation?.history[1];
		const round3 = usage.simulation?.history[2];

		expect(round1?.wave0).toBe(80);
		expect(round1?.wave1).toBe(0);
		expect(round1?.attrition).toBeCloseTo(0, 5);
		expect(round1?.totalDisplay).toBe(80);

		expect(round2?.wave0).toBe(60);
		expect(round2?.wave1).toBe(0);
		expect(round2?.attrition).toBeCloseTo(4, 5);
		expect(round2?.totalDisplay).toBe(65);

		expect(round3?.wave0).toBe(40);
		expect(round3?.wave1).toBe(40);
		expect(round3?.attrition).toBeCloseTo(7.2, 5);
		expect(round3?.totalDisplay).toBe(90);
	});

	it('sums multiple reinforcement slots into the same wave budget', () => {
		const usage = computeEncounterXpUsage(
			[
				creature({ type: 'reinforcement', level: 5, count: 2, reinforcementRound: 2 }),
				creature({ type: 'reinforcement', level: 5, count: 1, reinforcementRound: 2 }),
			],
			5,
			4
		);

		// 3 total creatures at level 5 = 120 XP
		expect(usage.waves).toHaveLength(1);
		expect(usage.waves[0].round).toBe(2);
		expect(usage.waves[0].rawXp.valueOf()).toBe(120);
		expect(usage.waves[0].effectiveXp.valueOf()).toBe(120);
	});

	it('scales party output by party size during simulation', () => {
		const slots = [
			creature({ type: 'creature', level: 5, count: 2 }),
			creature({ type: 'reinforcement', level: 5, count: 1, reinforcementRound: 3 }),
		];

		const smallPartyUsage = computeEncounterXpUsage(slots, 5, 2);
		const largePartyUsage = computeEncounterXpUsage(slots, 5, 8);

		expect(smallPartyUsage.simulation?.maxThreatDisplayXp ?? 0).toBeGreaterThan(
			largePartyUsage.simulation?.maxThreatDisplayXp ?? 0
		);
	});
});

describe('Wave Interaction Threat', () => {
	it('increasing level increases wave 0 threat', () => {
		const baseUsage = computeEncounterXpUsage(
			[creature({ level: 5, count: 1 })],
			5
		);
		const strongerUsage = computeEncounterXpUsage(
			[creature({ level: 6, count: 1 })],
			5
		);

		expect(strongerUsage.waveInteraction.wave0.adjustedThreat.threat).toBeGreaterThan(
			baseUsage.waveInteraction.wave0.adjustedThreat.threat
		);
	});

	it('increasing participant count increases wave 0 threat', () => {
		const baseUsage = computeEncounterXpUsage(
			[creature({ level: 5, count: 1 })],
			5
		);
		const moreUsage = computeEncounterXpUsage(
			[creature({ level: 5, count: 2 })],
			5
		);

		expect(
			moreUsage.waveInteraction.wave0.adjustedThreat.threat
		).toBeGreaterThan(baseUsage.waveInteraction.wave0.adjustedThreat.threat);
	});

	it('adds a wave-1 model when reinforcement exists', () => {
		const baseUsage = computeEncounterXpUsage(
			[creature({ level: 5, count: 1 })],
			5
		);
		const moreUsage = computeEncounterXpUsage(
			[
				creature({ level: 5, count: 1 }),
				creature({ type: 'reinforcement', level: 5, count: 1, id: 'wave1' }),
			],
			5
		);

		expect(baseUsage.waveInteraction.wave1).toBeNull();
		expect(moreUsage.waveInteraction.wave1).not.toBeNull();
	});

	it('later reinforcement rounds reduce simulation max threat', () => {
		const earlyUsage = computeEncounterXpUsage(
			[
				creature({ level: 5, count: 1, id: 'wave0' }),
				creature({
					type: 'reinforcement',
					level: 5,
					count: 1,
					reinforcementRound: 2,
					id: 'wave1',
				}),
			],
			5
		);

		const lateUsage = computeEncounterXpUsage(
			[
				creature({ level: 5, count: 1, id: 'wave0' }),
				creature({
					type: 'reinforcement',
					level: 5,
					count: 1,
					reinforcementRound: 4,
					id: 'wave1',
				}),
			],
			5
		);

		expect(earlyUsage.simulation?.maxThreatDisplayXp ?? 0).toBeGreaterThan(
			lateUsage.simulation?.maxThreatDisplayXp ?? 0
		);
	});

	it('higher threat level has tighter coordination window', () => {
		// Moderate threat has threshold of 2 rounds
		const roundOneUsage = computeEncounterXpUsage(
			[
				creature({ level: 8, count: 1, id: 'wave0' }),
				creature({
					type: 'reinforcement',
					level: 8,
					count: 1,
					reinforcementRound: 1,
					id: 'wave1',
				}),
			],
			5
		);

		const roundTwoUsage = computeEncounterXpUsage(
			[
				creature({ level: 8, count: 1, id: 'wave0' }),
				creature({
					type: 'reinforcement',
					level: 8,
					count: 1,
					reinforcementRound: 2,
					id: 'wave1',
				}),
			],
			5
		);

		const roundThreeUsage = computeEncounterXpUsage(
			[
				creature({ level: 8, count: 1, id: 'wave0' }),
				creature({
					type: 'reinforcement',
					level: 8,
					count: 1,
					reinforcementRound: 3,
					id: 'wave1',
				}),
			],
			5
		);

		// For Moderate threat (level 8), threshold is 2 rounds
		expect(roundOneUsage.waveInteraction.roundDiffThreshold).toBe(2);
		expect(roundOneUsage.waveInteraction.affectsOtherWave).toBe(true); // diff=0, within 2
		expect(roundTwoUsage.waveInteraction.affectsOtherWave).toBe(true); // diff=1, within 2
		expect(roundThreeUsage.waveInteraction.affectsOtherWave).toBe(true); // diff=2, within threshold (2 <= 2 is true)

		const roundFourUsage = computeEncounterXpUsage(
			[
				creature({ level: 8, count: 1, id: 'wave0' }),
				creature({
					type: 'reinforcement',
					level: 8,
					count: 1,
					reinforcementRound: 4,
					id: 'wave1',
				}),
			],
			5
		);
		expect(roundFourUsage.waveInteraction.affectsOtherWave).toBe(false); // diff=3, outside threshold (3 > 2)
	});
});
