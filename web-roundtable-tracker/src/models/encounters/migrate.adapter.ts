import { v4 as uuidV4 } from 'uuid';
import {
	EncounterTemplate as OldStoreTemplate,
	Participant as OldParticipant,
} from '@/store/data';
import {
	EncounterTemplateData,
	EncounterVariant,
	CreatureParticipant,
	CreatureRole,
	HazardParticipant,
	Participant,
} from './encounter.types';
import { EncounterTemplateDataSchema } from './encounter.schemas';
import { LevelDifference } from '../utility/level/LevelDifference';

function inferCreatureRole(name?: string): CreatureRole {
	const normalized = (name ?? '').toLowerCase();

	if (normalized.includes('boss')) return 'boss';

	if (normalized.includes('lackey') || normalized.includes('minion'))
		return 'lackey';

	if (normalized.includes('lieutenant') || normalized.includes('elite'))
		return 'lieutenant';

	return 'opponent';
}

/**
 * Parse relative level string to number.
 * Supports: '+2', '-4', '0', '+0'
 */
function parseRelativeLevel(levelStr: string | number): LevelDifference {
	if (typeof levelStr === 'number') return new LevelDifference(levelStr);

	const str = levelStr.trim();

	if (str === '0' || str === '+0') return new LevelDifference(0);

	if (str.startsWith('+'))
		return new LevelDifference(parseInt(str.slice(1), 10));

	if (str.startsWith('-')) return new LevelDifference(parseInt(str, 10));

	return new LevelDifference(parseInt(str, 10)); // Try direct parse
}

/**
 * Convert a single old-format participant to new format.
 */
function migrateParticipant(oldParticipant: OldParticipant): Participant {
	const baseParticipant = {
		id: uuidV4(),
		count: oldParticipant.count ?? 1,
		relativeLevel: parseRelativeLevel(oldParticipant.level),
		side: oldParticipant.side,
		tag: oldParticipant.name, // Store name in tag
	};

	switch (oldParticipant.type) {
		case 'creature':
			return {
				...baseParticipant,
				type: 'creature',
				role: inferCreatureRole(oldParticipant.name),
				maxHealthOverride: oldParticipant.maxHealth,
				initiativeModifierOverride: undefined,
			} as CreatureParticipant;

		case 'hazard':
			return {
				...baseParticipant,
				type: 'hazard',
				role: oldParticipant.isComplexHazard === false ? 'simple' : 'complex',
				successesToDisable: oldParticipant.successesToDisable ?? 2,
				hardnessValue: undefined,
			} as HazardParticipant;

		default:
			throw new Error(
				`Unknown participant type: ${(oldParticipant as unknown as { type: unknown }).type}`
			);
	}
}

/**
 * Migrate a single variant.
 */
function migrateVariant(
	oldVariant: Record<string, unknown>,
	partySize: number,
	defaultParticipants: OldParticipant[]
): EncounterVariant {
	const participantsToMigrate =
		oldVariant?.participants instanceof Array
			? oldVariant?.participants
			: defaultParticipants;

	return {
		id: uuidV4(),
		partySize:
			typeof oldVariant?.partySize === 'number'
				? (oldVariant?.partySize as number)
				: partySize,
		description:
			typeof oldVariant?.description === 'string'
				? (oldVariant?.description as string)
				: 'Default variant',
		participants: participantsToMigrate.map(migrateParticipant),
		events: [],
	};
}

/**
 * Migrate a single old-format template to new format.
 */
export function migrateOldTemplate(
	oldTemplate: OldStoreTemplate
): EncounterTemplateData {
	const baseVariant = migrateVariant(
		{},
		oldTemplate.partySize ?? 4,
		oldTemplate.participants ?? []
	);

	const extraVariants = (oldTemplate.variants ?? []).map((variant) =>
		migrateVariant(
			variant,
			oldTemplate.partySize ?? 4,
			oldTemplate.participants ?? []
		)
	);

	const variants = [baseVariant, ...extraVariants];

	// Ensure at least one variant
	if (variants.length === 0) {
		variants.push(baseVariant);
	}

	const template: EncounterTemplateData = {
		id: uuidV4(),
		name: oldTemplate.name,
		description: oldTemplate.description ?? '',
		tags: [],
		defaultVariantId: variants[0].id,
		variants,
	};

	// Validate against schema
	const validated = EncounterTemplateDataSchema.parse(template);

	return validated;
}

/**
 * Migrate all templates from old format.
 */
export function migrateOldTemplates(
	oldTemplates: OldStoreTemplate[]
): EncounterTemplateData[] {
	return oldTemplates.map(migrateOldTemplate);
}
