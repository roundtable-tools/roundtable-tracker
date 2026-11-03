// Cards for the sheet's actions page. The data comes from Archive of Nethys
// (scripts/generate-pf2e-actions.py); the player picks which skill actions,
// exploration activities and basic actions get a card. Feats that take an
// action get one by default.

import type { DerivedSheet, PathbuilderBuild } from './pathbuilder';

export type ActionEntry = {
	name: string;
	// AoN's wording: "Single Action", "Reaction", "" for activities without one.
	actions: string;
	traits: string[];
	text: string;
	source: string;
	trigger?: string;
	requirements?: string;
	frequency?: string;
	trained?: boolean;
};

export type ActionData = {
	basic: ActionEntry[];
	exploration: ActionEntry[];
	skills: Record<string, ActionEntry[]>;
	feats: Record<string, ActionEntry>;
	// Actions each feat's rules text links to, e.g. "lie to me": ["Lie"].
	featRefs: Record<string, string[]>;
	// Action cost, rank and traits by lower-case spell name.
	spells: Record<string, { actions: string; rank: number; traits: string[] }>;
	ancestries: Record<string, string[]>;
	heritages: Record<string, string[]>;
};

// Loaded only on the character sheet page: the file is about 1 MB.
export async function loadActionData(): Promise<ActionData> {
	const { default: raw } = await import('./data/pf2eActions.json?raw');

	return JSON.parse(raw) as ActionData;
}

// Pathbuilder names some feats differently from Archive of Nethys.
const FEAT_ALIASES: Record<string, string> = {
	"card sharp's fourberie": "fane's fourberie",
};

const normalize = (name: string) =>
	name.toLowerCase().replace(/[‘’]/g, "'").trim();

// Traits from the ancestry and from a heritage that adds its own (e.g. a
// versatile heritage).
export function characterTraits(
	data: ActionData,
	build: PathbuilderBuild
): string[] {
	const traits = [
		...(data.ancestries[normalize(build.ancestry)] ?? []),
		...(data.heritages[normalize(build.heritage ?? '')] ?? []),
	];

	return traits.filter((t, i) => traits.indexOf(t) === i);
}

// Archive of Nethys key of a feat as Pathbuilder names it.
export const featKey = (name: string) => {
	const key = normalize(name);

	return FEAT_ALIASES[key] ?? key;
};

export type ActionGroup = 'feat' | 'exploration' | 'skill' | 'basic';

export type ActionOption = {
	key: string;
	group: ActionGroup;
	skill?: string;
	entry: ActionEntry;
	defaultOn: boolean;
	// The character's feats whose rules text refers to this action.
	modifiedBy: string[];
};

export type ActionChoices = Record<string, boolean>;

export const isChosen = (option: ActionOption, choices: ActionChoices) =>
	choices[option.key] ?? option.defaultOn;

export function actionOptions(
	data: ActionData,
	build: PathbuilderBuild
): ActionOption[] {
	const featNames = [
		...build.feats.map(([name]) => name),
		...build.specials,
	].filter((n, i, all) => all.indexOf(n) === i);

	const feats = featNames.flatMap((name): ActionOption[] => {
		const entry = data.feats[featKey(name)];

		return entry
			? [
					{
						key: `feat:${normalize(name)}`,
						group: 'feat',
						entry: { ...entry, name },
						defaultOn: true,
						modifiedBy: [],
					},
				]
			: [];
	});

	// Actions the character's feats refer to start ticked. An action shared by
	// several skills (Recall Knowledge) is ticked for the trained ones.
	const modifiers = (action: string) =>
		featNames.filter((n) => (data.featRefs[featKey(n)] ?? []).includes(action));
	const option = (
		key: string,
		group: ActionGroup,
		entry: ActionEntry,
		skill?: string
	): ActionOption => {
		const modifiedBy = modifiers(entry.name);
		const usable = !skill || (build.proficiencies[skill] ?? 0) > 0;

		return {
			key,
			group,
			skill,
			entry,
			modifiedBy,
			defaultOn: modifiedBy.length > 0 && usable,
		};
	};

	return [
		...feats,
		...data.exploration.map((entry) =>
			option(`exploration:${entry.name}`, 'exploration', entry)
		),
		...Object.entries(data.skills).flatMap(([skill, entries]) =>
			entries.map((entry) =>
				option(`skill:${skill}:${entry.name}`, 'skill', entry, skill)
			)
		),
		...data.basic.map((entry) => option(`basic:${entry.name}`, 'basic', entry)),
	];
}

export type CardKind = 'action' | 'reaction' | 'exploration';

export type ActionCard = {
	key: string;
	entry: ActionEntry;
	kind: CardKind;
	// "Intimidation +7" for skill actions; one per skill when the same action
	// (Recall Knowledge) is picked for several skills.
	checks: string[];
	modifiedBy: string[];
};

