import { z } from 'zod';
import { EncounterTemplateDataSchema } from '@/models/encounters/encounter.schemas';
import type { EncounterTemplateData } from '@/models/encounters/encounter.types';
import {
	ConcreteEncounterSchema,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type Encounter,
	type EncounterTemplate,
	type Participant,
} from '@/store/data';
import { generateUUID } from '@/utils/uuid';

type EncounterDifficulty = (typeof DIFFICULTY)[keyof typeof DIFFICULTY];

function formatZodError(error: z.ZodError) {
	return error.errors
		.map((entry) => `${entry.path}: ${entry.message}`)
		.join(',\n');
}

function difficultyFromTags(tags?: string[]): EncounterDifficulty {
	if (!tags || tags.length === 0) {
		return DIFFICULTY.Low;
	}

	const difficultyKey = Object.keys(DIFFICULTY).find((key) =>
		tags.some((tag) => tag.toLowerCase() === key.toLowerCase())
	) as keyof typeof DIFFICULTY | undefined;

	return difficultyKey ? DIFFICULTY[difficultyKey] : DIFFICULTY.Low;
}

function toRelativeLevel(
	level: EncounterTemplateData['variants'][number]['participants'][number]['relativeLevel']
) {
	return level.toString() as `+${number}` | `-${number}`;
}

function toStoreParticipants(
	participants: EncounterTemplateData['variants'][number]['participants']
): Participant<typeof LEVEL_REPRESENTATION.Relative>[] {
	return participants.map((participant) => {
		const baseParticipant = {
			name: participant.tag ?? participant.role,
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
			};
		}

		return {
			...baseParticipant,
			type: 'creature' as const,
			adjustment: 'none' as const,
		};
	});
}

function normalizeImportedTemplate(
	template: EncounterTemplateData
): EncounterTemplate {
	const defaultVariant =
		template.variants.find(
			(variant) => variant.id === template.defaultVariantId
		) ?? template.variants[0];

	if (!defaultVariant) {
		throw new z.ZodError([
			{
				code: 'custom',
				message: 'Template must include at least one variant.',
				path: ['variants'],
			},
		]);
	}

	return {
		id: template.id,
		name: template.name,
		description: defaultVariant.description ?? template.description,
		levelRepresentation: LEVEL_REPRESENTATION.Relative,
		difficulty: difficultyFromTags(template.tags),
		partySize: defaultVariant.partySize,
		participants: toStoreParticipants(defaultVariant.participants),
		variants: template.variants.map((variant) => ({
			difficulty: difficultyFromTags(template.tags),
			partySize: variant.partySize,
			description: variant.description ?? template.description,
			participants: toStoreParticipants(variant.participants),
		})),
	};
}

export function validateImportedEncounter(
	dataString: string
): [Encounter | null, string] {
	try {
		const parsedJson = JSON.parse(dataString) as unknown;
		const parsedTemplate = EncounterTemplateDataSchema.safeParse(parsedJson);

		if (parsedTemplate.success) {
			return [normalizeImportedTemplate(parsedTemplate.data), ''];
		}

		if (
			typeof parsedJson !== 'object' ||
			parsedJson === null ||
			Array.isArray(parsedJson)
		) {
			return [null, 'Encounter JSON must be an object.'];
		}

		const parsedConcrete = ConcreteEncounterSchema.safeParse({
			levelRepresentation: LEVEL_REPRESENTATION.Exact,
			id: generateUUID(),
			...parsedJson,
		});

		if (parsedConcrete.success) {
			return [parsedConcrete.data as Encounter, ''];
		}

		return [null, formatZodError(parsedConcrete.error)];
	} catch (error) {
		if (error instanceof SyntaxError) {
			return [null, 'Invalid JSON format.'];
		}

		if (error instanceof z.ZodError) {
			return [null, formatZodError(error)];
		}

		return [null, 'Unknown error occurred.'];
	}
}
