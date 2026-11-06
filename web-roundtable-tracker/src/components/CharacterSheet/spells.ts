// Spells page data from Pathbuilder's spellCasters and focus entries.
// Spellcasting entries with the same tradition, attribute, proficiency and
// casting type (prepared or spontaneous) share one page (a cleric's "Cleric"
// and "Cleric Font"), as on the official sheet's page 4. Innate and focus
// spells join a page with the same tradition, attribute and proficiency of
// either casting type.

import {
	abilityMod,
	proficiencyBonus,
	type AbilityKey,
	type PathbuilderBuild,
} from './pathbuilder';

export type SpellInfo = { actions: string; rank: number; traits: string[] };

export type SpellRow = {
	name: string;
	rank: number;
	// The entry it comes from when the page merges several ("Font").
	source?: string;
};

export type SpellPage = {
	tradition: string;
	ability: AbilityKey;
	rank: number;
	prepared: boolean;
	attackKey: number;
	attackProf: number;
	attack: number;
	dc: number;
	cantripsPerDay?: number;
	// Spells per day for ranks 1-10, e.g. "3+4" when two entries add slots.
	slots: string[];
	cantrips: SpellRow[];
	spells: SpellRow[];
	focusSpells: string[];
	innate: { name: string; frequency: string }[];
};

// "Cleric Font" next to "Cleric" -> "Font".
function sourceLabel(first: string, name: string) {
	return name.startsWith(first) && name !== first
		? name.slice(first.length).trim()
		: name;
}

export function spellPages(build: PathbuilderBuild): SpellPage[] {
	const casters = build.spellCasters ?? [];
	const groups = new Map<string, SpellPage>();
	const firstName = new Map<string, string>();
	const keyOf = (
		tradition: string,
		ability: string,
		rank: number,
		prepared: boolean
	) => `${tradition.toLowerCase()}|${ability}|${rank}|${prepared}`;
	const pageFor = (
		tradition: string,
		ability: AbilityKey,
		rank: number,
		prepared: boolean
	) => {
		const key = keyOf(tradition, ability, rank, prepared);
		let page = groups.get(key);

		if (!page) {
			const attackKey = abilityMod(build.abilities[ability]);
			const attackProf = proficiencyBonus(rank, build.level);

			page = {
				tradition: tradition.toLowerCase(),
				ability,
				rank,
				prepared,
				attackKey,
				attackProf,
				attack: attackKey + attackProf,
				dc: 10 + attackKey + attackProf,
				slots: Array(10).fill(''),
				cantrips: [],
				spells: [],
				focusSpells: [],
				innate: [],
			};
			groups.set(key, page);
		}

		return page;
	};

	// The first page of either casting type, or a new prepared one.
	const anyPageFor = (tradition: string, ability: AbilityKey, rank: number) =>
		[...groups.values()].find(
			(page) =>
				page.tradition === tradition.toLowerCase() &&
				page.ability === ability &&
				page.rank === rank
		) ?? pageFor(tradition, ability, rank, true);

	// Regular entries first, so innate spells find their pages.
	const ordered = [
		...casters.filter((c) => !c.innate),
		...casters.filter((c) => c.innate),
	];

	for (const c of ordered) {
		const prepared = c.spellcastingType === 'prepared';
		const page = c.innate
			? anyPageFor(c.magicTradition, c.ability, c.proficiency)
			: pageFor(c.magicTradition, c.ability, c.proficiency, prepared);
		const lists = c.prepared?.length ? c.prepared : (c.spells ?? []);

		if (c.innate) {
			for (const l of lists)
				for (const name of l.list)
					page.innate.push({
						name,
						frequency: c.perDay?.[l.spellLevel]
							? `${c.perDay[l.spellLevel]}/day`
							: '',
					});
			continue;
		}

		const key = keyOf(c.magicTradition, c.ability, c.proficiency, prepared);

		if (!firstName.has(key)) firstName.set(key, c.name);
		const first = firstName.get(key) ?? c.name;
		const source = c.name === first ? undefined : sourceLabel(first, c.name);

		if (c.perDay?.[0] && page.cantripsPerDay === undefined)
			page.cantripsPerDay = c.perDay[0];
		c.perDay?.slice(1, 11).forEach((n, i) => {
			if (n) page.slots[i] = page.slots[i] ? `${page.slots[i]}+${n}` : `${n}`;
		});

		for (const l of lists)
			for (const name of l.list)
				(l.spellLevel === 0 ? page.cantrips : page.spells).push({
					name,
					rank: l.spellLevel,
					source,
				});
	}

	for (const [tradition, byAbility] of Object.entries(build.focus ?? {})) {
		for (const [ability, entry] of Object.entries(byAbility)) {
			const names = [
				...(entry.focusCantrips ?? []),
				...(entry.focusSpells ?? []),
			];

			if (names.length === 0) continue;
			const page = anyPageFor(
				tradition,
				ability as AbilityKey,
				entry.proficiency ?? 0
			);

			page.focusSpells.push(...names);
		}
	}

	return [...groups.values()];
}

// Every spell name on the character's spell pages, once each.
export function spellNames(build: PathbuilderBuild): string[] {
	const names = spellPages(build).flatMap((p) => [
		...p.cantrips.map((r) => r.name),
		...p.spells.map((r) => r.name),
		...p.focusSpells,
		...p.innate.map((r) => r.name),
	]);

	return names.filter((n, i) => names.indexOf(n) === i);
}
