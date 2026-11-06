import { lookupItem } from './itemCatalog';

// Pathbuilder 2e "Export JSON" format and the numbers a character sheet shows.
// Pathbuilder stores ability scores and proficiency bonuses (0/2/4/6/8, level
// not included), so totals are derived here the way Player Core adds them up.

export type PathbuilderFeat = [
	name: string,
	extra: string | null,
	type: string,
	level: number,
	...rest: unknown[],
];

// [name, qty, containerId | "Invested", "Invested"?]
export type PathbuilderEquipment = [string, number, ...unknown[]];

export type PathbuilderWeapon = {
	name: string;
	display?: string;
	qty: number;
	prof: string;
	die: string;
	pot: number;
	str: string;
	runes?: string[];
	damageType: string;
	attack: number;
	damageBonus: number;
	extraDamage?: string[];
};

export type PathbuilderArmor = {
	name: string;
	display?: string;
	qty: number;
	prof: string;
	pot: number;
	res: string;
	worn: boolean;
	runes?: string[];
};

export type PathbuilderContainer = {
	containerName: string;
	bagOfHolding: boolean;
	backpack: boolean;
};

export type PathbuilderSpellCaster = {
	name: string;
	magicTradition: string;
	spellcastingType: string;
	ability: AbilityKey;
	proficiency: number;
	innate?: boolean;
	perDay?: number[];
	spells?: { spellLevel: number; list: string[] }[];
	prepared?: { spellLevel: number; list: string[] }[];
};

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export type PathbuilderBuild = {
	name: string;
	class: string;
	dualClass: string | null;
	level: number;
	xp?: number;
	ancestry: string;
	heritage: string;
	background: string;
	sizeName: string;
	keyability: AbilityKey;
	languages: string[];
	resistances?: string[];
	abilities: Record<AbilityKey, number>;
	attributes: {
		ancestryhp: number;
		classhp: number;
		bonushp: number;
		bonushpPerLevel: number;
		speed: number;
		speedBonus: number;
	};
	proficiencies: Record<string, number>;
	mods?: Record<string, Record<string, number>>;
	feats: PathbuilderFeat[];
	specials: string[];
	lores: [string, number][];
	equipmentContainers?: Record<string, PathbuilderContainer>;
	equipment: PathbuilderEquipment[];
	weapons: PathbuilderWeapon[];
	armor: PathbuilderArmor[];
	money: { cp: number; sp: number; gp: number; pp: number };
	spellCasters?: PathbuilderSpellCaster[];
	focusPoints?: number;
	// focus[tradition][attribute]: focus spells and cantrips.
	focus?: Record<
		string,
		Record<
			string,
			{
				abilityBonus?: number;
				proficiency?: number;
				itemBonus?: number;
				focusCantrips?: string[];
				focusSpells?: string[];
			}
		>
	>;
	// Weapons trained (or better) by name, e.g. a Shield Boss.
	specificProficiencies?: {
		trained?: string[];
		expert?: string[];
		master?: string[];
		legendary?: string[];
	};
	deity?: string;
	acTotal?: {
		acProfBonus: number;
		acAbilityBonus: number;
		acItemBonus: number;
		acTotal: number;
		shieldBonus: number | null;
	};
};

export class PathbuilderParseError extends Error {}

export function parsePathbuilderJson(text: string): PathbuilderBuild {
	let data: unknown;

	try {
		data = JSON.parse(text);
	} catch {
		throw new PathbuilderParseError('This is not valid JSON.');
	}
	const build =
		data && typeof data === 'object' && 'build' in data
			? (data as { build: unknown }).build
			: data;

	if (
		!build ||
		typeof build !== 'object' ||
		!('abilities' in build) ||
		!('proficiencies' in build) ||
		!('class' in build)
	) {
		throw new PathbuilderParseError(
			'This does not look like a Pathbuilder export (no build with abilities and proficiencies).'
		);
	}
	const b = build as PathbuilderBuild;

	return {
		...b,
		feats: b.feats ?? [],
		specials: b.specials ?? [],
		lores: b.lores ?? [],
		equipment: b.equipment ?? [],
		weapons: b.weapons ?? [],
		armor: b.armor ?? [],
		languages: b.languages ?? [],
		money: b.money ?? { cp: 0, sp: 0, gp: 0, pp: 0 },
	};
}

