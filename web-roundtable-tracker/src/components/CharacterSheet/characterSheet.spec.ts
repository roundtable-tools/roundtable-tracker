import { describe, expect, it } from 'vitest';

import {
	buildInventory,
	bulkSummary,
	formatBulk,
	groupInventory,
	parseBulk,
	resolveItems,
} from './inventory';
import {
	actionGlyphs,
	actionOptions,
	characterTraits,
	chosenCards,
	type ActionData,
} from './actions';
import {
	deriveSheet,
	parsePathbuilderJson,
	PathbuilderParseError,
	splitBackground,
} from './pathbuilder';
import clericJson from './sampleHumanCleric.json?raw';
import kineticistJson from './sampleSylphKineticist.json?raw';
import { spellNames, spellPages } from './spells';
import {
	descriptionOptions,
	isDescriptionChosen,
	classDetailsOf,
	traitKey,
	type RefEntry,
	type ReferenceData,
} from './reference';
import sampleJson from './sampleRatfolkRogue.json?raw';

const build = parsePathbuilderJson(sampleJson);
const BACKPACK = 'container:a7d270ea-ec6f-4068-87bf-376e8d3a801b';

describe('deriveSheet (level 2 ratfolk rogue)', () => {
	const sheet = deriveSheet(build);

	it('adds level to trained proficiency and attribute modifiers', () => {
		const byLabel = Object.fromEntries(
			sheet.skills.map((s) => [s.label, s.total])
		);
		// Leather armor's -1 check penalty hits Str/Dex skills: the
		// character's Str +0 requirement isn't met with Str -1.
		expect(byLabel.Thievery).toBe(9); // dex +4, expert 4 + level 2, -1
		expect(byLabel.Athletics).toBe(2); // str -1, trained 2 + 2, -1
		expect(byLabel.Acrobatics).toBe(7);
		expect(byLabel.Stealth).toBe(7);
		expect(byLabel.Diplomacy).toBe(3); // cha +3, untrained
		expect(byLabel.Arcana).toBe(6); // no penalty on Int skills
		expect(sheet.lores.map((l) => [l.label, l.total])).toEqual([['Games', 6]]);
	});

	it('puts feats on their level rows', () => {
		const [one, two] = sheet.levels;
		expect(one.left.map((f) => f.name)).toEqual([
			'Lie to Me',
			'Shadow Rat',
			'Vicious Critique',
			'Tinkering Fingers',
		]);
		expect(one.right.map((f) => f.name)).toEqual(["You're Next"]);
		expect(two.left.map((f) => f.name)).toEqual(['Wary Disarmament']);
		expect(two.right.map((f) => f.name)).toEqual(["Card Sharp's Fourberie"]);
		expect(sheet.levels).toHaveLength(20);
	});

	it('adds a ranged option for thrown weapons, with Dex to hit and to damage for a thief', () => {
		const thrown = sheet.strikes.find(
			(s) => s.ranged && s.baseName === 'Dagger'
		);
		expect(thrown).toMatchObject({
			attack: 8, // dex +4, trained 2 + level 2
			damage: '1d4+4', // thief racket: Dex to damage, also when thrown
			range: '10 ft.',
			weaponIndex: 0,
		});
		expect(sheet.strikes.filter((s) => s.baseName === 'Rapier')).toHaveLength(
			1
		);
	});

	it('gives every strike a stable key for the on/off choice', () => {
		expect(sheet.strikes.map((s) => s.key)).toEqual([
			'weapon:0:melee',
			'weapon:0:ranged',
			'weapon:1:ranged',
			'weapon:2:melee',
			'weapon:3:melee',
		]);
	});

	it('treats a ranged weapon with Thrown as one ranged strike', () => {
		const darts = sheet.strikes.filter((s) => s.baseName === 'Dart');
		expect(darts).toHaveLength(1);
		expect(darts[0]).toMatchObject({
			ranged: true,
			range: '20 ft.',
			attack: 8,
			damage: '1d4-1',
			traits: 'Agile, Thrown',
		});
	});

	it('adds a fist when the build has no unarmed attack', () => {
		const noFist = deriveSheet({
			...build,
			weapons: build.weapons.filter((w) => w.prof !== 'unarmed'),
		});
		expect(noFist.strikes.filter((s) => s.name === 'Fist')).toHaveLength(1);
		expect(sheet.strikes.filter((s) => s.name === 'Fist')).toHaveLength(1);
		expect(noFist.strikes.at(-1)).toMatchObject({
			key: 'fist',
			name: 'Fist',
			attack: 8,
			damage: '1d4+4', // finesse unarmed, thief racket adds Dex
			damageType: 'B',
			traits: 'Agile, Finesse, Nonlethal, Unarmed',
		});
	});

	it('computes defenses, HP and class DC', () => {
		expect(sheet.ac.acTotal).toBe(19);
		expect(sheet.saves.map((s) => s.total)).toEqual([5, 10, 6]);
		expect(sheet.perception.total).toBe(6);
		expect(sheet.hpMax).toBe(6 + (8 + 1) * 2);
		expect(sheet.classDc.total).toBe(10 + 4 + 4);
		expect(sheet.speed).toBe(25);
	});

	it('derives AC from the worn armor when the export has no total', () => {
		// Leather (+1, Dex cap 4) for the rogue, chain mail (+4, Dex cap 1)
		// for the cleric: the same numbers Pathbuilder exports.
		for (const json of [sampleJson, clericJson]) {
			const exported = parsePathbuilderJson(json);
			const derived = deriveSheet({ ...exported, acTotal: undefined }).ac;
			expect(derived).toEqual({ ...exported.acTotal, shieldBonus: null });
		}
	});

	it('rejects an export without abilities, attributes or proficiencies', () => {
		for (const key of ['abilities', 'attributes', 'proficiencies']) {
			const broken = JSON.parse(sampleJson);
			broken.build[key] = null;
			expect(() => parsePathbuilderJson(JSON.stringify(broken))).toThrow(
				PathbuilderParseError
			);
		}
	});

	it('shows the custom weapon name and damage', () => {
		expect(sheet.strikes[0]).toMatchObject({
			name: 'Deck of Cards (dagger)',
			baseName: 'Dagger',
			attack: 8,
			ability: 'dex',
			abilityPart: 4,
			profPart: 4,
			damage: '1d4+4',
			damageType: 'P',
			ranged: false,
		});
	});
});

