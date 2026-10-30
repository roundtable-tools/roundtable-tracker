import { describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	type Character,
} from './data';
import {
	encounterToTrackerHeader,
	narrativeSlotsToTimeline,
	runtimeToInitiativeQueue,
	runtimeToOutOfInitiativeData,
	runtimeToPlayerInitiativeQueue,
} from './trackerMappers';
import type { TrackerParticipantMeta } from './encounterRuntimeStore';

const createCharacter = (overrides: Partial<Character>): Character => ({
	uuid: 'character',
	name: 'Character',
	initiative: 0,
	turnState: 'normal',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
	...overrides,
});

const createMeta = (
	overrides: Partial<TrackerParticipantMeta>
): TrackerParticipantMeta => ({
	role: 'opponent',
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
	...overrides,
});

describe('trackerMappers', () => {
	it('keeps a delayed participant at its spot in the runtime initiative order', () => {
		const charactersMap = {
			bravo: createCharacter({
				uuid: 'bravo',
				name: 'Bravo',
				initiative: 10,
			}),
			alpha: createCharacter({
				uuid: 'alpha',
				name: 'Alpha',
				initiative: 20,
			}),
			delta: createCharacter({
				uuid: 'delta',
				name: 'Delta',
				initiative: 30,
				turnState: 'delayed',
			}),
		};
		const trackerMetaMap = {
			bravo: createMeta({ role: 'pc' }),
			alpha: createMeta({ role: 'opponent' }),
			delta: createMeta({ role: 'ally' }),
		};

		const queue = runtimeToInitiativeQueue({
			charactersOrder: ['bravo', 'alpha', 'delta'],
			charactersMap,
			trackerMetaMap,
		});

		expect(queue.map((participant) => participant.id)).toEqual([
			'bravo',
			'alpha',
			'delta',
		]);
	});

	it('maps delayed participants into out-of-initiative delayed section', () => {
		const charactersMap = {
			delayed: createCharacter({
				uuid: 'delayed',
				name: 'Delayed Character',
				turnState: 'delayed',
			}),
		};
		const trackerMetaMap = {
			delayed: createMeta({ role: 'pc' }),
		};

		const outOfInitiative = runtimeToOutOfInitiativeData({
			charactersOrder: ['delayed'],
			charactersMap,
			trackerMetaMap,
			encounterData: undefined,
			partyLevel: 5,
		});

		expect(outOfInitiative.delayed).toHaveLength(1);
		expect(outOfInitiative.delayed[0].id).toBe('delayed');
		expect(outOfInitiative.delayed[0].state).toBe('delayed');
	});

	it('shows persistent damage to players', () => {
		const bleed = { id: 'b', amount: 3, icon: 'bleed' as const };
		const fire = {
			id: 'f',
			name: '2d6 fire',
			amount: 7,
			icon: 'fire' as const,
		};
		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: ['burning'],
			charactersMap: {
				burning: createCharacter({
					uuid: 'burning',
					persistentDamage: [bleed, fire],
				}),
			},
			trackerMetaMap: { burning: createMeta({}) },
		});

		expect(queue[0].persistentDamage).toEqual([bleed, fire]);
	});

	it('shows persistent damage to players without HP data', () => {
		const sonic = { id: 's', name: '1d6 sonic', icon: 'other' as const };
		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: ['ezren'],
			charactersMap: {
				ezren: createCharacter({ uuid: 'ezren', persistentDamage: [sonic] }),
			},
			trackerMetaMap: { ezren: createMeta({ hasHealthData: false }) },
		});

		expect(queue[0]).toMatchObject({
			hpSegments: null,
			persistentDamage: [sonic],
		});
	});

	it('builds a player-safe initiative queue with HP tiers', () => {
		const charactersMap = {
			healthy: createCharacter({
				uuid: 'healthy',
				name: 'Healthy',
				health: 18,
				maxHealth: 20,
			}),
			wounded: createCharacter({
				uuid: 'wounded',
				name: 'Wounded',
				health: 8,
				maxHealth: 20,
				turnState: 'delayed',
			}),
			defeated: createCharacter({
				uuid: 'defeated',
				name: 'Defeated',
				health: 0,
				maxHealth: 20,
				turnState: 'knocked-out',
			}),
		};
		const trackerMetaMap = {
			healthy: createMeta({ role: 'pc', sideTheme: 'pc' }),
			wounded: createMeta({ role: 'opponent', sideTheme: 'opponent' }),
			defeated: createMeta({ role: 'ally', sideTheme: 'ally' }),
		};

		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: ['healthy', 'wounded', 'defeated'],
			charactersMap,
			trackerMetaMap,
		});

		expect(queue).toEqual([
			{
				id: 'healthy',
				name: 'Healthy',
				status: 'Ready',
				hpLabel: 'Barely Injured',
				hpSegments: 4,
				isHazard: false,
				disableProgress: null,
				persistentDamage: [],
				sideTheme: 'pc',
			},
			{
				id: 'wounded',
				name: 'Wounded',
				status: 'Delayed',
				hpLabel: 'Badly Injured',
				hpSegments: 2,
				isHazard: false,
				disableProgress: null,
				persistentDamage: [],
				sideTheme: 'opponent',
			},
			{
				id: 'defeated',
				name: 'Defeated',
				status: 'Knocked Out',
				hpLabel: 'Unconscious',
				hpSegments: 0,
				isHazard: false,
				disableProgress: null,
				persistentDamage: [],
				sideTheme: 'ally',
			},
		]);
	});

	it('maps HP to the five tiers, and a knock-out to Unconscious', () => {
		const participants = [
			['uninjured', 20, 'normal'],
			['barely', 17, 'normal'],
			['injured', 13, 'normal'],
			['badly', 7, 'normal'],
			['near-death', 6, 'normal'],
			['knocked-out', 15, 'knocked-out'],
		] as const;
		const charactersMap = Object.fromEntries(
			participants.map(([uuid, health, turnState]) => [
				uuid,
				createCharacter({ uuid, health, maxHealth: 20, turnState }),
			])
		);

		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: participants.map(([uuid]) => uuid),
			charactersMap,
			trackerMetaMap: {},
		});

		expect(
			queue.map(({ id, hpLabel, hpSegments }) => [id, hpLabel, hpSegments])
		).toEqual([
			['uninjured', 'Uninjured', 5],
			['barely', 'Barely Injured', 4],
			['injured', 'Injured', 3],
			['badly', 'Badly Injured', 2],
			['near-death', 'Near Death', 1],
			['knocked-out', 'Unconscious', 0],
		]);
	});

	it('shows hazard disable checks with the tracker labels instead of HP', () => {
		const hazards = [
			['none', 0, 4],
			['under-half', 1, 4],
			['half', 2, 4],
			['over-half', 2, 3],
			['three-of-four', 3, 4],
			['one-of-two', 1, 2],
			['all', 4, 4],
		] as const;
		const charactersMap = Object.fromEntries(
			hazards.map(([uuid]) => [uuid, createCharacter({ uuid })])
		);
		const trackerMetaMap = Object.fromEntries(
			hazards.map(([uuid, succeeded, required]) => [
				uuid,
				createMeta({
					role: 'hazard',
					disableChecksSucceeded: succeeded,
					disableChecksRequired: required,
				}),
			])
		);

		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: hazards.map(([uuid]) => uuid),
			charactersMap,
			trackerMetaMap,
		});

		expect(
			queue.map(({ id, disableProgress }) => [id, disableProgress])
		).toEqual([
			['none', { succeeded: 0, required: 4, label: 'Stable' }],
			['under-half', { succeeded: 1, required: 4, label: 'Disrupted' }],
			['half', { succeeded: 2, required: 4, label: 'Compromised' }],
			['over-half', { succeeded: 2, required: 3, label: 'Fracturing' }],
			['three-of-four', { succeeded: 3, required: 4, label: 'Critical' }],
			['one-of-two', { succeeded: 1, required: 2, label: 'Disrupted' }],
			['all', { succeeded: 4, required: 4, label: 'Disabled' }],
		]);
	});

	it('shows HP for a creature even with disable checks set', () => {
		const queue = runtimeToPlayerInitiativeQueue({
			charactersOrder: ['ogre'],
			charactersMap: { ogre: createCharacter({ uuid: 'ogre' }) },
			trackerMetaMap: {
				ogre: createMeta({ role: 'opponent', disableChecksRequired: 2 }),
			},
		});

		expect(queue[0].disableProgress).toBeNull();
		expect(queue[0].hpLabel).toBe('Uninjured');
	});

	it('maps additional participant metadata into tracker participants', () => {
		const charactersMap = {
			alpha: createCharacter({
				uuid: 'alpha',
				name: 'Alpha',
				initiative: 18,
			}),
		};
		const trackerMetaMap = {
			alpha: createMeta({
				initiativeBonus: 3,
				hardness: 8,
				dcs: [
					{
						name: 'Disable',
						value: 24,
						icon: 'shield',
						disableSuccesses: 2,
					},
				],
				adjustmentDescription: 'Custom elite skew',
				adjustmentLevelModifier: 0.5,
				traits: ['Goblin', 'Small'],
			}),
		};

		const queue = runtimeToInitiativeQueue({
			charactersOrder: ['alpha'],
			charactersMap,
			trackerMetaMap,
		});

		expect(queue[0]).toMatchObject({
			initiativeBonus: 3,
			hardness: 8,
			adjustmentDescription: 'Custom elite skew',
			adjustmentLevelModifier: 0.5,
			traits: ['Goblin', 'Small'],
		});
		expect(queue[0].dcs?.[0]).toMatchObject({
			name: 'Disable',
			value: 24,
			disableSuccesses: 2,
		});
	});

	it('shows the traits of reinforcements that have not arrived yet', () => {
		const outOfInitiative = runtimeToOutOfInitiativeData({
			charactersOrder: [],
			charactersMap: {},
			trackerMetaMap: {},
			encounterData: {
				id: 'ambush',
				name: 'Ambush',
				description: '',
				difficulty: DIFFICULTY.Moderate,
				partySize: 4,
				levelRepresentation: LEVEL_REPRESENTATION.Exact,
				level: 3,
				participants: [],
				narrativeSlots: [
					{
						id: 'guard-arrives',
						type: 'reinforcement',
						trigger: { round: 2 },
						participants: [
							{
								type: 'creature',
								name: 'Guard',
								level: '+0',
								side: ALIGNMENT.Opponents,
								traits: ['Human', 'Medium'],
							},
						],
					},
				],
			},
			partyLevel: 3,
		});

		expect(outOfInitiative.reinforcements[0]?.traits).toEqual([
			'Human',
			'Medium',
		]);
	});

	it('marks what pending reinforcements keep from the players', () => {
		const slot = (
			id: string,
			visibleBeforeTrigger: boolean | undefined,
			hiddenUntilFirstTurn: boolean | undefined
		) => ({
			id,
			type: 'reinforcement' as const,
			trigger: { round: 2 },
			visibleBeforeTrigger,
			participants: [
				{
					type: 'creature' as const,
					name: id,
					level: '+0' as const,
					side: ALIGNMENT.Opponents,
					hiddenUntilFirstTurn,
				},
			],
		});
		const outOfInitiative = runtimeToOutOfInitiativeData({
			charactersOrder: [],
			charactersMap: {},
			trackerMetaMap: {},
			encounterData: {
				id: 'ambush',
				name: 'Ambush',
				description: '',
				difficulty: DIFFICULTY.Moderate,
				partySize: 4,
				levelRepresentation: LEVEL_REPRESENTATION.Exact,
				level: 3,
				participants: [],
				narrativeSlots: [
					slot('hidden-slot', undefined, undefined),
					slot('visible-slot', true, undefined),
					slot('hidden-participant', true, true),
				],
			},
			partyLevel: 3,
		});

		expect(
			outOfInitiative.reinforcements.map(
				({ name, hiddenUntilArrival, hiddenUntilFirstTurn }) => ({
					name,
					hiddenUntilArrival,
					hiddenUntilFirstTurn,
				})
			)
		).toEqual([
			{
				name: 'hidden-slot',
				hiddenUntilArrival: true,
				hiddenUntilFirstTurn: undefined,
			},
			{
				name: 'visible-slot',
				hiddenUntilArrival: false,
				hiddenUntilFirstTurn: undefined,
			},
			{
				name: 'hidden-participant',
				hiddenUntilArrival: false,
				hiddenUntilFirstTurn: true,
			},
		]);
	});

	describe('a reinforcement without a trigger round', () => {
		const slots = [
			{
				id: 'second-phase',
				type: 'reinforcement' as const,
				description: 'The lich rises',
				trigger: {},
			},
			{
				id: 'bell',
				type: 'default' as const,
				description: 'The bell tolls',
				trigger: { round: 3 },
			},
		];

		it('has no place on the round timeline', () => {
			expect(narrativeSlotsToTimeline(slots).map(({ id }) => id)).toEqual([
				'bell',
			]);
		});

		it('is listed for any round in the narrative details', () => {
			const header = encounterToTrackerHeader(
				{
					id: 'lair',
					name: 'Lair',
					description: '',
					difficulty: DIFFICULTY.Moderate,
					partySize: 4,
					levelRepresentation: LEVEL_REPRESENTATION.Exact,
					level: 3,
					participants: [],
					narrativeSlots: slots,
				},
				3,
				1
			);

			expect(header.narrativeDetails).toEqual([
				'Any round: The lich rises',
				'Round 3: The bell tolls',
			]);
		});
	});
});