export const ABILITY_KEYS: AbilityKey[] = [
	'str',
	'dex',
	'con',
	'int',
	'wis',
	'cha',
];

export const abilityMod = (score: number) => Math.floor((score - 10) / 2);

export const formatMod = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export type Rank = 0 | 2 | 4 | 6 | 8;

export const RANK_LETTERS = ['T', 'E', 'M', 'L'] as const;

export const rankLetter = (rank: number) =>
	rank <= 0 ? 'U' : RANK_LETTERS[Math.min(rank, 8) / 2 - 1];

// Proficiency bonus: the rank bonus plus level, or 0 when untrained.
export const proficiencyBonus = (rank: number, level: number) =>
	rank > 0 ? rank + level : 0;

export const SKILLS: { key: string; label: string; ability: AbilityKey }[] = [
	{ key: 'acrobatics', label: 'Acrobatics', ability: 'dex' },
	{ key: 'arcana', label: 'Arcana', ability: 'int' },
	{ key: 'athletics', label: 'Athletics', ability: 'str' },
	{ key: 'crafting', label: 'Crafting', ability: 'int' },
	{ key: 'deception', label: 'Deception', ability: 'cha' },
	{ key: 'diplomacy', label: 'Diplomacy', ability: 'cha' },
	{ key: 'intimidation', label: 'Intimidation', ability: 'cha' },
	{ key: 'medicine', label: 'Medicine', ability: 'wis' },
	{ key: 'nature', label: 'Nature', ability: 'wis' },
	{ key: 'occultism', label: 'Occultism', ability: 'int' },
	{ key: 'performance', label: 'Performance', ability: 'cha' },
	{ key: 'religion', label: 'Religion', ability: 'wis' },
	{ key: 'society', label: 'Society', ability: 'int' },
	{ key: 'stealth', label: 'Stealth', ability: 'dex' },
	{ key: 'survival', label: 'Survival', ability: 'wis' },
	{ key: 'thievery', label: 'Thievery', ability: 'dex' },
];

export type Check = {
	key: string;
	label: string;
	ability: AbilityKey;
	abilityMod: number;
	rank: number;
	prof: number;
	item: number;
	// Armor check penalty (0 or negative).
	armor: number;
	total: number;
};

// Pathbuilder keys item bonuses by the stat's display name, e.g.
// mods.Stealth["Item Bonus"]; the lookup ignores case.
function itemBonus(build: PathbuilderBuild, label: string): number {
	const mods = build.mods ?? {};
	const key = Object.keys(mods).find(
		(k) => k.toLowerCase() === label.toLowerCase()
	);

	if (!key) return 0;
	const entry = mods[key];
	const bonusKey = Object.keys(entry).find(
		(k) => k.toLowerCase() === 'item bonus'
	);

	return bonusKey ? entry[bonusKey] : 0;
}

// Pathbuilder lists shields with the armor.
const isShield = (a: PathbuilderArmor) =>
	a.prof === 'shield' || /shield/i.test(a.name);

const findWornArmor = (build: PathbuilderBuild) =>
	build.armor.find((a) => a.worn && !isShield(a));

const wornArmorStats = (build: PathbuilderBuild) => {
	const worn = findWornArmor(build);

	return worn ? lookupItem(worn.name)?.armor : undefined;
};