describe('inventory', () => {
	it('parses and formats Bulk in tenths', () => {
		expect(parseBulk('L')).toBe(1);
		expect(parseBulk('-')).toBe(0);
		expect(parseBulk('1,5')).toBe(15);
		expect(parseBulk('')).toBeUndefined();
		expect(formatBulk(23)).toBe('2, 3L');
		expect(formatBulk(1)).toBe('L');
	});

	it('puts items into Pathbuilder containers and guesses the rest', () => {
		const items = resolveItems(buildInventory(build), {});
		const where = (name: string) =>
			items.find((i) => i.name.startsWith(name))?.location;
		expect(where('Torch')).toBe(BACKPACK);
		expect(where('Backpack')).toBe('worn');
		expect(where('Leather Armor')).toBe('worn');
		expect(where('Rapier')).toBe('ready');
		expect(where('Marked Playing Cards')).toBe('ready');
	});

	it('counts nothing inside a backpack that is not carried', () => {
		const inventory = buildInventory(build);
		const pack = inventory.find((i) => i.name === 'Backpack')!;
		const groups = groupInventory(
			build,
			resolveItems(inventory, { [pack.id]: { location: 'other' } })
		);
		const backpack = groups.find((g) => g.location === BACKPACK)!;
		expect(backpack.contentBulk).toBe(21);
		expect(backpack.countedBulk).toBe(0);
		expect(backpack.hint).toBe('Not carried');
	});

	it('lets the first 2 Bulk in a worn backpack go uncounted', () => {
		const inventory = buildInventory(build);
		const groups = groupInventory(build, resolveItems(inventory, {}));
		const backpack = groups.find((g) => g.location === BACKPACK)!;
		// Bedroll, rope, rations, 5 torches, waterskin, thieves' toolkit,
		// crowbar = 11 L; repair kit 1.
		expect(backpack.contentBulk).toBe(21);
		expect(backpack.countedBulk).toBe(1);
		// Rapier 1 + dagger L + dart L + leather armor 1 + backpack contents 1L.
		expect(bulkSummary(build, groups)).toMatchObject({
			carried: 23,
			carriedWhole: 2,
			encumberedAt: 4,
			max: 9,
		});
	});

	it('applies the player’s location and Bulk overrides', () => {
		const inventory = buildInventory(build);
		const rope = inventory.find((i) => i.name === 'Rope')!;
		const [resolved] = resolveItems([rope], {
			[rope.id]: { location: 'held', bulk: '2' },
		});
		expect(resolved.location).toBe('held');
		expect(resolved.totalBulk).toBe(20);
	});
});

