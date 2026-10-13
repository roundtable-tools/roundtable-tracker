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
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from '@/store/convert';
import { STATUS } from '@/CommandHistory/common';
import { TriggerReinforcementEventCommand } from '@/CommandHistory/Commands/TriggerReinforcementEventCommand';
import { generateParticipants } from './PreviewDisplay';

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
});
