export const FACTION_ALIGNMENT = {
	Opponent: 'opponent',
	Ally: 'ally',
	Other: 'other',
} as const;

export type FactionAlignment =
	(typeof FACTION_ALIGNMENT)[keyof typeof FACTION_ALIGNMENT];

export const ENCOUNTER_FACTION_ICON_KEYS = [
	'swords',
	'shield',
	'flag',
	'skull',
	'trees',
	'sparkles',
] as const;

export type EncounterFactionIconKey =
	(typeof ENCOUNTER_FACTION_ICON_KEYS)[number];

export const ENCOUNTER_FACTION_COLOR_KEYS = [
	'crimson',
	'amber',
	'emerald',
	'sky',
	'indigo',
	'slate',
] as const;

export type EncounterFactionColorKey =
	(typeof ENCOUNTER_FACTION_COLOR_KEYS)[number];

export interface EncounterFaction {
	id: string;
	name: string;
	alignment: FactionAlignment;
	icon: EncounterFactionIconKey;
	color: EncounterFactionColorKey;
	isBuiltIn?: boolean;
}

export const BUILTIN_FACTION_IDS = {
	opponents: 'builtin-opponents-faction',
	allies: 'builtin-allies-faction',
	other: 'builtin-other-faction',
} as const;

export function createBuiltinFactions(): EncounterFaction[] {
	return [
		{
			id: BUILTIN_FACTION_IDS.opponents,
			name: 'Opponents',
			alignment: FACTION_ALIGNMENT.Opponent,
			icon: 'swords',
			color: 'crimson',
			isBuiltIn: true,
		},
		{
			id: BUILTIN_FACTION_IDS.allies,
			name: 'Allies',
			alignment: FACTION_ALIGNMENT.Ally,
			icon: 'shield',
			color: 'emerald',
			isBuiltIn: true,
		},
		{
			id: BUILTIN_FACTION_IDS.other,
			name: 'Other',
			alignment: FACTION_ALIGNMENT.Other,
			icon: 'flag',
			color: 'slate',
			isBuiltIn: true,
		},
	];
}

export function ensureEncounterFactions(
	factions?: EncounterFaction[]
): EncounterFaction[] {
	const normalized = (factions ?? []).filter(
		(faction): faction is EncounterFaction =>
			Boolean(faction?.id) && Boolean(faction?.name)
	);
	const byId = new Map<string, EncounterFaction>();

	for (const faction of normalized) {
		if (!byId.has(faction.id)) {
			byId.set(faction.id, faction);
		}
	}

	for (const builtin of createBuiltinFactions()) {
		if (!Array.from(byId.values()).some((f) => f.alignment === builtin.alignment)) {
			byId.set(builtin.id, builtin);
		}
	}

	return Array.from(byId.values());
}