describe('attaching items', () => {
	const inventory = buildInventory(build);
	const cards = inventory.find((i) => i.name === 'Marked Playing Cards')!;
	const dagger = inventory.find((i) => i.kind === 'weapon')!;

	it('moves an attached item under its parent and adds its Bulk', () => {
		const items = resolveItems(inventory, {
			[cards.id]: { attachedTo: dagger.id, bulk: 'L' },
			[dagger.id]: { location: 'held' },
		});
		const parent = items.find((i) => i.id === dagger.id)!;
		expect(parent.attachments.map((a) => a.name)).toEqual([
			'Marked Playing Cards',
		]);
		expect(parent.bulkWithAttachments).toBe(2);
		expect(parent.bulkWithAttachmentsKnown).toBe(true);
		const held = groupInventory(build, items).find(
			(g) => g.location === 'held'
		)!;
		expect(held.items.map((i) => i.id)).toEqual([dagger.id]);
		expect(held.contentBulk).toBe(2);
	});

	it('marks the parent’s Bulk unknown when an attachment’s is', () => {
		const charm = {
			id: 'gear:Lucky Charm#0',
			name: 'Lucky Charm',
			qty: 1,
			kind: 'gear' as const,
			defaultLocation: 'ready' as const,
		};
		const items = resolveItems([...inventory, charm], {
			[charm.id]: { attachedTo: dagger.id },
		});
		const parent = items.find((i) => i.id === dagger.id)!;
		expect(items.find((i) => i.id === charm.id)!.bulkKnown).toBe(false);
		expect(parent.bulkWithAttachmentsKnown).toBe(false);
	});

	it('ignores chains: an item attached to an attached item stays put', () => {
		const rope = inventory.find((i) => i.name === 'Rope')!;
		const items = resolveItems(inventory, {
			[cards.id]: { attachedTo: dagger.id },
			[rope.id]: { attachedTo: cards.id },
		});
		expect(items.find((i) => i.id === rope.id)!.attachedTo).toBeUndefined();
	});
});

