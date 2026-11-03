// Where each item is carried, and its Bulk. Pathbuilder only knows containers,
// so held / worn / ready-on-belt / not-carried come from the player's choices
// (ItemOverrides), with defaults guessed from the export.
//
// Bulk is counted in tenths: light (L) = 1, 1 Bulk = 10.

import { lookupItem, type BulkValue } from './itemCatalog';
import { abilityMod, type PathbuilderBuild } from './pathbuilder';

export type ItemLocation =
	| 'held'
	| 'worn'
	| 'ready'
	| 'other'
	| `container:${string}`;

export type InventoryItem = {
	id: string;
	name: string;
	qty: number;
	kind: 'gear' | 'weapon' | 'armor';
	// Index in build.weapons, for a weapon.
	weaponIndex?: number;
	defaultLocation: ItemLocation;
	// Set on the item that is a container, e.g. the Backpack itself.
	containerId?: string;
};

export type ItemOverride = {
	location?: ItemLocation;
	// Typed Bulk: "L", "-", or a number. Empty means the catalog value.
	bulk?: string;
	// Id of the item this one is part of: the same thing listed twice
	// (marked cards that are the stance's "dagger") or an add-on such as a
	// shield augmentation. It follows that item and adds its Bulk to it.
	attachedTo?: string;
};

export type ItemOverrides = Record<string, ItemOverride>;

export type ResolvedItem = InventoryItem & {
	location: ItemLocation;
	// Bulk of one item (tenths), undefined when unknown.
	unitBulk?: number;
	// Bulk of all `qty` items (tenths); 0 when unknown.
	totalBulk: number;
	bulkKnown: boolean;
	hands?: number;
	traits?: string;
	// Set when this item is part of another one.
	attachedTo?: string;
	attachments: ResolvedItem[];
	// totalBulk plus the attachments' Bulk.
	bulkWithAttachments: number;
};

export const bulkToTenths = (bulk: BulkValue) =>
	bulk === 'L' ? 1 : Math.round(bulk * 10);

export function parseBulk(text: string): number | undefined {
	const t = text.trim().toUpperCase();

	if (t === '') return undefined;

	if (t === 'L') return 1;

	if (t === '-' || t === '—') return 0;
	const n = Number(t.replace(',', '.'));

	return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) : undefined;
}

export function formatBulk(tenths: number): string {
	if (tenths === 0) return '—';
	const whole = Math.floor(tenths / 10);
	const light = tenths % 10;

	if (whole === 0) return light === 1 ? 'L' : `${light}L`;

	return light ? `${whole}, ${light}L` : `${whole}`;
}

// Each item gets an id from its kind, name and how many earlier entries share
// that name, so placements survive a re-import of the same character.
export function buildInventory(build: PathbuilderBuild): InventoryItem[] {
	const containers = build.equipmentContainers ?? {};
	const seen = new Map<string, number>();
	const idFor = (kind: string, name: string) => {
		const key = `${kind}:${name}`;
		const n = seen.get(key) ?? 0;
		seen.set(key, n + 1);

		return `${key}#${n}`;
	};

	const containerItemIds = new Set<string>();
	const gear: InventoryItem[] = build.equipment.map(([name, qty, ...rest]) => {
		const inContainer = rest.find(
			(r): r is string => typeof r === 'string' && r in containers
		);
		const id = idFor('gear', name);
		const ownContainerId = inContainer
			? undefined
			: Object.keys(containers).find(
					(cid) =>
						containers[cid].containerName === name && !containerItemIds.has(cid)
				);

		if (ownContainerId) containerItemIds.add(ownContainerId);

		return {
			id,
			name,
			qty,
			kind: 'gear',
			containerId: ownContainerId,
			defaultLocation: inContainer
				? `container:${inContainer}`
				: ownContainerId
					? 'worn'
					: 'ready',
		};
	});

	// Unarmed attacks (a fist) aren't carried, so they aren't inventory.
	const weapons: InventoryItem[] = build.weapons.flatMap(
		(w, weaponIndex): InventoryItem[] => {
			if (w.prof === 'unarmed') return [];
			// "Deck of cards (Dagger)"; a display name that already names the
			// weapon ("Deck of Cards (dagger)") is used as it is.
			const named =
				!w.display ||
				w.display === w.name ||
				w.display.toLowerCase().includes(w.name.toLowerCase());

			return [
				{
					id: idFor('weapon', w.name),
					name: named ? (w.display ?? w.name) : `${w.display} (${w.name})`,
					qty: w.qty,
					kind: 'weapon',
					weaponIndex,
					defaultLocation: 'ready',
				},
			];
		}
	);

	const armor: InventoryItem[] = build.armor.map((a) => ({
		id: idFor('armor', a.name),
		name: a.name,
		qty: a.qty,
		kind: 'armor',
		defaultLocation: a.worn ? 'worn' : 'other',
	}));

	return [...weapons, ...armor, ...gear];
}

const baseName = (item: InventoryItem) =>
	item.name.replace(/^.*\((.+)\)$/, '$1');

