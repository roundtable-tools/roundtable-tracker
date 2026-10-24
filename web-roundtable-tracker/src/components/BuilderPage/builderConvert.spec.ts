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
				name: 'Hidden',
				combatReadyState: 'active',
				hiddenUntilFirstTurn: true,
				initiativeDescription: 'Rolls Stealth',
			}),
			slot({
				name: 'Defeated',
				type: 'hazard',
				combatReadyState: 'knocked-out',
				hiddenUntilFirstTurn: true,
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
						combatReadyState: 'knocked-out',
						hiddenUntilFirstTurn: true,
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
					hiddenUntilFirstTurn,
					initiativeDescription,
				}) => ({
					name,
					startingState,
					hiddenUntilFirstTurn,
					initiativeDescription,
				})
			)
		).toEqual([
			{
				name: 'Active',
				startingState: 'normal',
				hiddenUntilFirstTurn: undefined,
				initiativeDescription: undefined,
			},
			{
				name: 'Hidden',
				startingState: 'normal',
				hiddenUntilFirstTurn: true,
				initiativeDescription: 'Rolls Stealth',
			},
			{
				name: 'Defeated',
				startingState: 'knocked-out',
				hiddenUntilFirstTurn: true,
				initiativeDescription: undefined,
			},
		]);
		expect(encounter.narrativeSlots?.[0]?.participants?.[0]).toMatchObject({
			startingState: 'knocked-out',
			hiddenUntilFirstTurn: true,
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
					hiddenUntilFirstTurn,
					initiativeDescription,
				}) => ({
					name,
					combatReadyState,
					hiddenUntilFirstTurn,
					initiativeDescription,
				})
			)
		).toEqual([
			{
				name: 'Active',
				combatReadyState: 'active',
				hiddenUntilFirstTurn: false,
				initiativeDescription: undefined,
			},
			{
				name: 'Hidden',
				combatReadyState: 'active',
				hiddenUntilFirstTurn: true,
				initiativeDescription: 'Rolls Stealth',
			},
			{
				name: 'Defeated',
				combatReadyState: 'knocked-out',
				hiddenUntilFirstTurn: true,
				initiativeDescription: undefined,
			},
			{
				name: '',
				combatReadyState: undefined,
				hiddenUntilFirstTurn: undefined,
				initiativeDescription: undefined,
			},
		]);
		expect(loaded.slots[3]?.reinforcementParticipants?.[0]).toMatchObject({
			combatReadyState: 'knocked-out',
			hiddenUntilFirstTurn: true,
			initiativeDescription: 'Fortune',
		});
	});

	it('saves a reinforcement without a round as triggerable in any round', () => {
		const encounter = toConcreteEncounter({
			...values,
			slots: [slot({ type: 'reinforcement', reinforcementRound: undefined })],
		});

		expect(encounter.narrativeSlots?.[0]?.trigger.round).toBeUndefined();
		expect(
			fromConcreteEncounter(encounter).slots[0]?.reinforcementRound
		).toBeUndefined();
	});

	it('saves whether a reinforcement shows its participants before arrival', () => {
		const encounter = toConcreteEncounter({
			...values,
			slots: [
				slot({
					type: 'reinforcement',
					reinforcementVisibleBeforeTrigger: true,
				}),
				slot({ type: 'reinforcement' }),
			],
		});

		expect(
			encounter.narrativeSlots?.map((slot) => slot.visibleBeforeTrigger)
		).toEqual([true, undefined]);
		expect(
			fromConcreteEncounter(encounter).slots.map(
				(slot) => slot.reinforcementVisibleBeforeTrigger
			)
		).toEqual([true, false]);
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
			startingState: 'normal',
			hiddenUntilFirstTurn: true,
			initiativeDescription: 'Rolls Stealth',
		});
		expect(loaded.variants[0]?.slots[2]).toMatchObject({
			combatReadyState: 'knocked-out',
			hiddenUntilFirstTurn: true,
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
		).toEqual(['normal', 'normal', 'knocked-out']);
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

describe('creature disable checks round trip', () => {
	const values: BuilderFormValues = {
		...defaultFormValues(),
		name: 'Clockwork',
		partyLevel: 3,
		slots: [
			{ ...defaultSlot(), name: 'Clockwork Soldier', successesToDisable: 2 },
			{ ...defaultSlot(), name: 'Goblin' },
			{
				...defaultSlot(),
				type: 'reinforcement',
				reinforcementRound: 2,
				reinforcementParticipants: [
					{
						id: 'reinforcement-participant',
						type: 'creature',
						name: 'Clockwork Spy',
						side: 'opponent',
						level: 2,
						count: 1,
						successesToDisable: 3,
						adjustment: 'none',
						isSimpleHazard: false,
					},
				],
			},
		],
	};

	it('starts a new creature slot without disable checks', () => {
		expect(defaultSlot().successesToDisable).toBe(0);
	});

	it('saves only the disable checks a creature has, and loads them back', () => {
		const encounter = toConcreteEncounter(values);
		const loaded = fromConcreteEncounter(encounter);

		expect(
			encounter.participants.map(
				(participant) => participant.successesToDisable
			)
		).toEqual([2, undefined]);
		expect(
			encounter.narrativeSlots?.[0]?.participants?.[0]?.successesToDisable
		).toBe(3);
		expect(
			loaded.slots
				.slice(0, 2)
				.map(({ successesToDisable }) => successesToDisable)
		).toEqual([2, 0]);
		expect(
			loaded.slots[2]?.reinforcementParticipants?.[0]?.successesToDisable
		).toBe(3);
		expect(
			ConcreteEncounterSchema.shape.participants.parse(encounter.participants)
		).toEqual(encounter.participants);
	});

	it('passes a creature disable count to the tracker', () => {
		const [clockwork, goblin] = toConcreteEncounter(values).participants;
		const config = {
			tiePriority: PRIORITY.NPC,
			initiative: 10,
			maxHealth: 10,
			health: 10,
			tempHealth: 0,
		};
		const metaMap = buildTrackerMetaMap([
			{ ...clockwork, uuid: 'clockwork', ...config },
			{ ...goblin, uuid: 'goblin', ...config },
		]);

		expect(metaMap.clockwork?.disableChecksRequired).toBe(2);
		expect(metaMap.clockwork?.role).toBe('opponent');
		expect(metaMap.goblin?.disableChecksRequired).toBe(0);
	});
});