describe('action cards', () => {
	const sheet = deriveSheet(build);
	const entry = (name: string, actions: string, traits: string[] = []) => ({
		name,
		actions,
		traits,
		text: '',
		source: 'PC',
	});
	const data: ActionData = {
		basic: [entry('Strike', 'Single Action')],
		exploration: [entry('Avoid Notice', '', ['Exploration'])],
		skills: {
			arcana: [entry('Recall Knowledge', 'Single Action')],
			society: [entry('Recall Knowledge', 'Single Action')],
			deception: [entry('Lie', 'Single Action')],
			intimidation: [entry('Demoralize', 'Single Action')],
			nature: [entry('Command an Animal', 'Single Action')],
		},
		feats: {
			"fane's fourberie": entry("Fane's Fourberie", 'Single Action'),
			"you're next": entry("You're Next", 'Reaction'),
		},
		classActions: {},
		featRefs: {
			'lie to me': ['Lie'],
			"you're next": ['Demoralize'],
			// A feat in the build; Command an Animal stays off because the
			// character is untrained in Nature.
			'tinkering fingers': ['Command an Animal'],
		},
		spells: {},
		ancestries: { ratfolk: ['Humanoid', 'Ratfolk'] },
		heritages: {},
	};

	it('ticks skill actions the character’s feats refer to', () => {
		const options = actionOptions(data, build);
		const on = chosenCards(options, {}, sheet).map((c) => c.entry.name);
		expect(on).toContain('Lie');
		expect(on).toContain('Demoralize');
		expect(on).not.toContain('Command an Animal');
		const lie = chosenCards(options, {}, sheet).find(
			(c) => c.entry.name === 'Lie'
		)!;
		expect(lie.modifiedBy).toEqual(['Lie to Me']);
	});

	it('lists the ancestry traits', () => {
		expect(characterTraits(data, build)).toEqual(['Humanoid', 'Ratfolk']);
	});

	it('turns on feats that take an action, under Pathbuilder’s names', () => {
		const options = actionOptions(data, build);
		const cards = chosenCards(options, {}, sheet);
		expect(
			cards
				.filter((c) => c.checks.length === 0)
				.map((c) => [c.entry.name, c.kind])
		).toEqual([
			["You're Next", 'reaction'],
			["Card Sharp's Fourberie", 'action'],
		]);
	});

	it('lists a feat once when feats and specials spell it differently', () => {
		const curly = { ...build, specials: [...build.specials, 'You’re Next'] };
		const keys = actionOptions(data, curly)
			.filter((o) => o.group === 'feat')
			.map((o) => o.key);
		expect(keys).toEqual(["feat:you're next", "feat:card sharp's fourberie"]);
	});

	it('files Aid, an action and a reaction, with the reactions', () => {
		const withAid: ActionData = {
			...data,
			basic: [entry('Aid', 'Single Action and Reaction')],
		};
		const [aid] = chosenCards(
			actionOptions(withAid, build),
			{ 'basic:Aid': true },
			sheet
		).filter((c) => c.entry.name === 'Aid');
		expect(aid.kind).toBe('reaction');
	});

	it('merges Athletics maneuvers that target the same defense', () => {
		const athletics = (name: string, trained = false) => ({
			...entry(name, 'Single Action', ['Attack']),
			text: `${name} first sentence. More text.`,
			requirements: `Shared rule. ${name} rule.`,
			outcomes:
				name === 'Disarm'
					? [{ degree: 'Success', text: 'Disarm success.' }]
					: [
							{ degree: 'Critical Success', text: `${name} crit.` },
							{ degree: 'Success', text: `${name} success.` },
						],
			trained,
		});
		const withManeuvers: ActionData = {
			...data,
			skills: {
				athletics: [
					athletics('Grapple'),
					athletics('Reposition'),
					athletics('Shove'),
					athletics('Trip'),
					athletics('Disarm', true),
				],
			},
		};
		const options = actionOptions(withManeuvers, build);
		const pick = (names: string[]) =>
			Object.fromEntries(names.map((n) => [`skill:athletics:${n}`, true]));
		const cards = chosenCards(
			options,
			pick(['Grapple', 'Shove', 'Trip', 'Disarm']),
			sheet
		);
		const names = cards.map((c) => c.entry.name);
		expect(names).toContain('Grapple / Shove');
		expect(names).toContain('Trip / Disarm');
		const trip = cards.find((c) => c.entry.name === 'Trip / Disarm')!;
		expect(trip.checks).toEqual(['Athletics +2']);
		expect(trip.entry.requirements).toBe(
			'Shared rule. Trip: Trip rule. Disarm: Disarm rule.'
		);
		expect(trip.entry.outcomes).toEqual([
			{ degree: 'Critical Success', text: 'Trip: Trip crit.' },
			{
				degree: 'Success',
				text: 'Trip: Trip success. Disarm: Disarm success.',
			},
		]);
		expect(trip.entry.text).toBe(
			"Each is an Athletics check against the target's Reflex DC. Trip: Trip first sentence. Disarm (trained): Disarm first sentence."
		);
		// One picked maneuver keeps its own card.
		expect(
			chosenCards(options, pick(['Grapple']), sheet).map((c) => c.entry.name)
		).toContain('Grapple');
	});

	it('merges Leap with High Jump and Long Jump', () => {
		const withJumps: ActionData = {
			...data,
			basic: [entry('Leap', 'Single Action', ['Move'])],
			skills: {
				athletics: [
					entry('High Jump', 'Two Actions'),
					entry('Long Jump', 'Two Actions'),
				],
			},
		};
		const options = actionOptions(withJumps, build);
		const pick = (keys: string[]) =>
			Object.fromEntries(keys.map((k) => [k, true]));
		const all = chosenCards(
			options,
			pick([
				'basic:Leap',
				'skill:athletics:High Jump',
				'skill:athletics:Long Jump',
			]),
			sheet
		);
		const jumps = all.filter((c) => /Leap|Jump/.test(c.entry.name));
		expect(jumps).toHaveLength(1);
		expect(jumps[0]).toMatchObject({
			kind: 'action',
			checks: ['Athletics +2'],
			entry: {
				name: 'Leap / High Jump / Long Jump',
				actions: 'Single Action or Two Actions',
				traits: ['Move'],
			},
		});
		expect(jumps[0].entry.text).toMatch(
			/^Leap \(1 action\).* High Jump and Long Jump: Stride.* High Jump \(2 actions, DC 30\).* Long Jump \(2 actions, DC 15\)/
		);
		expect(jumps[0].entry.text).toContain('3 feet up and 5 feet across');

		const athleticsOnly = chosenCards(
			options,
			pick(['skill:athletics:High Jump', 'skill:athletics:Long Jump']),
			sheet
		).find((c) => /Jump/.test(c.entry.name))!;
		expect(athleticsOnly.entry.name).toBe('High Jump / Long Jump');
		expect(athleticsOnly.entry.actions).toBe('Two Actions');

		// Leap alone keeps its own card and text.
		const leap = chosenCards(options, pick(['basic:Leap']), sheet);
		expect(leap.map((c) => c.entry.name)).toContain('Leap');
	});

	it('gives class features that are actions a card (Channel Elements)', () => {
		const kineticist = parsePathbuilderJson(kineticistJson);
		const withClassActions: ActionData = {
			...data,
			classActions: {
				'channel elements': entry('Channel Elements', 'Single Action', [
					'Aura',
					'Kineticist',
					'Primal',
				]),
			},
		};
		const cards = chosenCards(
			actionOptions(withClassActions, kineticist),
			{},
			deriveSheet(kineticist)
		);
		expect(cards.map((c) => [c.entry.name, c.kind])).toContainEqual([
			'Channel Elements',
			'action',
		]);
	});

	it('merges one action picked for several skills into one card', () => {
		const options = actionOptions(data, build);
		const cards = chosenCards(
			options,
			{
				'skill:arcana:Recall Knowledge': true,
				'skill:society:Recall Knowledge': true,
				'exploration:Avoid Notice': true,
				"feat:you're next": false,
			},
			sheet
		);
		const recall = cards.find((c) => c.entry.name === 'Recall Knowledge')!;
		expect(recall.checks).toEqual(['Arcana +6', 'Society +6']);
		expect(cards.find((c) => c.entry.name === 'Avoid Notice')!.kind).toBe(
			'exploration'
		);
		expect(cards.some((c) => c.entry.name === "You're Next")).toBe(false);
	});
});

