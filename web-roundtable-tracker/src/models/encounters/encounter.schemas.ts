import { z } from 'zod';
import type {
	Participant,
	Event,
	EncounterVariant,
	EncounterTemplateData,
} from './encounter.types';
import { LevelDifference } from '../utility/level/LevelDifference';

// ============================================================================
// Role Schemas
// ============================================================================

export const CreatureRoleSchema = z.union([
	z.enum(['boss', 'lackey', 'lieutenant', 'opponent']),
	z.string(),
]);

export const HazardRoleSchema = z.enum(['complex', 'simple']);

export const AccomplishmentLevelSchema = z
	.enum(['story', 'minor', 'moderate', 'major'])
	.optional();

// ============================================================================
// Participant Schemas
// ============================================================================

type LevelDifferenceInput = LevelDifference | number | { value: number };

const LevelDifferenceSchema: z.ZodType<
	LevelDifference,
	z.ZodTypeDef,
	LevelDifferenceInput
> = z
	.union([
		z.instanceof(LevelDifference),
		z.number().int(),
		z.object({ value: z.number() }),
	])
	.transform((value) => {
		if (value instanceof LevelDifference) {
			return value;
		}

		if (typeof value === 'number') {
			return new LevelDifference(value);
		}

		return new LevelDifference(value.value);
	});

const BaseParticipantSchema = z.object({
	id: z.string().uuid(),
	count: z.number().int().positive(),
	relativeLevel: LevelDifferenceSchema,
	side: z.union([z.literal(0), z.literal(1), z.literal(2)]),
	tag: z.string().optional(),
});

export const CreatureParticipantSchema = BaseParticipantSchema.extend({
	type: z.literal('creature'),
	role: CreatureRoleSchema,
	maxHealthOverride: z.number().positive().optional(),
	initiativeModifierOverride: z.number().optional(),
});

export const HazardParticipantSchema = BaseParticipantSchema.extend({
	type: z.literal('hazard'),
	role: HazardRoleSchema,
	successesToDisable: z.number().int().nonnegative(),
	hardnessValue: z.number().int().nonnegative().optional(),
});

/**
 * Discriminated union schema ensures only valid combinations deserialize.
 * Zod will throw a validation error if type='creature' but
 * successesToDisable is present.
 */
export const ParticipantSchema = z.discriminatedUnion('type', [
	CreatureParticipantSchema,
	HazardParticipantSchema,
]) as z.ZodSchema<Participant>;

// ============================================================================
// Event Schemas
// ============================================================================

const BaseEventSchema = z.object({
	id: z.string().uuid(),
	turnIndex: z.number().int().nonnegative(),
	tag: z.string().optional(),
});

export const NarrativeEventSchema = BaseEventSchema.extend({
	type: z.literal('narrative'),
	description: z.string(),
	accomplishmentLevel: AccomplishmentLevelSchema,
	repeatInterval: z.number().int().positive().optional(),
});

export const ReinforcementEventSchema = BaseEventSchema.extend({
	type: z.literal('reinforcement'),
	reinforcementParticipantIds: z.array(z.string().uuid()).nonempty(),
	description: z.string().optional(),
});

export const EventSchema = z.discriminatedUnion('type', [
	NarrativeEventSchema,
	ReinforcementEventSchema,
]) as z.ZodSchema<Event>;

// ============================================================================
// Variant Schema
// ============================================================================

export const EncounterVariantSchema = z.object({
	id: z.string().uuid(),
	partySize: z.number().int().positive(),
	partyLevel: z.number().int().optional(),
	participants: z.array(ParticipantSchema).nonempty(),
	events: z.array(EventSchema),
	description: z.string().optional(),
	notes: z.string().optional(),
}) as z.ZodSchema<EncounterVariant>;

// ============================================================================
// Template Schema with Custom Validation
// ============================================================================

export const EncounterTemplateDataSchema = z
	.object({
		id: z.string().uuid(),
		name: z.string().min(1),
		description: z.string(),
		defaultVariantId: z.string().uuid(),
		variants: z.array(EncounterVariantSchema).nonempty(),
		tags: z.array(z.string()).optional(),
		createdAt: z.date().optional(),
		updatedAt: z.date().optional(),
	})
	.refine(
		(data) => {
			// Ensure defaultVariantId references an actual variant
			return data.variants.some((v) => v.id === data.defaultVariantId);
		},
		{
			message: 'defaultVariantId must reference an existing variant',
			path: ['defaultVariantId'],
		}
	) as z.ZodSchema<EncounterTemplateData>;
