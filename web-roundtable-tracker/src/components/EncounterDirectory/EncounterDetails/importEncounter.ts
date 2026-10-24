import { z } from 'zod';
import { EncounterTemplateDataSchema } from '@/models/encounters/encounter.schemas';
import { EncounterTemplate as TemplateModel } from '@/models/encounters/EncounterTemplate';
import type {
	EncounterTemplateData,
	EncounterVariant,
	Event,
	Participant as TemplateParticipant,
} from '@/models/encounters/encounter.types';
import { threatToDifficulty } from '@/components/BuilderPage/builderConvert';
import {
	ConcreteEncounterSchema,
	LEVEL_REPRESENTATION,
	type Encounter,
	type EncounterTemplate,
	type NarrativeSlot,
	type Participant,
} from '@/store/data';
import { generateUUID } from '@/utils/uuid';
import { migrateLegacyEncounter } from '@/store/legacyEncounterFields';

type RelativeParticipant = Participant<typeof LEVEL_REPRESENTATION.Relative>;

/**
 * Result of an import: the encounter (or null), an error message, and the
 * template data that could not be stored and was dropped.
 */
export type ImportResult = [Encounter | null, string, string[]];

function formatZodError(error: z.ZodError) {
	return error.errors
		.map((entry) => `${entry.path}: ${entry.message}`)
		.join(',\n');
}

function toRelativeLevel(level: TemplateParticipant['relativeLevel']) {
	return level.toString() as `+${number}` | `-${number}`;
}

function toStoreParticipant(
	participant: TemplateParticipant
): RelativeParticipant {
	const baseParticipant = {
		id: participant.id,
		name: participant.tag ?? participant.role,
		tag: participant.tag,
		role: participant.role,
		level: toRelativeLevel(participant.relativeLevel),
		side: participant.side,
		count: participant.count,
	};

	if (participant.type === 'hazard') {
		return {
			...baseParticipant,
			type: 'hazard' as const,
			successesToDisable: participant.successesToDisable,
			isComplexHazard: participant.role === 'complex',
			hardness: participant.hardnessValue,
		};
	}

	return {
		...baseParticipant,
		type: 'creature' as const,
		adjustment: 'none' as const,
		maxHealth: participant.maxHealthOverride,
		initiativeBonus: participant.initiativeModifierOverride,
	};
}

/**
 * Template events fire on a 0-indexed turn; stored narrative slots trigger on
 * a 1-indexed round. Reinforcement participants move from the variant's
 * participant list into the slot, so they spawn when the slot fires.
 */
function toNarrativeSlot(
	event: Event,
	participantsById: Map<string, RelativeParticipant>,
	variantLabel: string,
	warnings: string[]
): NarrativeSlot {
	const trigger = { round: event.turnIndex + 1 };

	if (event.type === 'narrative') {
		return {
			id: event.id,
			tag: event.tag,
			type: event.repeatInterval === undefined ? 'default' : 'ongoing',
			description: event.description,
			accomplishmentLevel: event.accomplishmentLevel,
			trigger:
				event.repeatInterval === undefined
					? trigger
					: { ...trigger, frequency: event.repeatInterval },
		};
	}

	const participants = event.reinforcementParticipantIds.flatMap(
		(participantId) => {
			const participant = participantsById.get(participantId);

			if (!participant) {
				warnings.push(
					`${variantLabel}: reinforcement event ${event.id} references unknown participant ${participantId}`
				);

				return [];
			}

			return [participant];
		}
	);

	return {
		id: event.id,
		tag: event.tag,
		type: 'reinforcement',
		description: event.description,
		trigger,
		participants,
	};
}

function toStoreVariant(
	template: TemplateModel,
	variant: EncounterVariant,
	variantLabel: string,
	warnings: string[]
) {
	const participants = variant.participants.map(toStoreParticipant);
	const participantsById = new Map(
		participants.map((participant) => [participant.id as string, participant])
	);
	const reinforcementIds = new Set(
		variant.events.flatMap((event) =>
			event.type === 'reinforcement' ? event.reinforcementParticipantIds : []
		)
	);

	return {
		id: variant.id,
		difficulty: threatToDifficulty(
			template.calculateThreatLevel(variant.id).threat
		),
		partySize: variant.partySize,
		level: variant.partyLevel,
		description: variant.description,
		participants: participants.filter(
			(participant) => !reinforcementIds.has(participant.id as string)
		),
		narrativeSlots: variant.events.map((event) =>
			toNarrativeSlot(event, participantsById, variantLabel, warnings)
		),
		// An empty object marks "no notes", so the variant never inherits the
		// default variant's notes
		notes: variant.notes === undefined ? {} : { gm: variant.notes },
	};
}

/**
 * Maps every field the template schema validates into the stored encounter.
 * The top level mirrors the default variant; each variant keeps its own
 * difficulty, derived from its XP budget.
 */
function normalizeImportedTemplate(
	template: EncounterTemplateData,
	warnings: string[]
): EncounterTemplate {
	const model = new TemplateModel(template);
	const variants = template.variants.map((variant, index) =>
		toStoreVariant(model, variant, `Variant ${index + 1}`, warnings)
	);
	const defaultVariant =
		variants.find((variant) => variant.id === template.defaultVariantId) ??
		variants[0];

	return {
		id: template.id,
		name: template.name,
		description: template.description,
		levelRepresentation: LEVEL_REPRESENTATION.Relative,
		difficulty: defaultVariant.difficulty,
		partySize: defaultVariant.partySize,
		participants: defaultVariant.participants,
		narrativeSlots: defaultVariant.narrativeSlots,
		notes: defaultVariant.notes,
		variants,
		defaultVariantId: template.defaultVariantId,
		tags: template.tags,
		createdAt: template.createdAt,
		updatedAt: template.updatedAt,
	};
}

export function validateImportedEncounter(dataString: string): ImportResult {
	try {
		const parsedJson = JSON.parse(dataString) as unknown;
		const parsedTemplate = EncounterTemplateDataSchema.safeParse(parsedJson);

		if (parsedTemplate.success) {
			const warnings: string[] = [];
			const encounter = normalizeImportedTemplate(
				parsedTemplate.data,
				warnings
			);

			return [encounter, '', warnings];
		}

		if (
			typeof parsedJson !== 'object' ||
			parsedJson === null ||
			Array.isArray(parsedJson)
		) {
			return [null, 'Encounter JSON must be an object.', []];
		}

		const parsedConcrete = ConcreteEncounterSchema.safeParse({
			levelRepresentation: LEVEL_REPRESENTATION.Exact,
			id: generateUUID(),
			...parsedJson,
		});

		if (parsedConcrete.success) {
			return [migrateLegacyEncounter(parsedConcrete.data) as Encounter, '', []];
		}

		return [null, formatZodError(parsedConcrete.error), []];
	} catch (error) {
		if (error instanceof SyntaxError) {
			return [null, 'Invalid JSON format.', []];
		}

		if (error instanceof z.ZodError) {
			return [null, formatZodError(error), []];
		}

		return [null, 'Unknown error occurred.', []];
	}
}