describe('action glyphs', () => {
	it('maps costs to the action font and keeps other text', () => {
		expect(actionGlyphs('Two Actions')).toEqual([{ glyph: '2' }]);
		expect(actionGlyphs('Single Action to Three Actions')).toEqual([
			{ glyph: '1' },
			{ text: '–' },
			{ glyph: '3' },
		]);
		expect(actionGlyphs('Reaction or Two Actions')).toEqual([
			{ glyph: '5' },
			{ text: ' or ' },
			{ glyph: '2' },
		]);
		expect(actionGlyphs('Single Action and Reaction')).toEqual([
			{ glyph: '1' },
			{ text: '+' },
			{ glyph: '5' },
		]);
	});
});

describe('reference descriptions', () => {
	const sheet = deriveSheet(build);
	const e = (name: string, extra: Partial<RefEntry> = {}): RefEntry => ({
		name,
		text: `${name} text`,
		source: 'PC',
		...extra,
	});
	const ref: ReferenceData = {
		feats: {
			'lie to me': e('Lie to Me', { traits: ['General', 'Skill'] }),
			"you're next": e("You're Next", { traits: ['Emotion'] }),
		},
		traits: {
			agile: e('Agile'),
			thrown: e('Thrown'),
			humanoid: e('Humanoid'),
		},
		classFeatures: { 'sneak attack': e('Sneak Attack') },
		subclasses: { 'thief racket': e('Thief', { kind: 'Racket' }) },
		backgrounds: {
			gambler: e('Gambler', { details: 'Deception, Games Lore' }),
		},
		heritages: { 'shadow rat': e('Shadow Rat') },
		items: { dagger: e('Dagger'), "thieves' toolkit": e("Thieves' Toolkit") },
		spells: {},
	};

	it('offers items with a description, unticked, by their base name', () => {
		const options = descriptionOptions(
			ref,
			build,
			sheet,
			[],
			[],
			[],
			['Deck of cards (Dagger)', "Thieves' Toolkit", 'Bedroll']
		);
		const items = options.filter((o) => o.group === 'item');
		expect(items.map((o) => [o.title, o.entry.name])).toEqual([
			['Deck of cards (Dagger)', 'Dagger'],
			["Thieves' Toolkit", "Thieves' Toolkit"],
		]);
		expect(items.some((o) => isDescriptionChosen(o, {}))).toBe(false);
	});

	it('strips trait values to find the trait', () => {
		expect(traitKey('Thrown 10 ft.')).toBe('thrown');
		expect(traitKey('Deadly d8')).toBe('deadly');
		expect(traitKey('Versatile S')).toBe('versatile');
		expect(traitKey('Agile')).toBe('agile');
	});

	it('finds the subclass among the class features', () => {
		expect(classDetailsOf(ref, build)).toEqual(['Thief Racket']);
	});

	it('offers passive feats only and pre-selects all but traits', () => {
		const youreNextCard = {
			key: 'feat:x',
			entry: { ...e("You're Next"), actions: 'Reaction', traits: [] },
			kind: 'reaction' as const,
			checks: [],
			modifiedBy: [],
		};
		const options = descriptionOptions(
			ref,
			build,
			sheet,
			['Humanoid'],
			[youreNextCard],
			["You're Next"]
		);
		const on = options
			.filter((o) => isDescriptionChosen(o, {}))
			.map((o) => o.title);
		expect(on).toEqual([
			'Shadow Rat',
			'Gambler',
			'Thief Racket',
			'Sneak Attack',
			'Lie to Me',
		]);
		expect(options.some((o) => o.title === "You're Next")).toBe(false);
		// Only traits with a description are offered.
		expect(
			options.filter((o) => o.group === 'trait').map((o) => o.title)
		).toEqual(['Humanoid', 'Agile', 'Thrown']);
	});
});

