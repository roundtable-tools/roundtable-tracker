import { describe, it, expect } from 'vitest';
import { THREAT_TYPE } from '@/models/utility/threat/Threat.class';
import { getMergedThresholds } from '@/components/BuilderPage/ThreatTracker';

function threatEntries(): [number, string][] {
	const entries = Object.entries(THREAT_TYPE).map(([key, label]) => [
		parseInt(key),
		label,
	]) as [number, string][];

	return entries;
}

describe('getMergedThresholds', () => {
	it('produces monotonically increasing maxXp for party of 4', () => {
		const groups = getMergedThresholds(threatEntries(), 4);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].maxXp).toBeGreaterThanOrEqual(groups[i - 1].maxXp);
		}
	});

	it('no segment has negative width for party of 4', () => {
		const groups = getMergedThresholds(threatEntries(), 4);

		for (const g of groups) {
			expect(g.maxXp).toBeGreaterThanOrEqual(g.minXp);
		}
	});

	it('no segment has negative width for party of 1', () => {
		const groups = getMergedThresholds(threatEntries(), 1);

		for (const g of groups) {
			expect(g.maxXp).toBeGreaterThanOrEqual(g.minXp);
		}
	});

	it('produces monotonically increasing maxXp for party of 1', () => {
		const groups = getMergedThresholds(threatEntries(), 1);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].maxXp).toBeGreaterThanOrEqual(groups[i - 1].maxXp);
		}
	});

	it('no segment has negative width for party of 8', () => {
		const groups = getMergedThresholds(threatEntries(), 8);

		for (const g of groups) {
			expect(g.maxXp).toBeGreaterThanOrEqual(g.minXp);
		}
	});

	it('Trivial maxXp equals expected adjusted value for party of 4', () => {
		const groups = getMergedThresholds(threatEntries(), 4);
		const trivial = groups.find((g) => g.baseLabel === 'Trivial')!;
		// key baseline starts at 60 for Trivial
		expect(trivial.maxXp).toBe(60);
	});

	it('Trivial maxXp equals expected adjusted value for party of 1', () => {
		const groups = getMergedThresholds(threatEntries(), 1);
		const trivial = groups.find((g) => g.baseLabel === 'Trivial')!;
		// 60 + (10 * -3) = 30
		expect(trivial.maxXp).toBe(30);
	});

	it('all groups are present regardless of party size', () => {
		const expected = ['Trivial', 'Low', 'Moderate', 'Severe', 'Extreme', 'Impossible'];

		for (const size of [1, 2, 3, 4, 5, 6, 8]) {
			const groups = getMergedThresholds(threatEntries(), size);

			for (const label of expected) {
				expect(groups.some((g) => g.baseLabel === label)).toBe(true);
			}
		}
	});

	it('segments are contiguous (no gaps or overlaps) for party of 4', () => {
		const groups = getMergedThresholds(threatEntries(), 4);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].minXp).toBe(groups[i - 1].maxXp);
		}
	});

	it('segments are contiguous (no gaps or overlaps) for party of 1', () => {
		const groups = getMergedThresholds(threatEntries(), 1);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].minXp).toBe(groups[i - 1].maxXp);
		}
	});

	it('segments are contiguous (no gaps or overlaps) for party of 8', () => {
		const groups = getMergedThresholds(threatEntries(), 8);

		for (let i = 1; i < groups.length; i++) {
			expect(groups[i].minXp).toBe(groups[i - 1].maxXp);
		}
	});
});
