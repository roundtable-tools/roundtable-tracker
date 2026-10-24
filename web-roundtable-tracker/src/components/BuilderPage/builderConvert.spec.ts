import { describe, expect, it } from 'vitest';
import {
	defaultFormValues,
	defaultSlot,
	fromConcreteEncounter,
	fromEncounterTemplate,
	toConcreteEncounter,
	type BuilderFormValues,
} from './builderConvert';
import type { BuilderSlot } from './builderXp';
import {
	ALIGNMENT,
	ConcreteEncounterSchema,
	PRIORITY,
	characterConfigToCharacter,
} from '@/store/data';
import { buildTrackerMetaMap } from '@/store/convert';
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

describe('combat ready fields round trip', () => {
	const slot = (overrides: Partial<BuilderSlot>): BuilderSlot => ({
		...defaultSlot(),
		...overrides,
	});

	const values: BuilderFormValues = {
		...defaultFormValues(),
		name: 'Combat ready',
		partyLevel: 3,
		slots: [
			slot({ name: 'Active', combatReadyState: 'active' }),
			slot({
				name: 'Delayed',
				combatReadyState: 'delayed',
				initiativeDescription: 'Rolls Stealth',
			}),
			slot({
				name: 'Defeated',
				type: 'hazard',
				combatReadyState: 'knocked-out',
				hiddenFromPlayers: true,
			}),
			slot({
				type: 'reinforcement',
				reinforcementRound: 2,
				reinforcementParticipants: [
					{
						id: 'reinforcement-participant',
						type: 'creature',
						name: 'Hidden reinforcement',
						side: 'opponent',
						level: 4,
						count: 1,
						successesToDisable: 1,
						adjustment: 'none',
						isSimpleHazard: false,
						combatReadyState: 'delayed',
						hiddenFromPlayers: true,
						initiativeDescription: 'Fortune',
					},
				],
			}),
		],
	};

	it('maps combat ready state to startingState and saves the other fields', () => {
		const encounter = toConcreteEncounter(values);

		expect(
			encounter.participants.map(
				({
					name,
					startingState,
					hiddenFromPlayers,
					initiativeDescription,
				}) => ({
					name,
					startingState,
					hiddenFromPlayers,
					initiativeDescription,
				})
			)
		).toEqual([
			{
				name: 'Active',
				startingState: 'normal',
				hiddenFromPlayers: undefined,
				initiativeDescription: undefined,
			},
			{
				name: 'Delayed',
				startingState: 'delayed',
				hiddenFromPlayers: undefined,
				initiativeDescription: 'Rolls Stealth',
			},
			{
				name: 'Defeated',
				startingState: 'knocked-out',
				hiddenFromPlayers: true,
				initiativeDescription: undefined,
			},
		]);
		expect(encounter.narrativeSlots?.[0]?.participants?.[0]).toMatchObject({
			startingState: 'delayed',
			hiddenFromPlayers: true,
			initiativeDescription: 'Fortune',
		});
	});

	it('loads the saved fields back into the builder', () => {
		const loaded = fromConcreteEncounter(toConcreteEncounter(values));

		expect(
			loaded.slots.map(
				({
					name,
					combatReadyState,
					hiddenFromPlayers,
					initiativeDescription,
				}) => ({
					name,
					combatReadyState,
					hiddenFromPlayers,
					initiativeDescription,
				})
			)
		).toEqual([
			{
				name: 'Active',
				combatReadyState: 'active',
				hiddenFromPlayers: false,
				initiativeDescription: undefined,
			},
			{
				name: 'Delayed',
				combatReadyState: 'delayed',
				hiddenFromPlayers: false,
				initiativeDescription: 'Rolls Stealth',
			},
			{
				name: 'Defeated',
				combatReadyState: 'knocked-out',
				hiddenFromPlayers: true,
				initiativeDescription: undefined,
			},
			{
				name: '',
				combatReadyState: undefined,
				hiddenFromPlayers: undefined,
				initiativeDescription: undefined,
			},
		]);
		expect(loaded.slots[3]?.reinforcementParticipants?.[0]).toMatchObject({
			combatReadyState: 'delayed',
			hiddenFromPlayers: true,
			initiativeDescription: 'Fortune',
		});
	});

	it('saves a silent delay as a delayed starting state and loads it back', () => {
		const silentValues: BuilderFormValues = {
			...values,
			slots: [
				slot({ name: 'Lurker', combatReadyState: 'delayed-silent' }),
				slot({
					type: 'reinforcement',
					reinforcementRound: 2,
					reinforcementParticipants: [
						{
							id: 'silent-reinforcement',
							type: 'creature',
							name: 'Second phase',
							side: 'opponent',
							level: 4,
							count: 1,
							successesToDisable: 1,
							adjustment: 'none',
							isSimpleHazard: false,
							combatReadyState: 'delayed-silent',
						},
					],
				}),
			],
		};
		const encounter = toConcreteEncounter(silentValues);

		expect(encounter.participants[0]).toMatchObject({
			startingState: 'delayed',
			silentDelay: true,
		});
		expect(encounter.narrativeSlots?.[0]?.participants?.[0]).toMatchObject({
			startingState: 'delayed',
			silentDelay: true,
		});
		expect(toConcreteEncounter(values).participants[1]?.silentDelay).toBe(
			undefined
		);

		const loaded = fromConcreteEncounter(encounter);

		expect(loaded.slots[0]?.combatReadyState).toBe('delayed-silent');
		expect(
			loaded.slots[1]?.reinforcementParticipants?.[0]?.combatReadyState
		).toBe('delayed-silent');
	});

	it('keeps the fields in saved variants', () => {
		const encounter = toConcreteEncounter({
			...values,
			variants: [
				{
					id: 'variant',
					description: 'Variant',
					partyLevel: 3,
					partySize: 4,
					slots: values.slots,
				},
			],
		});
		const loaded = fromConcreteEncounter(encounter);

		expect(encounter.variants?.[0]?.participants[1]).toMatchObject({
			startingState: 'delayed',
			initiativeDescription: 'Rolls Stealth',
		});
		expect(loaded.variants[0]?.slots[2]).toMatchObject({
			combatReadyState: 'knocked-out',
			hiddenFromPlayers: true,
		});
	});

	it('keeps the fields when the saved participants are validated', () => {
		const { participants } = toConcreteEncounter(values);

		expect(
			ConcreteEncounterSchema.shape.participants.parse(participants)
		).toEqual(participants);
	});

	it('starts saved participants in their combat ready state', () => {
		const { participants } = toConcreteEncounter(values);

		expect(
			participants.map(
				(participant, index) =>
					characterConfigToCharacter({
						...participant,
						uuid: `participant-${index}`,
						tiePriority: PRIORITY.NPC,
						initiative: 10,
						maxHealth: 10,
						health: 10,
						tempHealth: 0,
					}).turnState
			)
		).toEqual(['normal', 'delayed', 'knocked-out']);
	});
});

