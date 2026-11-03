// Short rules text for the sheet's reference page: the character's heritage,
// background, class features and subclass, feats and traits. The data comes
// from Archive of Nethys (scripts/generate-pf2e-actions.py); the player picks
// which descriptions get printed.

import { featKey, type ActionCard } from './actions';
import { lookupItem } from './itemCatalog';
import {
	splitBackground,
	type DerivedSheet,
	type PathbuilderBuild,
} from './pathbuilder';

export type RefEntry = {
	name: string;
	text: string;
	source: string;
	traits?: string[];
	// Subclass kind, e.g. "Racket".
	kind?: string;
	// Background: the skills and feat it grants.
	details?: string;
	// Class feature: the class it belongs to.
	class?: string;
};

export type ReferenceData = {
	feats: Record<string, RefEntry>;
	traits: Record<string, RefEntry>;
	classFeatures: Record<string, RefEntry>;
	subclasses: Record<string, RefEntry>;
	backgrounds: Record<string, RefEntry>;
	heritages: Record<string, RefEntry>;
	items: Record<string, RefEntry>;
	spells: Record<string, RefEntry>;
};

// Loaded only on the character sheet page: the file is about 3.5 MB.
export async function loadReferenceData(): Promise<ReferenceData> {
	const { default: raw } = await import('./data/pf2eReference.json?raw');

	return JSON.parse(raw) as ReferenceData;
}

const lower = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").trim();

// "Thrown 10 ft." -> "thrown", "Deadly d8" -> "deadly", "Versatile S" ->
// "versatile": trait values aren't part of the trait's name.
export const traitKey = (trait: string) =>
	lower(trait.replace(/\s+(d\d+|\d+(\s*ft\.?)?|[BPS])$/i, ''));

// What the Class details box lists: subclass choices ("Thief Racket",
// "Warpriest"), other class choices Pathbuilder writes as "Domain: Might",
// and the deity.
export function classDetailsOf(
	ref: ReferenceData,
	build: PathbuilderBuild
): string[] {
	const deity = build.deity && build.deity !== 'Not set' ? build.deity : '';

	return [
		...build.specials.filter(
			(s) => ref.subclasses[lower(s)] || /^[^:]+:\s*\S/.test(s)
		),
		...(deity ? [`Deity: ${deity}`] : []),
	];
}

// "You're trained in the Deception skill, and the Games Lore skill. You gain
// the Lie to Me skill feat." -> "Trained in Deception, Games Lore. Skill feat:
// Lie to Me." Wording that doesn't match stays as it is.
export const shortBackgroundDetails = (details: string) =>
	details
		.replace(/You(?:'|’)re (?:also )?trained in (?:the )?/g, 'Trained in ')
		.replace(/ skill,? and (?:the )?/g, ', ')
		.replace(/ skill\./g, '.')
		.replace(/You gain the (.+?) skill feat\./g, 'Skill feat: $1.');

export type DescriptionGroup =
	| 'origin'
	| 'class'
	| 'feat'
	| 'trait'
	| 'item'
	| 'spell';

export const DESCRIPTION_GROUP_TITLES: Record<DescriptionGroup, string> = {
	origin: 'Heritage and background',
	class: 'Class features and options',
	feat: 'Feats',
	trait: 'Traits',
	item: 'Items',
	spell: 'Spells',
};

export type DescriptionOption = {
	key: string;
	group: DescriptionGroup;
	// The name as the character has it ("Thief Racket").
	title: string;
	entry: RefEntry;
	defaultOn: boolean;
};

export type DescriptionChoices = Record<string, boolean>;

export const isDescriptionChosen = (
	option: DescriptionOption,
	choices: DescriptionChoices
) => choices[option.key] ?? option.defaultOn;

export function descriptionOptions(
	ref: ReferenceData,
	build: PathbuilderBuild,
	sheet: DerivedSheet,
	characterTraits: string[],
	cards: ActionCard[],
	// Feats that take an action: they belong on the actions pages, so only
	// passive feats are offered here.
	activityFeats: string[],
	// Inventory item names; "Deck of cards (Dagger)" is looked up as "Dagger".
	itemNames: string[] = [],
	// Spells, cantrips and focus spells the character has.
	spellNames: string[] = []
): DescriptionOption[] {
	const options: DescriptionOption[] = [];
	const seen = new Set<string>();
	const add = (
		key: string,
		group: DescriptionGroup,
		title: string,
		entry: RefEntry | undefined,
		defaultOn: boolean
	) => {
		if (!entry || seen.has(key)) return;
		seen.add(key);
		options.push({ key, group, title, entry, defaultOn });
	};

	add(
		`heritage:${lower(build.heritage ?? '')}`,
		'origin',
		build.heritage,
		ref.heritages[lower(build.heritage ?? '')],
		true
	);
	const background = splitBackground(build.background).name;

	add(
		`background:${lower(background)}`,
		'origin',
		background,
		ref.backgrounds[lower(background)],
		true
	);

	for (const special of build.specials) {
		// A same-named feature of another class (the druid's Anathema for a
		// cleric) would describe the wrong thing, so it's skipped.
		const plain = ref.classFeatures[lower(special)];
		const entry =
			ref.subclasses[lower(special)] ??
			ref.classFeatures[`${lower(special)}|${lower(build.class)}`] ??
			(plain && (!plain.class || lower(plain.class) === lower(build.class))
				? plain
				: undefined);

		add(`class:${lower(special)}`, 'class', special, entry, true);
	}

	const activities = new Set(activityFeats.map(lower));

	for (const [name] of build.feats) {
		if (name === build.heritage || activities.has(lower(name))) continue;
		add(`feat:${lower(name)}`, 'feat', name, ref.feats[featKey(name)], true);
	}

	const traits = [
		...characterTraits,
		...build.feats.flatMap(([name]) => ref.feats[featKey(name)]?.traits ?? []),
		...sheet.strikes.flatMap((s) => (s.traits ?? '').split(',')),
		...build.armor.flatMap((a) =>
			(lookupItem(a.name)?.traits ?? '').split(',')
		),
		...cards.flatMap((c) => c.entry.traits),
	]
		.map((t) => t.trim())
		.filter(Boolean);

	for (const trait of traits) {
		const key = traitKey(trait);

		add(
			`trait:${key}`,
			'trait',
			ref.traits[key]?.name ?? trait,
			ref.traits[key],
			false
		);
	}

	for (const name of itemNames) {
		const base = name.replace(/^.*\((.+)\)$/, '$1');

		add(
			`item:${lower(name)}`,
			'item',
			name,
			ref.items[lower(name)] ?? ref.items[lower(base)],
			false
		);
	}

	for (const name of spellNames)
		add(
			`spell:${lower(name)}`,
			'spell',
			name,
			ref.spells?.[lower(name)],
			false
		);

	return options;
}