export function resolveItems(
	items: InventoryItem[],
	overrides: ItemOverrides
): ResolvedItem[] {
	const resolved = items.map((item): ResolvedItem => {
		const o = overrides[item.id] ?? {};
		const catalog = lookupItem(item.name) ?? lookupItem(baseName(item));
		const typed = o.bulk !== undefined ? parseBulk(o.bulk) : undefined;
		const unitBulk =
			typed ?? (catalog ? bulkToTenths(catalog.bulk) : undefined);
		const per = catalog?.per ?? 1;
		const location = o.location ?? item.defaultLocation;
		// A worn backpack is negligible; carried or stowed it is light.
		const wornBackpack =
			item.containerId !== undefined &&
			location === 'worn' &&
			item.name === 'Backpack';
		const totalBulk =
			unitBulk === undefined || wornBackpack
				? 0
				: Math.ceil(item.qty / per) * unitBulk;

		return {
			...item,
			location,
			unitBulk,
			totalBulk,
			bulkKnown: unitBulk !== undefined,
			hands: catalog?.hands,
			traits: catalog?.traits,
			attachments: [],
			bulkWithAttachments: totalBulk,
		};
	});

	// Attach only to an item that isn't attached itself, so there are no
	// chains or cycles.
	const byId = new Map(resolved.map((i) => [i.id, i]));
	const parentOf = (item: ResolvedItem) => {
		const targetId = overrides[item.id]?.attachedTo;
		const target = targetId ? byId.get(targetId) : undefined;

		return target && target !== item && !overrides[target.id]?.attachedTo
			? target
			: undefined;
	};

	for (const item of resolved) {
		const parent = parentOf(item);

		if (!parent) continue;
		item.attachedTo = parent.id;
		item.location = parent.location;
		parent.attachments.push(item);
		parent.bulkWithAttachments += item.totalBulk;
	}

	return resolved;
}

// Items an item can be attached to: anything else that isn't attached. An
// item that already has attachments can't be attached itself.
export function attachTargets(
	items: ResolvedItem[],
	item: ResolvedItem
): ResolvedItem[] {
	if (item.attachments.length > 0) return [];

	return items.filter((i) => i.id !== item.id && !i.attachedTo);
}

export type InventoryGroup = {
	location: ItemLocation;
	title: string;
	hint: string;
	items: ResolvedItem[];
	contentBulk: number;
	// Bulk this group adds to what the character carries.
	countedBulk: number;
	capacity?: number;
};

const BACKPACK_FREE_TENTHS = 20;
const BACKPACK_CAPACITY_TENTHS = 40;

export function locationOptions(
	build: PathbuilderBuild
): { value: ItemLocation; label: string }[] {
	const containers = build.equipmentContainers ?? {};

	return [
		{ value: 'held', label: 'In hands' },
		{ value: 'worn', label: 'Worn' },
		{ value: 'ready', label: 'On belt / ready' },
		...Object.entries(containers).map(([id, c]) => ({
			value: `container:${id}` as ItemLocation,
			label: `In ${c.containerName}`,
		})),
		{ value: 'other', label: 'Not carried' },
	];
}

export function groupInventory(
	build: PathbuilderBuild,
	items: ResolvedItem[]
): InventoryGroup[] {
	const containers = build.equipmentContainers ?? {};
	const sum = (list: ResolvedItem[]) =>
		list.reduce((acc, i) => acc + i.bulkWithAttachments, 0);
	// Attached items are listed under the item they belong to.
	const at = (loc: ItemLocation) =>
		items.filter((i) => i.location === loc && !i.attachedTo);

	const fixed = (
		location: ItemLocation,
		title: string,
		hint: string,
		counted = true
	): InventoryGroup => {
		const list = at(location);

		return {
			location,
			title,
			hint,
			items: list,
			contentBulk: sum(list),
			countedBulk: counted ? sum(list) : 0,
		};
	};

	const containerGroups = Object.entries(containers).map(
		([id, c]): InventoryGroup => {
			const list = at(`container:${id}`);
			const contentBulk = sum(list);
			const counted = c.bagOfHolding
				? 0
				: c.backpack
					? Math.max(0, contentBulk - BACKPACK_FREE_TENTHS)
					: contentBulk;

			return {
				location: `container:${id}`,
				title: c.containerName,
				hint: c.bagOfHolding
					? 'Contents add no Bulk'
					: c.backpack
						? 'First 2 Bulk inside don’t count'
						: 'Stowed',
				items: list,
				contentBulk,
				countedBulk: counted,
				capacity: c.backpack ? BACKPACK_CAPACITY_TENTHS : undefined,
			};
		}
	);

	return [
		fixed('held', 'In hands', 'Ready to use'),
		fixed('worn', 'Worn', 'Armor, clothing, invested items'),
		fixed('ready', 'On belt / ready', 'Draw with 1 Interact'),
		...containerGroups,
		fixed('other', 'Not carried', 'Camp, mount, storage', false),
	];
}

export function bulkSummary(build: PathbuilderBuild, groups: InventoryGroup[]) {
	const carried = groups.reduce((acc, g) => acc + g.countedBulk, 0);
	const str = abilityMod(build.abilities.str);

	return {
		carried,
		// Light items count only in whole tens, so 9L is still 0 Bulk.
		carriedWhole: Math.floor(carried / 10),
		encumberedAt: 5 + str,
		max: 10 + str,
	};
}
