import { describe, expect, it } from 'vitest';
import {
	defaultFormValues,
	fromEncounterTemplate,
	toConcreteEncounter,
} from './builderConvert';
import { computeEncounterXpUsage, type BuilderSlot } from './builderXp';
import { Threat } from '@/models/utility/threat/Threat.class';
import { ALIGNMENT, DIFFICULTY } from '@/store/data';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import type { EncounterTemplateData } from '@/models/encounters/encounter.types';

const template: EncounterTemplateData = {
	id: '6a338591-0cf0-4e99-801b-d37eef5b3425',
	name: 'Template Encounter',
	description: 'Template entry',
	defaultVariantId: '1f4209c4-dc76-471e-b60f-90f71d1360a5',
	variants: [
		{
			id: '1f4209c4-dc76-471e-b60f-90f71d1360a5',
			partySize: 4,
			participants: [
				{
					id: 'c8d8712d-9863-4345-86e6-9a51bf1ce17c',
					type: 'creature',
					role: 'boss',
					tag: 'Boss',
					count: 1,
					relativeLevel: new LevelDifference(2),
					side: ALIGNMENT.Opponents,
				},
			],
			events: [],
		},
	],
};

describe('fromEncounterTemplate', () => {
	it('resolves participant levels relative to the selected party level', () => {
		const formValues = fromEncounterTemplate(template, template.variants[0], {
			partyLevel: 5,
		});

		expect(formValues.partyLevel).toBe(5);
		expect(formValues.slots[0]?.level).toBe(7);
	});

	it('maps template participant overrides into additional-data fields', () => {
		const enrichedTemplate: EncounterTemplateData = {
			...template,
			variants: [
				{
					...template.variants[0],
					participants: [
						{
							id: 'creature-override',
							type: 'creature',
							role: 'opponent',
							count: 1,
							relativeLevel: new LevelDifference(1),
							side: ALIGNMENT.Opponents,
							maxHealthOverride: 77,
							initiativeModifierOverride: 4,
						},
						{
							id: 'hazard-override',
							type: 'hazard',
							role: 'simple',
							count: 1,
							relativeLevel: new LevelDifference(0),
							side: ALIGNMENT.Opponents,
							successesToDisable: 3,
							hardnessValue: 12,
						},
					],
				},
			],
		};

		const formValues = fromEncounterTemplate(
			enrichedTemplate,
			enrichedTemplate.variants[0],
			{ partyLevel: 5 }
		);

		expect(formValues.slots[0]?.maxHealth).toBe(77);
		expect(formValues.slots[0]?.initiativeBonus).toBe(4);
		expect(formValues.slots[1]?.hardness).toBe(12);
	});
});

describe('toConcreteEncounter difficulty', () => {
	const slot = (overrides: Partial<BuilderSlot>): BuilderSlot => ({
		id: 'slot',
		type: 'creature',
		name: 'Guard',
		description: '',
		side: 'enemy',
		level: 5,
		count: 1,
		successesToDisable: 1,
		adjustment: 'none',
		isSimpleHazard: false,
		reinforcementRound: 1,
		eventRound: 1,
		...overrides,
	});

	it('counts reinforcements, using the effective XP the builder shows', () => {
		const slots = [
			slot({ id: 'main', count: 2 }), // 80 XP, Moderate on its own
			slot({ id: 'wave', type: 'reinforcement', reinforcementRound: 1 }),
		];
		const values = {
			...defaultFormValues(),
			partyLevel: 5,
			partySize: 4,
			slots,
		};
		const usage = computeEncounterXpUsage(slots, 5, 4);

		expect(usage.effectiveXp.valueOf()).toBe(120);
		expect(Threat.fromExperienceBudget(usage.effectiveXp, 4).toLabel()).toBe(
			'Severe'
		);
		expect(toConcreteEncounter(values).difficulty).toBe(DIFFICULTY.Severe);
	});

	it('saves the same threat for a builder variant with reinforcements', () => {
		const slots = [
			slot({ id: 'main', count: 2 }),
			slot({ id: 'wave', type: 'reinforcement', reinforcementRound: 1 }),
		];
		const values = {
			...defaultFormValues(),
			partyLevel: 5,
			partySize: 4,
			slots: [slot({ id: 'main', count: 2 })],
			variants: [
				{
					id: 'variant',
					description: 'With reinforcements',
					partyLevel: 5,
					partySize: 4,
					slots,
				},
			],
		};

		const encounter = toConcreteEncounter(values);

		expect(encounter.difficulty).toBe(DIFFICULTY.Moderate);
		expect(encounter.variants?.[0]?.difficulty).toBe(DIFFICULTY.Severe);
	});
});