// The worn armor's check penalty hits Strength- and Dexterity-based skills
// unless the character meets its Strength value; flexible armor spares
// Acrobatics and Athletics.
function armorPenalty(
	build: PathbuilderBuild,
	skillKey: string,
	ability: AbilityKey
): number {
	const stats = wornArmorStats(build);

	if (!stats?.checkPenalty || (ability !== 'str' && ability !== 'dex'))
		return 0;

	if (abilityMod(build.abilities.str) >= stats.strength) return 0;

	if (stats.flexible && (skillKey === 'acrobatics' || skillKey === 'athletics'))
		return 0;

	return stats.checkPenalty;
}

function check(
	build: PathbuilderBuild,
	key: string,
	label: string,
	ability: AbilityKey,
	rank: number,
	armor = 0
): Check {
	const mod = abilityMod(build.abilities[ability]);
	const prof = proficiencyBonus(rank, build.level);
	const item = itemBonus(build, label);

	return {
		key,
		label,
		ability,
		abilityMod: mod,
		rank,
		prof,
		item,
		armor,
		total: mod + prof + item + armor,
	};
}

export type Strike = {
	// Stable id for the player's on/off choice: weapon:<index>:melee|ranged,
	// fist, or blast:<element>:melee|ranged.
	key: string;
	name: string;
	baseName: string;
	ranged: boolean;
	attack: number;
	ability: AbilityKey;
	abilityPart: number;
	profPart: number;
	itemPart: number;
	rank: number;
	damage: string;
	// Physical damage types as letters, one or more ("S", "BP"); empty when
	// the Strike deals only energy damage.
	damageType: string;
	prof: string;
	traits?: string;
	// Range increment of a ranged Strike, e.g. "10 ft." for a thrown dagger.
	range?: string;
	// Index in build.weapons; absent for the default fist.
	weaponIndex?: number;
};

const signed = (n: number) => (n ? `${n > 0 ? '+' : '-'}${Math.abs(n)}` : '');

const FIST_TRAITS = 'Agile, Finesse, Nonlethal, Unarmed';

// The kineticist's Elemental Blast per element: damage die, damage types
// (physical ones as letters, energy ones by name) and the ranged blast's
// range (Rage of Elements pg. 16).
const ELEMENTAL_BLASTS: Record<
	string,
	{ die: string; physical: string; energy: string[]; range: string }
> = {
	air: { die: 'd6', physical: 'S', energy: ['electricity'], range: '60 ft.' },
	earth: { die: 'd8', physical: 'BP', energy: [], range: '30 ft.' },
	fire: { die: 'd6', physical: '', energy: ['fire'], range: '60 ft.' },
	metal: { die: 'd8', physical: 'PS', energy: [], range: '30 ft.' },
	water: { die: 'd8', physical: 'B', energy: ['cold'], range: '30 ft.' },
	wood: { die: 'd8', physical: 'B', energy: ['vitality'], range: '30 ft.' },
};

const BLAST_TRAITS = 'Attack, Impulse, Kineticist, Primal';

