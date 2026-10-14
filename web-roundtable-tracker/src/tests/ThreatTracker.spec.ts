import { describe, it, expect } from 'vitest';
import { Threat } from '@/models/utility/threat/Threat.class';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { getMergedThresholds } from '@/components/BuilderPage/threatThresholds';
import {
	defaultFormValues,
	toConcreteEncounter,
} from '@/components/BuilderPage/builderConvert';
import type { BuilderSlot } from '@/components/BuilderPage/builderXp';
import { DIFFICULTY } from '@/store/data';

describe('getMergedThresholds', () => {
	it('produces monotonically increasing maxXp for party of 4', () => {
		const groups = getMergedThresholds(4);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].maxXp).toBeGreaterThanOrEqual(groups[i - 1].maxXp);
		}
	});

	it('no segment has negative width for party of 4', () => {
		const groups = getMergedThresholds(4);

		for (const g of groups) {
			expect(g.maxXp).toBeGreaterThanOrEqual(g.minXp);
		}
	});

	it('no segment has negative width for party of 1', () => {
		const groups = getMergedThresholds(1);

		for (const g of groups) {
			expect(g.maxXp).toBeGreaterThanOrEqual(g.minXp);
		}
	});

	it('produces monotonically increasing maxXp for party of 1', () => {
		const groups = getMergedThresholds(1);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].maxXp).toBeGreaterThanOrEqual(groups[i - 1].maxXp);
		}
	});

	it('no segment has negative width for party of 8', () => {
		const groups = getMergedThresholds(8);

		for (const g of groups) {
			expect(g.maxXp).toBeGreaterThanOrEqual(g.minXp);
		}
	});

	it('Trivial maxXp equals expected adjusted value for party of 4', () => {
		const groups = getMergedThresholds(4);
		const trivial = groups.find((g) => g.baseLabel === 'Trivial')!;
		// key baseline starts at 60 for Trivial
		expect(trivial.maxXp).toBe(60);
	});

	it('Trivial maxXp equals the Low budget for party of 3', () => {
		const groups = getMergedThresholds(3);
		const trivial = groups.find((g) => g.baseLabel === 'Trivial')!;
		// 60 + (20 * -1) = 40
		expect(trivial.maxXp).toBe(40);
	});

	it('Moderate+ uses the Moderate character adjustment', () => {
		// Moderate starts at 80 + 20 × 2 = 120, Severe at 120 + 30 × 2 = 180.
		const groups = getMergedThresholds(6);
		const moderate = groups.find((g) => g.baseLabel === 'Moderate')!;
		expect(moderate.minXp).toBe(120);
		expect(moderate.maxXp).toBe(180);
		expect(
			Threat.fromExperienceBudget(new ExperienceBudget(140), 6).toLabel()
		).toBe('Moderate+');
	});

	it('all groups are present regardless of party size', () => {
		const expected = [
			'Trivial',
			'Low',
			'Moderate',
			'Severe',
			'Extreme',
			'Impossible',
		];

		for (const size of [1, 2, 3, 4, 5, 6, 8]) {
			const groups = getMergedThresholds(size);

			for (const label of expected) {
				expect(groups.some((g) => g.baseLabel === label)).toBe(true);
			}
		}
	});

	it('segments are contiguous (no gaps or overlaps) for party of 4', () => {
		const groups = getMergedThresholds(4);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].minXp).toBe(groups[i - 1].maxXp);
		}
	});

	it('segments are contiguous (no gaps or overlaps) for party of 1', () => {
		const groups = getMergedThresholds(1);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].minXp).toBe(groups[i - 1].maxXp);
		}
	});

	it('segments are contiguous (no gaps or overlaps) for party of 8', () => {
		const groups = getMergedThresholds(8);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].minXp).toBe(groups[i - 1].maxXp);
		}
	});
});

const DIFFICULTY_BY_BASE_LABEL: Record<string, number> = {
	Trivial: DIFFICULTY.Trivial,
	Low: DIFFICULTY.Low,
	Moderate: DIFFICULTY.Moderate,
	Severe: DIFFICULTY.Severe,
	Extreme: DIFFICULTY.Extreme,
	// The saved difficulty has no Impossible; it is stored as Extreme.
	Impossible: DIFFICULTY.Extreme,
};

function lackeys(count: number): BuilderSlot[] {
	// A creature 4 levels below the party is worth 10 XP.
	return [
		{
			id: 'lackeys',
			type: 'creature',
			name: 'Lackey',
			description: '',
			side: 'enemy',
			level: 1,
			count,
			successesToDisable: 1,
			adjustment: 'none',
			isSimpleHazard: false,
			reinforcementRound: 1,
			eventRound: 1,
		},
	];
}

describe('threat bar and saved difficulty', () => {
	for (const partySize of [3, 4, 5, 6]) {
		it(`agree for every XP total from 0 to 400 for party of ${partySize}`, () => {
			const groups = getMergedThresholds(partySize);

			for (let count = 0; count <= 40; count += 1) {
				const xp = count * 10;
				const threat = Threat.fromExperienceBudget(
					new ExperienceBudget(xp),
					partySize
				);
				const baseLabel = threat.toLabel().replace(/\++$/, '');
				const segment = groups.find(
					(g, i) => xp >= g.minXp && (i === groups.length - 1 || xp < g.maxXp)
				);
				const saved = toConcreteEncounter({
					...defaultFormValues(),
					partyLevel: 5,
					partySize,
					slots: lackeys(count),
				});

				expect(segment?.baseLabel, `${xp} XP`).toBe(baseLabel);
				expect(saved.difficulty, `${xp} XP`).toBe(
					DIFFICULTY_BY_BASE_LABEL[baseLabel]
				);
			}
		});
	}

	it('uses the highest band reached for 4 PCs', () => {
		const labelFor = (xp: number) =>
			Threat.fromExperienceBudget(new ExperienceBudget(xp), 4).toLabel();

		expect(labelFor(0)).toBe('Trivial');
		expect(labelFor(50)).toBe('Trivial');
		expect(labelFor(60)).toBe('Low');
		expect(labelFor(110)).toBe('Moderate+');
		expect(labelFor(119)).toBe('Moderate+');
		expect(labelFor(120)).toBe('Severe');
		expect(labelFor(160)).toBe('Extreme');
	});
});
