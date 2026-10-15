import { describe, expect, it } from 'vitest';
import { ALL_NAV_PATHS, getRouteTitle, NAV_GROUPS } from './appNavigation';

describe('app navigation', () => {
	const groupedItems = NAV_GROUPS.flatMap((group) => group.items);

	it('lists every menu route exactly once', () => {
		expect(groupedItems.map((item) => item.url).sort()).toEqual(
			[...ALL_NAV_PATHS].sort()
		);
	});

	it('uses readable names instead of raw paths', () => {
		expect(groupedItems.map((item) => item.title)).toEqual([
			'Home',
			'Encounters',
			'Builder',
			'Parties',
			'Tracker',
			'Player view',
		]);

		for (const item of groupedItems) {
			expect(item.title).not.toContain('/');
		}
	});

	it('gives breadcrumb labels the same names as the menu', () => {
		for (const item of groupedItems) {
			expect(getRouteTitle(item.url)).toBe(item.title);
		}

		expect(getRouteTitle('/preview')).toBe('Preview');
		expect(getRouteTitle('__root__')).toBeUndefined();
		expect(getRouteTitle('toString')).toBeUndefined();
	});
});
