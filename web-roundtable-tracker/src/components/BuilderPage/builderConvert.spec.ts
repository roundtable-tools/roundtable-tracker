import { describe, expect, it } from 'vitest';
import { fromEncounterTemplate } from './builderConvert';
import { ALIGNMENT } from '@/store/data';
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