describe('traits round trip', () => {
	const values: BuilderFormValues = {
		...defaultFormValues(),
		name: 'Traits',
		partyLevel: 3,
		slots: [
			{ ...defaultSlot(), name: 'Goblin', traits: ['Goblin', 'Small'] },
			{ ...defaultSlot(), name: 'Trap', type: 'hazard', traits: ['Rare'] },
			{ ...defaultSlot(), name: 'Plain', traits: [] },
			{
				...defaultSlot(),
				type: 'reinforcement',
				reinforcementRound: 2,
				reinforcementParticipants: [
					{
						id: 'reinforcement-participant',
						type: 'creature',
						name: 'Ogre',
						side: 'opponent',
						level: 4,
						count: 1,
						successesToDisable: 1,
						adjustment: 'none',
						isSimpleHazard: false,
						traits: ['Giant', 'Large'],
					},
				],
			},
		],
	};

	it('saves traits and loads them back into the builder', () => {
		const encounter = toConcreteEncounter(values);
		const loaded = fromConcreteEncounter(encounter);

		expect(encounter.participants.map(({ traits }) => traits)).toEqual([
			['Goblin', 'Small'],
			['Rare'],
			undefined,
		]);
		expect(encounter.narrativeSlots?.[0]?.participants?.[0]?.traits).toEqual([
			'Giant',
			'Large',
		]);
		expect(loaded.slots.slice(0, 3).map(({ traits }) => traits)).toEqual([
			['Goblin', 'Small'],
			['Rare'],
			[],
		]);
		expect(loaded.slots[3]?.reinforcementParticipants?.[0]?.traits).toEqual([
			'Giant',
			'Large',
		]);
	});

	it('keeps traits in saved variants', () => {
		const encounter = toConcreteEncounter({
			...values,
			variants: [
				{
					id: 'variant',
					description: 'Variant',
					partyLevel: 3,
					partySize: 4,
					slots: values.slots,
				},
			],
		});

		expect(encounter.variants?.[0]?.participants[0]?.traits).toEqual([
			'Goblin',
			'Small',
		]);
		expect(
			fromConcreteEncounter(encounter).variants[0]?.slots[1]?.traits
		).toEqual(['Rare']);
	});

	it('keeps traits when the saved participants are validated', () => {
		const { participants } = toConcreteEncounter(values);

		expect(
			ConcreteEncounterSchema.shape.participants.parse(participants)
		).toEqual(participants);
	});

	it('passes saved traits to the tracker', () => {
		const [goblin] = toConcreteEncounter(values).participants;
		const metaMap = buildTrackerMetaMap([
			{
				...goblin,
				uuid: 'goblin',
				tiePriority: PRIORITY.NPC,
				initiative: 10,
				maxHealth: 10,
				health: 10,
				tempHealth: 0,
			},
		]);

		expect(metaMap.goblin?.traits).toEqual(['Goblin', 'Small']);
	});
});
