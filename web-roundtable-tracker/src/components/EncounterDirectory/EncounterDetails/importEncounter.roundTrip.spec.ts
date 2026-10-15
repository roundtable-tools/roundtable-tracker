import { describe, expect, it } from 'vitest';
import encounterTemplates from '@/models/encounters/defaultTemplates';
import type {
	EncounterTemplateData,
	EncounterVariant,
	Event,
	Participant as TemplateParticipant,
} from '@/models/encounters/encounter.types';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import {
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type EncounterTemplate,
	type NarrativeSlot,
	type Participant,
} from '@/store/data';
import { validateImportedEncounter } from './importEncounter';

type RelativeParticipant = Participant<typeof LEVEL_REPRESENTATION.Relative>;
type StoredVariant = NonNullable<EncounterTemplate['variants']>[number];

/**
 * Rebuilds template data from the stored encounter using only stored fields,
 * so any field the import drops makes the round trip fail.
 */
function toTemplateParticipant(
	participant: RelativeParticipant
): TemplateParticipant {
	const base = {
		id: participant.id as string,
		count: participant.count as number,
		relativeLevel: new LevelDifference(Number(participant.level)),
		side: participant.side,
		...(participant.tag === undefined ? {} : { tag: participant.tag }),
	};

	if (participant.type === 'hazard') {
		return {
			...base,
			type: 'hazard',
			role: participant.role as 'complex' | 'simple',
			successesToDisable: participant.successesToDisable,
			...(participant.hardness === undefined
				? {}
				: { hardnessValue: participant.hardness }),
		};
	}

	return {
		...base,
		type: 'creature',
		role: participant.role as string,
		...(participant.maxHealth === undefined
			? {}
			: { maxHealthOverride: participant.maxHealth }),
		...(participant.initiativeBonus === undefined
			? {}
			: { initiativeModifierOverride: participant.initiativeBonus }),
	};
}

function toTemplateEvent(slot: NarrativeSlot): Event {
	const base = {
		id: slot.id,
		turnIndex: slot.trigger.round - 1,
		...(slot.tag === undefined ? {} : { tag: slot.tag }),
	};

	if (slot.type === 'reinforcement') {
		return {
			...base,
			type: 'reinforcement',
			reinforcementParticipantIds: (slot.participants ?? []).map(
				(participant) => participant.id as string
			),
			...(slot.description === undefined
				? {}
				: { description: slot.description }),
		};
	}

	return {
		...base,
		type: 'narrative',
		description: slot.description as string,
		...(slot.accomplishmentLevel === undefined
			? {}
			: { accomplishmentLevel: slot.accomplishmentLevel }),
		...(slot.trigger.frequency === undefined
			? {}
			: { repeatInterval: slot.trigger.frequency }),
	};
}

function toTemplateVariant(variant: StoredVariant): EncounterVariant {
	const slots = variant.narrativeSlots ?? [];
	const reinforcements = slots.flatMap((slot) => slot.participants ?? []);

	return {
		id: variant.id as string,
		partySize: variant.partySize as number,
		...(variant.level === undefined ? {} : { partyLevel: variant.level }),
		participants: [...variant.participants, ...reinforcements].map(
			toTemplateParticipant
		),
		events: slots.map(toTemplateEvent),
		...(variant.description === undefined
			? {}
			: { description: variant.description }),
		...(variant.notes?.gm === undefined ? {} : { notes: variant.notes.gm }),
	};
}

function toTemplateData(encounter: EncounterTemplate): EncounterTemplateData {
	return {
		id: encounter.id,
		name: encounter.name,
		description: encounter.description,
		defaultVariantId: encounter.defaultVariantId as string,
		variants: (encounter.variants ?? []).map(toTemplateVariant),
		...(encounter.tags === undefined ? {} : { tags: encounter.tags }),
		...(encounter.createdAt === undefined
			? {}
			: { createdAt: encounter.createdAt }),
		...(encounter.updatedAt === undefined
			? {}
			: { updatedAt: encounter.updatedAt }),
	};
}

function importTemplate(template: EncounterTemplateData) {
	const [encounter, error, warnings] = validateImportedEncounter(
		JSON.stringify(template)
	);

	expect(error).toBe('');
	expect(encounter?.levelRepresentation).toBe(LEVEL_REPRESENTATION.Relative);

	return { encounter: encounter as EncounterTemplate, warnings };
}