const DAMAGE_TYPE_NAMES: Record<string, string> = {
	B: 'bludgeoning',
	P: 'piercing',
	S: 'slashing',
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Kinetic elements from Pathbuilder's specials ("Air Element"), in the order
// listed.
const kineticElements = (build: PathbuilderBuild) =>
	build.specials.flatMap((s) => {
		const element = /^(\w+) Element$/i.exec(s.trim())?.[1].toLowerCase();

		return element && ELEMENTAL_BLASTS[element] ? [element] : [];
	});

const STRIKING_DICE: Record<string, number> = {
	striking: 2,
	greaterStriking: 3,
	majorStriking: 4,
};

export type FeatGroup =
	| 'ancestry'
	| 'class'
	| 'skill'
	| 'general'
	| 'archetype'
	| 'bonus';

export const FEAT_GROUP_TITLES: Record<FeatGroup, string> = {
	ancestry: 'Ancestry',
	class: 'Class',
	skill: 'Skill',
	general: 'General',
	archetype: 'Archetype',
	bonus: 'Bonus',
};

// Pathbuilder types most class feats "Class Feat", but some by the class's
// name: a kineticist's gate impulse feats are "Kineticist Feat".
function featGroup(type: string, classNames: string[]): FeatGroup {
	const t = type.toLowerCase();

	if (t.includes('ancestry') || t.includes('heritage')) return 'ancestry';

	if (t.includes('archetype')) return 'archetype';

	if (t.includes('class') || classNames.some((c) => t === `${c} feat`))
		return 'class';

	if (t.includes('skill')) return 'skill';

	if (t.includes('general')) return 'general';

	return 'bonus';
}

export type SheetFeat = { name: string; level: number; group: FeatGroup };

// One row per level, like the official sheet: ancestry, skill, general and
// bonus feats on the left; class and archetype feats on the right.
export type LevelRow = {
	level: number;
	left: SheetFeat[];
	right: SheetFeat[];
	leftSlot: string;
	rightSlot: string;
	boosts: boolean;
};

function leftSlot(level: number) {
	if (level === 1) return 'Ancestry & background';

	if (level % 2 === 0) return 'Skill feat';

	return level % 4 === 1 ? 'Ancestry feat' : 'General feat';
}

// Rank from specificProficiencies, which name single weapons (a cleric
// trained in Shield Boss).
const SPECIFIC_RANKS = [
	['legendary', 8],
	['master', 6],
	['expert', 4],
	['trained', 2],
] as const;

function specificRank(build: PathbuilderBuild, weapon: string): number {
	const lists = build.specificProficiencies ?? {};
	const name = weapon.toLowerCase();

	return (
		SPECIFIC_RANKS.find(([key]) =>
			(lists[key] ?? []).some((w) => w.toLowerCase() === name)
		)?.[1] ?? 0
	);
}

// Pathbuilder writes a background with its choices: "Sponsored by a Stranger
// (Nature, Dubious Knowledge)".
export function splitBackground(background: string) {
	const m = /^(.*?)\s*\((.+)\)$/.exec(background);

	return m
		? { name: m[1], choices: m[2] }
		: { name: background, choices: undefined };
}

export type DerivedSheet = ReturnType<typeof deriveSheet>;

export function deriveSheet(build: PathbuilderBuild) {
	const { level, proficiencies: p } = build;
	const mods = Object.fromEntries(
		ABILITY_KEYS.map((k) => [k, abilityMod(build.abilities[k])])
	) as Record<AbilityKey, number>;

	const hpMax =
		build.attributes.ancestryhp +
		build.attributes.bonushp +
		(build.attributes.classhp + build.attributes.bonushpPerLevel + mods.con) *
			level;

	const ac = build.acTotal ?? {
		acProfBonus: proficiencyBonus(p.unarmored ?? 0, level),
		acAbilityBonus: mods.dex,
		acItemBonus: 0,
		acTotal: 10 + mods.dex + proficiencyBonus(p.unarmored ?? 0, level),
		shieldBonus: null,
	};
	const wornArmor = findWornArmor(build);
	const shieldArmor = build.armor.find(isShield);
	const shieldStats = shieldArmor
		? lookupItem(shieldArmor.name)?.shield
		: undefined;
	// Pathbuilder gives the raised shield's bonus as a string ("2").
	const shieldBonus =
		Number(build.acTotal?.shieldBonus ?? NaN) || shieldStats?.ac || undefined;
	const shield = shieldArmor && {
		name: shieldArmor.name,
		bonus: shieldBonus,
		hardness: shieldStats?.hardness,
		hp: shieldStats?.hp,
		bt: shieldStats?.bt,
	};
	const armorStats = wornArmorStats(build);
	// Meeting the armor's Strength value lowers its Speed penalty by 5 feet.
	const speedPenalty = armorStats?.speedPenalty
		? Math.min(
				0,
				armorStats.speedPenalty + (mods.str >= armorStats.strength ? 5 : 0)
			)
		: 0;

	// The thief racket adds Dex instead of Str to damage with finesse
	// weapons. The sheet applies it to thrown finesse Strikes too (house
	// reading); other thrown Strikes add Str.
	const thief = build.specials.some((x) => /thief racket/i.test(x));
	const meleeDamageMod = (finesse: boolean) =>
		thief && finesse ? Math.max(mods.dex, mods.str) : mods.str;

	const strikes: Strike[] = build.weapons.flatMap((w, weaponIndex) => {
		const catalog = lookupItem(w.name);
		const ranged = catalog?.weaponType === 'ranged';
		const finesse = /finesse/i.test(catalog?.traits ?? '');
		const ability = ranged || (finesse && mods.dex > mods.str) ? 'dex' : 'str';
		const rank = Math.max(p[w.prof] ?? 0, specificRank(build, w.name));
		const profPart = proficiencyBonus(rank, level);
		const itemPart = w.pot ?? 0;
		const dice = STRIKING_DICE[w.str] ?? 1;
		const extra = (w.extraDamage ?? []).map((e) => ` + ${e}`).join('');
		const strike: Strike = {
			key: `weapon:${weaponIndex}:${ranged ? 'ranged' : 'melee'}`,
			name: w.display && w.display !== w.name ? w.display : w.name,
			baseName: w.name,
			ranged,
			attack: w.attack,
			ability,
			abilityPart: w.attack - profPart - itemPart,
			profPart,
			itemPart,
			rank,
			damage: `${dice}${w.die}${signed(w.damageBonus)}${extra}`,
			damageType: w.damageType,
			prof: w.prof,
			traits: catalog?.traits,
			range: ranged ? catalog?.range : undefined,
			weaponIndex,
		};
		const thrown = /thrown\s*(\d+)/i.exec(catalog?.traits ?? '');

		if (ranged || !thrown) return [strike];
		// Thrown: attack with Dex; damage swaps the melee attribute for the
		// thrown one.
		const thrownMod = thief && finesse ? meleeDamageMod(true) : mods.str;
		const thrownBonus = w.damageBonus - meleeDamageMod(finesse) + thrownMod;

		return [
			strike,
			{
				...strike,
				key: `weapon:${weaponIndex}:ranged`,
				ranged: true,
				ability: 'dex',
				abilityPart: mods.dex,
				attack: mods.dex + profPart + itemPart,
				damage: `${dice}${w.die}${signed(thrownBonus)}${extra}`,
				range: `${thrown[1]} ft.`,
			},
		];
	});

	// Everyone can punch: add a fist unless the build already has an unarmed
	// attack (e.g. one from the ancestry).
	if (!build.weapons.some((w) => w.prof === 'unarmed')) {
		const rank = p.unarmed ?? 0;
		const profPart = proficiencyBonus(rank, level);
		const ability = mods.dex > mods.str ? 'dex' : 'str';

		strikes.push({
			key: 'fist',
			name: 'Fist',
			baseName: 'Fist',
			ranged: false,
			attack: mods[ability] + profPart,
			ability,
			abilityPart: mods[ability],
			profPart,
			itemPart: 0,
			rank,
			damage: `1d4${signed(meleeDamageMod(true))}`,
			damageType: 'B',
			prof: 'unarmed',
			traits: FIST_TRAITS,
		});
	}

	// A kineticist's Elemental Blasts come first: a melee and a ranged one per
	// kinetic element. The impulse attack uses the class DC's attribute and
	// proficiency; the blast gains a damage die at 5th level and every 4
	// levels after.
	if ([build.class, build.dualClass].some((c) => /kineticist/i.test(c ?? ''))) {
		const rank = p.classDC ?? 0;
		const profPart = proficiencyBonus(rank, level);
		const abilityPart = mods[build.keyability];
		const dice = 1 + Math.floor((level - 1) / 4);
		const twoActionNote = `2 actions: +${Math.max(0, mods.con)} status damage`;

		strikes.unshift(
			...kineticElements(build).flatMap((element): Strike[] => {
				const blast = ELEMENTAL_BLASTS[element];
				const name = `${cap(element)} Blast`;
				const types = [
					...blast.energy,
					...[...blast.physical].map((t) => DAMAGE_TYPE_NAMES[t]),
				].join(' or ');
				const base = {
					baseName: 'Elemental Blast',
					attack: abilityPart + profPart,
					ability: build.keyability,
					abilityPart,
					profPart,
					itemPart: 0,
					rank,
					damageType: blast.physical,
					prof: 'impulse',
					traits: `${BLAST_TRAITS}, ${cap(element)} · ${types} · ${twoActionNote}`,
				};

				return [
					{
						...base,
						key: `blast:${element}:melee`,
						name,
						ranged: false,
						damage: `${dice}${blast.die}${signed(mods.str)}`,
					},
					{
						...base,
						key: `blast:${element}:ranged`,
						name,
						ranged: true,
						damage: `${dice}${blast.die}`,
						range: blast.range,
					},
				];
			})
		);
	}

	const feats: SheetFeat[] = build.feats
		.map(([name, extra, type, featLevel]) => ({
			name: extra ? `${name} (${extra})` : name,
			level: featLevel,
			group: featGroup(
				type,
				[build.class, build.dualClass].flatMap((c) =>
					c ? [c.toLowerCase()] : []
				)
			),
		}))
		.sort((a, b) => a.level - b.level);

	const senses = build.specials.filter((s) =>
		/vision|darkvision|scent|tremorsense|echolocation/i.test(s)
	);

	const isRight = (f: SheetFeat) =>
		f.group === 'class' || f.group === 'archetype';
	const levels: LevelRow[] = Array.from({ length: 20 }, (_, i) => i + 1).map(
		(l) => ({
			level: l,
			left: feats.filter((f) => f.level === l && !isRight(f)),
			right: feats.filter((f) => f.level === l && isRight(f)),
			leftSlot: leftSlot(l),
			rightSlot:
				l === 1
					? 'Class feats & features'
					: l % 2 === 0
						? 'Class feat'
						: 'Class feature',
			boosts: l % 5 === 0,
		})
	);

	return {
		mods,
		hpMax,
		ac,
		wornArmor,
		armorStats,
		shield,
		meetsArmorStrength:
			armorStats !== undefined && mods.str >= armorStats.strength,
		perception: check(
			build,
			'perception',
			'Perception',
			'wis',
			p.perception ?? 0
		),
		saves: [
			check(build, 'fortitude', 'Fortitude', 'con', p.fortitude ?? 0),
			check(build, 'reflex', 'Reflex', 'dex', p.reflex ?? 0),
			check(build, 'will', 'Will', 'wis', p.will ?? 0),
		],
		classDc: {
			total:
				10 + mods[build.keyability] + proficiencyBonus(p.classDC ?? 0, level),
			key: mods[build.keyability],
			prof: proficiencyBonus(p.classDC ?? 0, level),
			rank: p.classDC ?? 0,
		},
		skills: SKILLS.map((s) =>
			check(
				build,
				s.key,
				s.label,
				s.ability,
				p[s.key] ?? 0,
				armorPenalty(build, s.key, s.ability)
			)
		),
		lores: build.lores.map(([name, rank]) =>
			check(build, `lore-${name}`, name, 'int', rank)
		),
		speed: build.attributes.speed + build.attributes.speedBonus + speedPenalty,
		senses,
		strikes,
		feats,
		levels,
		armorProfs: (['unarmored', 'light', 'medium', 'heavy'] as const).map(
			(k) => ({ key: k, rank: p[k] ?? 0 })
		),
		weaponProfs: (['unarmed', 'simple', 'martial', 'advanced'] as const).map(
			(k) => ({ key: k, rank: p[k] ?? 0 })
		),
		classFeatures: build.specials.filter(
			(s) => s !== build.heritage && !senses.includes(s)
		),
	};
}
