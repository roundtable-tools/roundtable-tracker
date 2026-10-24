import { describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	CharacterConfig,
	DIFFICULTY,
	Encounter,
	LEVEL_REPRESENTATION,
} from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import {
	buildPendingReinforcements,
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from '@/store/convert';
import { STATUS } from '@/CommandHistory/common';
import { TriggerReinforcementEventCommand } from '@/CommandHistory/Commands/TriggerReinforcementEventCommand';
import { ReorderCharactersCommand } from '@/CommandHistory/Commands/ReorderCharactersCommand';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import {
	generateParticipants,
	generateReinforcements,
} from './generateParticipants';

const encounter: Encounter = {
	id: 'ambush',
	name: 'Ambush',
	description: 'Bandits, with a guard arriving in round 2',
	difficulty: DIFFICULTY.Moderate,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 3,
	participants: [
		{
			type: 'creature',
			name: 'Bandit',
			level: 2,
			side: ALIGNMENT.Opponents,
			adjustment: 'none',
		},
	],
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
};

const namesInStore = (store: ReturnType<typeof createEncounterStore>) =>
	Object.values(store.getState().charactersMap).map(
		(character) => character.name
	);

describe('reinforcements from preview to trigger', () => {
	it('adds a reinforcement creature only when its event is triggered, and only once', () => {
		// Preview: the roster the GM sees and starts the encounter with
		const preview = generateParticipants(encounter, 3).flat();

		expect(preview.map((participant) => participant.name)).toEqual(['Bandit']);

		// Start
		const encounterStore = createEncounterStore();
		const prepared = preview.map((participant) => ({
			...participant,
			health: 10,
			maxHealth: 10,
			tempHealth: 0,
		})) as CharacterConfig[];

		encounterStore.getState().setEncounterData(encounter);
		encounterStore.getState().setPartyLevel(3);
		encounterStore
			.getState()
			.startEncounter(participantsToEncounterCharacters(prepared));
		encounterStore.getState().setTrackerMetaMap(buildTrackerMetaMap(prepared));

		expect(namesInStore(encounterStore)).toEqual(['Bandit']);
		expect(encounterStore.getState().charactersOrder).toHaveLength(1);

		// Trigger
		const command = new TriggerReinforcementEventCommand(
			{ slotId: 'guard-arrives' },
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);

		const state = encounterStore.getState();
		const guards = Object.values(state.charactersMap).filter(
			(character) => character.name === 'Guard'
		);

		expect(guards).toHaveLength(1);
		expect(state.charactersOrder).toHaveLength(2);
		expect(state.charactersOrder).toContain(guards[0].uuid);
		expect(state.charactersWithTurn.has(guards[0].uuid)).toBe(true);
		expect(state.trackerMetaMap[guards[0].uuid]).toMatchObject({
			role: 'reinforcement',
			reinforcementSlotId: 'guard-arrives',
			traits: ['Human', 'Medium'],
		});

		// A second trigger of the same event adds nothing
		const secondTrigger = new TriggerReinforcementEventCommand(
			{ slotId: 'guard-arrives' },
			{ encounterStore }
		);

		expect(secondTrigger.execute()).toBe(STATUS.failure);
		expect(namesInStore(encounterStore)).toHaveLength(2);
	});

	it('names triggered reinforcements uniquely against the tracker roster', () => {
		const encounterStore = createEncounterStore();
		const prepared = [
			{
				uuid: 'guard-on-watch',
				name: 'Guard',
				level: 3,
				side: ALIGNMENT.Opponents,
				tiePriority: 0,
				initiative: 12,
				health: 10,
				maxHealth: 10,
				tempHealth: 0,
			},
		] as CharacterConfig[];

		encounterStore.getState().setEncounterData({
			...encounter,
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
							count: 2,
						},
					],
				},
			],
		});
		encounterStore
			.getState()
			.startEncounter(participantsToEncounterCharacters(prepared));
		encounterStore.getState().setTrackerMetaMap(buildTrackerMetaMap(prepared));

		new TriggerReinforcementEventCommand(
			{ slotId: 'guard-arrives' },
			{ encounterStore }
		).execute();

		expect(namesInStore(encounterStore).sort()).toEqual([
			'Guard',
			'Guard A',
			'Guard B',
		]);
	});

	it('brings reinforcements in with their saved starting state and visibility', () => {
		const encounterStore = createEncounterStore();
		const prepared = [
			{
				uuid: 'bandit',
				name: 'Bandit',
				level: 3,
				side: ALIGNMENT.Opponents,
				tiePriority: 0,
				initiative: 12,
				health: 10,
				maxHealth: 10,
				tempHealth: 0,
			},
		] as CharacterConfig[];

		encounterStore.getState().setEncounterData({
			...encounter,
			narrativeSlots: [
				{
					id: 'stragglers',
					type: 'reinforcement',
					trigger: { round: 2 },
					participants: [
						{
							type: 'creature',
							name: 'Wounded Guard',
							level: '+0',
							side: ALIGNMENT.Opponents,
							startingState: 'knocked-out',
							hiddenUntilFirstTurn: true,
						},
					],
				},
			],
		});
		encounterStore
			.getState()
			.startEncounter(participantsToEncounterCharacters(prepared));
		encounterStore.getState().setTrackerMetaMap(buildTrackerMetaMap(prepared));

		const command = new TriggerReinforcementEventCommand(
			{ slotId: 'stragglers' },
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);

		const state = encounterStore.getState();
		const byName = (name: string) =>
			Object.values(state.charactersMap).find(
				(character) => character.name === name
			)!;
		const guard = byName('Wounded Guard');

		expect(guard.turnState).toBe('knocked-out');
		expect(state.charactersOrder).toContain(guard.uuid);
		expect(state.charactersWithTurn.has(guard.uuid)).toBe(true);
		expect(state.trackerMetaMap[guard.uuid].hiddenUntilFirstTurn).toBe(true);

		expect(command.undo()).toBe(STATUS.success);
		expect(encounterStore.getState().charactersOrder).toEqual(['bandit']);
	});

	describe('with initiative set in the preview', () => {
		const withHp = (participant: Omit<CharacterConfig, 'health'>) =>
			({
				...participant,
				health: participant.maxHealth ?? 10,
				maxHealth: participant.maxHealth ?? 10,
				tempHealth: 0,
			}) as CharacterConfig;

		const starting = (uuid: string, initiative: number) =>
			withHp({
				uuid,
				name: uuid,
				level: 3,
				side: ALIGNMENT.Opponents,
				tiePriority: 1,
				initiative,
				maxHealth: 10,
				tempHealth: 0,
			});

		// The preview rolls the guard, then the GM sets its initiative to 12
		const startWithGuardAt = (initiative: number) => {
			const [team] = generateReinforcements(encounter, 3, ['Bandit']);
			const guard = {
				...withHp(team.participants[0] as CharacterConfig),
				initiative,
				reinforcementSlotId: team.slot.id,
			};
			const startingParticipants = [
				starting('a', 20),
				starting('b', 15),
				starting('c', 10),
				starting('d', 5),
			];
			const encounterStore = createEncounterStore();

			encounterStore.getState().setEncounterData(encounter);
			encounterStore.getState().setPartyLevel(3);
			encounterStore
				.getState()
				.startEncounter(
					participantsToEncounterCharacters([...startingParticipants]),
					buildTrackerMetaMap(startingParticipants),
					buildPendingReinforcements(
						startingParticipants,
						[guard],
						encounter.narrativeSlots
					)
				);

			return { encounterStore, guard };
		};

		it('rolls reinforcement initiative in the preview and keeps it out of the order until triggered', () => {
			const [team] = generateReinforcements(encounter, 3, ['Bandit']);

			expect(team.slot.id).toBe('guard-arrives');
			expect(team.participants).toHaveLength(1);
			expect(team.participants[0]).toMatchObject({
				name: 'Guard',
				level: 3,
				maxHealth: 15,
			});
			expect(team.participants[0].initiative).toBeGreaterThanOrEqual(1);
			expect(team.participants[0].initiative).toBeLessThanOrEqual(20);

			const { encounterStore, guard } = startWithGuardAt(12);
			const state = encounterStore.getState();

			expect(state.charactersOrder).toEqual(['a', 'b', 'c', 'd']);
			expect(state.charactersMap[guard.uuid]).toBeUndefined();
			expect(state.pendingReinforcements).toMatchObject([
				{ slotId: 'guard-arrives', above: 'b', below: 'c' },
			]);
		});

		it('spawns the reinforcement at its preview initiative, with that initiative and name', () => {
			const { encounterStore, guard } = startWithGuardAt(12);
			const command = new TriggerReinforcementEventCommand(
				{ slotId: 'guard-arrives' },
				{ encounterStore }
			);

			expect(command.execute()).toBe(STATUS.success);

			const state = encounterStore.getState();

			expect(state.charactersOrder).toEqual(['a', 'b', guard.uuid, 'c', 'd']);
			expect(state.charactersMap[guard.uuid]).toMatchObject({
				name: 'Guard',
				initiative: 12,
			});
			expect(state.charactersWithTurn.has(guard.uuid)).toBe(true);
			expect(state.trackerMetaMap[guard.uuid]).toMatchObject({
				role: 'reinforcement',
				reinforcementSlotId: 'guard-arrives',
			});
			expect(state.pendingReinforcements).toEqual([]);

			expect(command.undo()).toBe(STATUS.success);
			expect(encounterStore.getState().charactersOrder).toEqual([
				'a',
				'b',
				'c',
				'd',
			]);
			expect(encounterStore.getState().pendingReinforcements).toHaveLength(1);
		});

		it('follows the participant below it through a reorder, and stays put when that one is moved', () => {
			const { encounterStore, guard } = startWithGuardAt(12);
			const deps = { encounterStore };

			// a is dragged below c: the guard still goes right before c
			const moveA = new ReorderCharactersCommand(
				{ newOrder: ['b', 'c', 'a', 'd'], movedIds: ['a'] },
				deps
			);

			moveA.execute();

			// c is dragged to the end: the guard stays right after b
			new ReorderCharactersCommand(
				{ newOrder: ['b', 'a', 'd', 'c'], movedIds: ['c'] },
				deps
			).execute();
			new TriggerReinforcementEventCommand(
				{ slotId: 'guard-arrives' },
				deps
			).execute();

			expect(encounterStore.getState().charactersOrder).toEqual([
				'b',
				guard.uuid,
				'a',
				'd',
				'c',
			]);
		});

		it('restores the spot when a reorder is undone', () => {
			const { encounterStore } = startWithGuardAt(12);
			const reorder = new ReorderCharactersCommand(
				{ newOrder: ['a', 'c', 'b', 'd'], movedIds: ['c'] },
				{ encounterStore }
			);

			reorder.execute();
			expect(encounterStore.getState().pendingReinforcements).toMatchObject([
				{ above: 'b', below: 'd' },
			]);

			reorder.undo();
			expect(encounterStore.getState().pendingReinforcements).toMatchObject([
				{ above: 'b', below: 'c' },
			]);
		});

		it('waits for the next round when its spot has already passed', () => {
			const { encounterStore, guard } = startWithGuardAt(12);
			const deps = { encounterStore };

			for (const uuid of ['a', 'b', 'c']) {
				new EndTurnCommand({ uuid }, deps).execute();
			}

			new TriggerReinforcementEventCommand(
				{ slotId: 'guard-arrives' },
				deps
			).execute();

			const state = encounterStore.getState();

			expect(state.charactersOrder).toEqual(['d', 'a', 'b', guard.uuid, 'c']);
			expect(state.charactersWithTurn.has(guard.uuid)).toBe(false);
		});
	});
});