const fullTemplate: EncounterTemplateData = {
	id: '0d3c1f7e-7f0a-4c55-9f43-2a4f1d0b9a10',
	name: 'Collapsing Shrine',
	description: 'Cultists defend a crumbling shrine',
	defaultVariantId: '6b0e2a52-3a8b-4d2e-8b44-6e7c1a9f0b21',
	tags: ['Severe', 'cultists'],
	createdAt: new Date('2026-09-01T10:00:00.000Z'),
	updatedAt: new Date('2026-10-01T12:30:00.000Z'),
	variants: [
		{
			id: '6b0e2a52-3a8b-4d2e-8b44-6e7c1a9f0b21',
			partySize: 4,
			partyLevel: 5,
			description: 'Party of four',
			notes: 'The priest flees below 10 HP',
			participants: [
				{
					id: '1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b01',
					type: 'creature',
					role: 'boss',
					tag: 'Cult Priest',
					count: 1,
					relativeLevel: new LevelDifference(2),
					side: ALIGNMENT.Opponents,
					maxHealthOverride: 95,
					initiativeModifierOverride: 3,
				},
				{
					id: '1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b02',
					type: 'creature',
					role: 'lackey',
					count: 2,
					relativeLevel: new LevelDifference(-2),
					side: ALIGNMENT.Opponents,
				},
				{
					id: '1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b03',
					type: 'hazard',
					role: 'complex',
					tag: 'Falling Ceiling',
					count: 1,
					relativeLevel: new LevelDifference(0),
					side: ALIGNMENT.Neutral,
					successesToDisable: 3,
					hardnessValue: 10,
				},
				{
					id: '1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b04',
					type: 'creature',
					role: 'lackey',
					tag: 'Acolyte',
					count: 2,
					relativeLevel: new LevelDifference(-3),
					side: ALIGNMENT.Opponents,
				},
			],
			events: [
				{
					id: '2b8e4c7d-1f9a-4d3b-8c2e-4a6f8b0d2c01',
					type: 'narrative',
					turnIndex: 0,
					tag: 'intro',
					description: 'The priest begins a chant',
					accomplishmentLevel: 'minor',
				},
				{
					id: '2b8e4c7d-1f9a-4d3b-8c2e-4a6f8b0d2c02',
					type: 'narrative',
					turnIndex: 1,
					description: 'Dust falls from the ceiling',
					repeatInterval: 2,
				},
				{
					id: '2b8e4c7d-1f9a-4d3b-8c2e-4a6f8b0d2c03',
					type: 'reinforcement',
					turnIndex: 2,
					tag: 'wave-2',
					reinforcementParticipantIds: ['1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b04'],
					description: 'Acolytes rush in',
				},
			],
		},
		{
			id: '6b0e2a52-3a8b-4d2e-8b44-6e7c1a9f0b22',
			partySize: 3,
			participants: [
				{
					id: '1a7d3b6c-0e8f-4c2a-9b1d-3f5e7a9c1b11',
					type: 'hazard',
					role: 'simple',
					count: 1,
					relativeLevel: new LevelDifference(1),
					side: ALIGNMENT.Opponents,
					successesToDisable: 1,
				},
			],
			events: [],
		},
	],
};

describe('validateImportedEncounter template round trip', () => {
	it.each(encounterTemplates.map((template) => [template.name, template]))(
		'reproduces built-in template %s exactly',
		(_name, template) => {
			const { encounter, warnings } = importTemplate(template);

			expect(warnings).toEqual([]);
			expect(toTemplateData(encounter)).toEqual(template);
		}
	);

	it.each(encounterTemplates.map((template) => [template.name, template]))(
		'derives each variant difficulty of %s from its XP budget',
		(_name, template) => {
			const { encounter } = importTemplate(template);
			const taggedDifficulty =
				DIFFICULTY[template.tags?.[0] as keyof typeof DIFFICULTY];

			expect(encounter.variants?.map((variant) => variant.difficulty)).toEqual(
				template.variants.map(() => taggedDifficulty)
			);
		}
	);

	it('keeps overrides, untagged participants, events and notes', () => {
		const { encounter, warnings } = importTemplate(fullTemplate);

		expect(warnings).toEqual([]);
		expect(toTemplateData(encounter)).toEqual(fullTemplate);
	});

	it('maps template fields onto the stored encounter', () => {
		const { encounter } = importTemplate(fullTemplate);
		const [priest, lackey, ceiling] = encounter.participants;

		expect(encounter.description).toBe('Cultists defend a crumbling shrine');
		expect(encounter.notes).toEqual({ gm: 'The priest flees below 10 HP' });
		expect(encounter.variants?.[0]?.level).toBe(5);
		expect(priest).toMatchObject({
			name: 'Cult Priest',
			maxHealth: 95,
			initiativeBonus: 3,
		});
		expect(lackey?.name).toBe('lackey');
		expect(ceiling).toMatchObject({ hardness: 10, isComplexHazard: true });
		// The reinforcement spawns from its slot, not at the start
		expect(encounter.participants).toHaveLength(3);
		expect(encounter.narrativeSlots).toMatchObject([
			{ type: 'default', trigger: { round: 1 } },
			{ type: 'ongoing', trigger: { round: 2, frequency: 2 } },
			{
				type: 'reinforcement',
				trigger: { round: 3 },
				participants: [{ name: 'Acolyte', count: 2 }],
			},
		]);
	});

	it('rejects timestamps that are not dates or date strings', () => {
		for (const createdAt of [0, null, 'not a date']) {
			const [encounter] = validateImportedEncounter(
				JSON.stringify({ ...fullTemplate, createdAt })
			);

			expect(encounter).toBeNull();
		}
	});

	it('warns about reinforcement references it cannot store', () => {
		const [defaultVariant, ...otherVariants] = fullTemplate.variants;
		const template: EncounterTemplateData = {
			...fullTemplate,
			variants: [
				{
					...defaultVariant,
					events: [
						{
							id: '2b8e4c7d-1f9a-4d3b-8c2e-4a6f8b0d2c09',
							type: 'reinforcement',
							turnIndex: 1,
							reinforcementParticipantIds: [
								'9f9f9f9f-0000-4000-8000-000000000001',
							],
						},
					],
				},
				...otherVariants,
			],
		};

		const { warnings } = importTemplate(template);

		expect(warnings).toEqual([
			'Variant 1: reinforcement event 2b8e4c7d-1f9a-4d3b-8c2e-4a6f8b0d2c09 references unknown participant 9f9f9f9f-0000-4000-8000-000000000001',
		]);
	});
});
