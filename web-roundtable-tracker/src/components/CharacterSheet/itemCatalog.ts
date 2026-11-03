// Bulk, hands, traits, weapon type and range, and armor stats of items.
// Pathbuilder's export has none of these. They come from Archive of Nethys
// (data/pf2eItemStats.json, built by scripts/generate-pf2e-actions.py), with a
// few hand-written overrides where AoN's numbers don't fit the sheet. Items
// missing from both get their Bulk typed in on the sheet page.

import statsJson from './data/pf2eItemStats.json?raw';

export type BulkValue = number | 'L';

export type ArmorStats = {
	category: 'unarmored' | 'light' | 'medium' | 'heavy';
	ac: number;
	dexCap: number;
	// Strength value as an attribute modifier (Player Core lists "Strength +2").
	strength: number;
	checkPenalty: number;
	// Feet, 0 or negative.
	speedPenalty: number;
	flexible?: boolean;
};

export type CatalogItem = {
	bulk: BulkValue;
	// How many items share one Bulk value (e.g. 10 arrows are light).
	per?: number;
	hands?: number;
	traits?: string;
	weaponType?: 'melee' | 'ranged';
	// Range increment of a ranged weapon, e.g. "20 ft.".
	range?: string;
	armor?: ArmorStats;
	// A shield's AC bonus when raised, Hardness, Hit Points and Broken
	// Threshold.
	shield?: { ac: number; hardness: number; hp: number; bt: number };
};

const GENERATED = JSON.parse(statsJson) as Record<string, CatalogItem>;

// Where the sheet needs something other than AoN's entry.
const OVERRIDES: Record<string, Partial<CatalogItem>> = {
	// AoN lists a worn backpack's negligible Bulk; the inventory treats a worn
	// backpack as negligible itself and needs the carried value.
	backpack: { bulk: 'L' },
	// AoN writes the hands of toolkits as "-1" (worn: 1, held: 2).
	"thieves' toolkit": { hands: 2 },
	"thieves' tools": { bulk: 'L', hands: 2 },
	'repair kit': { bulk: 1, hands: 2 },
};

export function lookupItem(name: string): CatalogItem | undefined {
	const key = name.toLowerCase().replace(/[‘’]/g, "'").trim();
	const generated = GENERATED[key];
	const override = OVERRIDES[key];

	if (!generated && !override) return undefined;

	return {
		...generated,
		...override,
		bulk: override?.bulk ?? generated?.bulk ?? 0,
	};
}