function cardKind(entry: ActionEntry): CardKind {
	if (entry.actions === 'Free Action' || entry.actions === 'Reaction')
		return 'reaction';

	if (
		!entry.actions ||
		entry.traits.includes('Exploration') ||
		entry.traits.includes('Downtime')
	)
		return 'exploration';

	return 'action';
}

export function chosenCards(
	options: ActionOption[],
	choices: ActionChoices,
	sheet: DerivedSheet
): ActionCard[] {
	const cards = new Map<string, ActionCard>();

	for (const option of options) {
		if (!isChosen(option, choices)) continue;
		const skill = option.skill
			? sheet.skills.find((s) => s.key === option.skill)
			: undefined;
		const check = skill
			? `${skill.label} ${skill.total >= 0 ? '+' : ''}${skill.total}`
			: undefined;
		const existing = cards.get(option.entry.name);

		if (existing) {
			if (check) existing.checks.push(check);
			continue;
		}
		cards.set(option.entry.name, {
			key: option.key,
			entry: option.entry,
			kind: cardKind(option.entry),
			checks: check ? [check] : [],
			modifiedBy: option.modifiedBy,
		});
	}

	return mergeAthleticsManeuvers([...cards.values()]);
}

// Athletics maneuvers that roll against the same defense share one card when
// two or more are picked: Grapple, Reposition and Shove target Fortitude DC,
// Trip and Disarm target Reflex DC.
const MANEUVER_GROUPS: { names: string[]; defense: string }[] = [
	{ names: ['Grapple', 'Reposition', 'Shove'], defense: 'Fortitude DC' },
	{ names: ['Trip', 'Disarm'], defense: 'Reflex DC' },
];

// The first sentence that says what the action does; one that only names
// the check ("Attempt an Athletics check against …") repeats the card's lead.
const firstSentence = (text: string) =>
	text
		.split(/(?<=[.!?])\s+/)
		.find((sentence) => !/^Attempt an? \w+ check against/i.test(sentence)) ??
	text;

const unique = <T>(list: T[]) => list.filter((v, i) => list.indexOf(v) === i);

const sentences = (text?: string) =>
	(text ?? '').split(/(?<=[.!?])\s+/).filter(Boolean);

// Requirements every action in the group shares come first, once; then what
// each one adds ("Reposition: you're grabbing or restraining the target").
function mergedRequirements(group: ActionCard[]): string | undefined {
	const lists = group.map((c) => sentences(c.entry.requirements));
	const shared = lists[0].filter((sentence) =>
		lists.every((l) => l.includes(sentence))
	);
	const own = group.flatMap((c, i) => {
		const rest = lists[i].filter((sentence) => !shared.includes(sentence));

		return rest.length ? [`${c.entry.name}: ${rest.join(' ')}`] : [];
	});

	return [...shared, ...own].join(' ') || undefined;
}

function mergeAthleticsManeuvers(cards: ActionCard[]): ActionCard[] {
	let result = cards;

	for (const { names, defense } of MANEUVER_GROUPS) {
		const group = result.filter((c) => names.includes(c.entry.name));

		if (group.length < 2) continue;
		const merged: ActionCard = {
			key: group.map((c) => c.key).join('+'),
			kind: group[0].kind,
			checks: unique(group.flatMap((c) => c.checks)),
			modifiedBy: unique(group.flatMap((c) => c.modifiedBy)),
			entry: {
				name: group.map((c) => c.entry.name).join(' / '),
				actions: group[0].entry.actions,
				traits: unique(group.flatMap((c) => c.entry.traits)),
				source: group[0].entry.source,
				trained: group.some((c) => c.entry.trained),
				requirements: mergedRequirements(group),
				text: [
					`Each is an Athletics check against the target's ${defense}.`,
					...group.map(
						(c) =>
							`${c.entry.name}${c.entry.trained ? ' (trained)' : ''}: ${firstSentence(c.entry.text)}`
					),
				].join(' '),
			},
		};
		// The merged card takes the place of the first one.
		const first = result.indexOf(group[0]);

		result = result.flatMap((c, i) =>
			i === first ? [merged] : group.includes(c) ? [] : [c]
		);
	}

	return result;
}

// Characters of the Pathfinder2eActions font: 1-3 actions, 4 free action,
// 5 reaction.
const ACTION_GLYPHS: Record<string, string> = {
	'Single Action': '1',
	'Two Actions': '2',
	'Three Actions': '3',
	'Free Action': '4',
	Reaction: '5',
};

export type GlyphPart = { glyph: string } | { text: string };

// "Single Action to Three Actions" -> glyph 1, " to ", glyph 3. Costs that
// aren't actions (e.g. "1 minute") stay text.
export function actionGlyphs(actions: string): GlyphPart[] {
	return actions
		.split(/( to | or )/)
		.map((part) =>
			ACTION_GLYPHS[part]
				? { glyph: ACTION_GLYPHS[part] }
				: { text: part.trim() === 'to' ? '–' : part }
		);
}
