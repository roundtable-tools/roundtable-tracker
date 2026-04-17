import { describe, expect, it } from 'vitest';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import { ALIGNMENT, DIFFICULTY, LEVEL_REPRESENTATION } from '@/store/data';
import { validateImportedEncounter } from './importEncounter';

describe('validateImportedEncounter', () => {
	it('accepts concrete encounter JSON', () => {
		const [encounter, error] = validateImportedEncounter(
			JSON.stringify({
				name: 'Imported Encounter',
				description: 'Imported Encounter',
				difficulty: DIFFICULTY.Trivial,
				level: 1,
				partySize: 4,
				participants: [],
			})
		);

		expect(error).toBe('');
		expect(encounter).not.toBeNull();
		expect(encounter?.levelRepresentation).toBe(LEVEL_REPRESENTATION.Exact);
	});

	it('preserves all variants from imported concrete encounter JSON', () => {
		const [encounter, error] = validateImportedEncounter(
			JSON.stringify({
				id: 'aff94c20-656c-4687-bfda-ae7ffe970d74',
				name: 'The Haunted Woods (10ChP)',
				levelRepresentation: 1,
				level: 1,
				partySize: 4,
				difficulty: 2,
				description:
					'When the PCs emerge into a clearing in the woods, restless dead stand ready to attack them.',
				participants: [
					{
						type: 'creature',
						name: 'Flaming skull skeleton guard',
						level: -1,
						side: 1,
						count: 4,
						description: 'Variant skeleton guard',
					},
					{
						type: 'creature',
						name: 'Flaming skull skeletal champion',
						level: 2,
						side: 1,
						count: 0,
						description: 'Variant skeletal champion',
					},
				],
				variants: [
					{
						level: 1,
						partySize: 5,
						difficulty: 2,
						description: '10ChP',
						participants: [
							{
								type: 'creature',
								name: 'Flaming skull skeleton guard',
								level: -1,
								side: 1,
								count: 5,
								description: 'Variant skeleton guard',
							},
						],
					},
					{
						level: 3,
						partySize: 6,
						difficulty: 2,
						description: '23ChP',
						participants: [
							{
								type: 'creature',
								name: 'Flaming skull skeleton guard',
								level: -1,
								side: 1,
								count: 0,
								description: 'Variant skeleton guard',
							},
							{
								type: 'creature',
								name: 'Flaming skull skeletal champion',
								level: 2,
								side: 1,
								count: 4,
								description: 'Variant skeletal champion',
							},
						],
					},
				],
				notes: {
					gm: 'Creatures attack the nearest PC and begin with Screaming Skull when possible.',
				},
			})
		);

		expect(error).toBe('');
		expect(encounter).not.toBeNull();
		expect(encounter?.levelRepresentation).toBe(LEVEL_REPRESENTATION.Exact);
		expect(encounter?.variants).toHaveLength(2);
		expect(encounter?.variants?.[0]?.description).toBe('10ChP');
		expect(encounter?.variants?.[0]?.participants[0]?.count).toBe(5);
		expect(encounter?.variants?.[1]?.description).toBe('23ChP');
		expect(encounter?.variants?.[1]?.participants[0]?.count).toBe(0);
		expect(encounter?.variants?.[1]?.participants[1]?.count).toBe(4);
	});

	it('accepts template JSON with variants and preserves them for preview', () => {
		const [encounter, error] = validateImportedEncounter(
			JSON.stringify({
				id: '6a338591-0cf0-4e99-801b-d37eef5b3425',
				name: 'Template Encounter',
				description: 'Template entry',
				defaultVariantId: '1f4209c4-dc76-471e-b60f-90f71d1360a5',
				tags: ['Severe'],
				variants: [
					{
						id: '1f4209c4-dc76-471e-b60f-90f71d1360a5',
						partySize: 4,
						description: 'Default variant',
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
					{
						id: '5c735e0a-c7c2-4098-a8b8-89cbcad8a5af',
						partySize: 5,
						description: 'Large party variant',
						participants: [
							{
								id: '7fdf7917-ccf8-4f4d-a2e6-f48ac27625d9',
								type: 'hazard',
								role: 'simple',
								tag: 'Trap',
								count: 1,
								relativeLevel: new LevelDifference(0),
								side: ALIGNMENT.Opponents,
								successesToDisable: 2,
							},
						],
						events: [],
					},
				],
			})
		);

		expect(error).toBe('');
		expect(encounter).not.toBeNull();
		expect(encounter?.levelRepresentation).toBe(LEVEL_REPRESENTATION.Relative);
		expect(encounter?.description).toBe('Default variant');
		expect(encounter?.participants).toHaveLength(1);
		expect(encounter?.variants).toHaveLength(2);
		expect(encounter?.variants?.[1]?.description).toBe('Large party variant');
		expect(encounter?.difficulty).toBe(DIFFICULTY.Severe);
	});
});