describe('cleric: spells, shield and origin', () => {
	const cleric = parsePathbuilderJson(clericJson);
	const sheet = deriveSheet(cleric);

	it('puts entries sharing tradition, attribute and rank on one spell page', () => {
		const [page, ...rest] = spellPages(cleric);
		expect(rest).toHaveLength(0);
		expect(page).toMatchObject({
			tradition: 'divine',
			prepared: true,
			attack: 8,
			dc: 18,
			cantripsPerDay: 5,
			focusSpells: ['Athletic Rush'],
		});
		expect(page.slots[0]).toBe('3+4');
		expect(page.cantrips.map((r) => r.name)).toEqual([
			'Detect Magic',
			'Guidance',
			'Light',
			'Needle Darts',
			'Daze',
		]);
		expect(page.spells.map((r) => [r.name, r.source])).toEqual([
			['Runic Weapon', undefined],
			['Sacred Beasts', undefined],
			['Sacred Beasts', undefined],
			['Heal', 'Font'],
			['Heal', 'Font'],
			['Heal', 'Font'],
			['Heal', 'Font'],
		]);
		expect(spellNames(cleric)).toContain('Athletic Rush');
	});

	it('gives a spontaneous entry its own page next to a prepared one', () => {
		const pages = spellPages({
			...cleric,
			spellCasters: [
				...(cleric.spellCasters ?? []),
				{
					name: 'Spontaneous Divine',
					magicTradition: 'divine',
					spellcastingType: 'spontaneous',
					ability: 'wis',
					proficiency: 2,
					perDay: [5, 2],
					spells: [{ spellLevel: 1, list: ['Bless'] }],
				},
			],
		});
		expect(pages.map((p) => [p.prepared, p.focusSpells])).toEqual([
			[true, ['Athletic Rush']],
			[false, []],
		]);
		expect(pages[1].spells.map((r) => r.name)).toEqual(['Bless']);
	});

	it('takes the raised shield bonus and the shield numbers', () => {
		expect(sheet.shield).toEqual({
			name: 'Swordstealer Shield',
			bonus: 2,
			hardness: 4,
			hp: 20,
			bt: 10,
		});
	});

	it('uses specific weapon proficiencies (trained in Shield Boss)', () => {
		expect(sheet.strikes[0]).toMatchObject({
			baseName: 'Shield Boss',
			rank: 2,
			profPart: 4,
			abilityPart: 3,
		});
	});

	it('splits Pathbuilder’s background choices off the name', () => {
		expect(splitBackground(cleric.background)).toEqual({
			name: 'Sponsored by a Stranger',
			choices: 'Nature, Dubious Knowledge',
		});
	});

	it('lists subclass, other choices and the deity as class details', () => {
		const ref = {
			subclasses: { warpriest: { name: 'Warpriest', text: '', source: '' } },
		} as unknown as ReferenceData;
		expect(classDetailsOf(ref, cleric)).toEqual([
			'Warpriest',
			'Domain: Might',
			'Deity: Granduncle Taproot (He Who Hides in Humus)',
		]);
	});
});

describe('kineticist: Elemental Blasts as strikes', () => {
	const kineticist = parsePathbuilderJson(kineticistJson);
	const sheet = deriveSheet(kineticist);

	it('lists a melee and a ranged blast per element before the weapons', () => {
		expect(sheet.strikes.map((s) => s.key)).toEqual([
			'blast:air:melee',
			'blast:air:ranged',
			'weapon:0:melee',
		]);
	});

	it('uses the class DC attribute and proficiency for the impulse attack', () => {
		expect(sheet.strikes[0]).toMatchObject({
			name: 'Air Blast',
			baseName: 'Elemental Blast',
			attack: 4 + 4,
			ability: 'con',
			abilityPart: 4,
			profPart: 4,
			rank: 2,
			damage: '1d6',
			damageType: 'S',
		});
		expect(sheet.strikes[0].traits).toContain('electricity or slashing');
		expect(sheet.strikes[0].traits).toContain('2 actions: +4 status damage');
		expect(sheet.strikes[1]).toMatchObject({ ranged: true, range: '60 ft.' });
	});

	it('adds a damage die at 5th level and Str to melee blasts', () => {
		const higher = deriveSheet({
			...kineticist,
			level: 5,
			abilities: { ...kineticist.abilities, str: 14 },
		});
		expect(higher.strikes[0].damage).toBe('2d6+2');
		expect(higher.strikes[1].damage).toBe('2d6');
	});

	it('puts impulse feats Pathbuilder types "Kineticist Feat" in the class column', () => {
		const row1 = sheet.levels.find((r) => r.level === 1)!;
		expect(row1.right.map((f) => f.name)).toEqual([
			'Air Cushion',
			'Four Winds',
			'Aerial Boomerang',
		]);
		expect(row1.left.map((f) => f.name)).not.toContain('Four Winds');
	});

	it('gives other classes no blasts', () => {
		expect(
			deriveSheet({ ...kineticist, class: 'Fighter' }).strikes.map((s) => s.key)
		).toEqual(['weapon:0:melee']);
	});
});
