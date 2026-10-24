import { beforeEach, describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	CharacterConfig,
	Encounter,
	LEVEL_REPRESENTATION,
	PRIORITY,
} from './data';
import { createEncounterStore } from './encounterRuntimeStore';
import {
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from './convert';
import {
	runtimeToInitiativeQueue,
	runtimeToOutOfInitiativeData,
} from './trackerMappers';
import { STATUS } from '@/CommandHistory/common';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from '@/CommandHistory/Commands/FinalizeTurnAndAdvanceRoundCommand';
import { TriggerReinforcementEventCommand } from '@/CommandHistory/Commands/TriggerReinforcementEventCommand';
import { delayingIds } from '@/store/operations';

const GOBLIN = '00000000-0000-0000-0000-000000000001';
const HAZARD = '00000000-0000-0000-0000-000000000002';

const goblin: CharacterConfig = {
	uuid: GOBLIN,
	name: 'Goblin',
	level: 1,
	side: ALIGNMENT.Opponents,
	tiePriority: PRIORITY.NPC,
	initiative: 12,
	maxHealth: 10,
	health: 10,
	tempHealth: 0,
};

const hazard = {
	uuid: HAZARD,
	name: 'Hidden Pit',
	level: 0,
	side: ALIGNMENT.Opponents,
	tiePriority: PRIORITY.NPC,
	// Simple hazards have no initiative field in the preview form.
	initiative: undefined as unknown as number,
	maxHealth: 1,
	health: 1,
	tempHealth: 0,
	isSimpleHazard: true,
	type: 'hazard',
	successesToDisable: 1,
} as CharacterConfig;

const reinforcementEncounter: Encounter = {
	id: 'encounter',
	name: 'Encounter',
	description: '',
	levelRepresentation: LEVEL_REPRESENTATION.Relative,
	participants: [],
	narrativeSlots: [
		{
			id: 'slot-1',
			type: 'reinforcement',
			trigger: { round: 1 },
			participants: [
				{
					name: 'Collapsing Floor',
					level: '+0',
					side: ALIGNMENT.Opponents,
					type: 'hazard',
					successesToDisable: 2,
					isComplexHazard: false,
				},
				{
					name: 'Orc',
					level: '+0',
					side: ALIGNMENT.Opponents,
					type: 'creature',
				},
			],
		},
	],
};

const startEncounter = (
	encounterStore: ReturnType<typeof createEncounterStore>,
	participants: CharacterConfig[]
) => {
	// Same call as PreviewDisplay.onSelectInitiativeView.
	encounterStore
		.getState()
		.startEncounter(
			participantsToEncounterCharacters(participants),
			buildTrackerMetaMap(participants)
		);
};

describe('encounter with a simple hazard', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		encounterStore = createEncounterStore();
	});

	it.each([
		['before', [hazard, goblin]],
		['after', [goblin, hazard]],
	])(
		'keeps a hazard listed %s the creature out of the turn order',
		(_, participants) => {
			startEncounter(encounterStore, participants);
			const state = encounterStore.getState();

			expect(state.charactersOrder).toEqual([GOBLIN]);
			expect(state.charactersWithTurn).toEqual(new Set([GOBLIN]));
			expect(delayingIds(state)).toEqual([]);
			expect(state.charactersMap[HAZARD]).toBeDefined();
			expect(state.trackerMetaMap[HAZARD].isSimpleHazard).toBe(true);
			expect(
				runtimeToOutOfInitiativeData(state).hazards.map((p) => p.id)
			).toEqual([HAZARD]);
		}
	);

	it('advances the round on the last visible turn', () => {
		startEncounter(encounterStore, [hazard, goblin]);
		const visibleQueue = runtimeToInitiativeQueue(encounterStore.getState());

		expect(visibleQueue.map((participant) => participant.id)).toEqual([GOBLIN]);

		const command = new FinalizeTurnAndAdvanceRoundCommand(
			{ uuid: GOBLIN, action: 'end-turn' },
			{ encounterStore }
		);

		expect(command.execute()).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(2);
		expect(encounterStore.getState().charactersOrder).toEqual([GOBLIN]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([GOBLIN])
		);
	});

	it('never makes the hazard the current actor', () => {
		startEncounter(encounterStore, [hazard, goblin]);

		expect(encounterStore.getState().charactersOrder[0]).toBe(GOBLIN);
		expect(
			new EndTurnCommand({ uuid: GOBLIN }, { encounterStore }).execute()
		).toBe(STATUS.success);
		expect(encounterStore.getState().charactersOrder[0]).toBe(GOBLIN);
	});

	it('keeps a simple hazard spawned by a reinforcement out of the turn order', () => {
		startEncounter(encounterStore, [goblin]);
		encounterStore.getState().setEncounterData(reinforcementEncounter);

		const trigger = new TriggerReinforcementEventCommand(
			{ slotId: 'slot-1' },
			{ encounterStore }
		);

		expect(trigger.execute()).toBe(STATUS.success);

		const state = encounterStore.getState();
		const spawnedHazard = Object.entries(state.trackerMetaMap).find(
			([, meta]) => meta.isSimpleHazard
		)?.[0];
		const spawnedOrc = Object.values(state.charactersMap).find(
			(character) => character.name === 'Orc'
		)?.uuid;

		expect(spawnedHazard).toBeDefined();
		expect(spawnedOrc).toBeDefined();
		expect(state.charactersMap[spawnedHazard!]).toBeDefined();
		expect(state.charactersOrder).not.toContain(spawnedHazard);
		expect(state.charactersWithTurn.has(spawnedHazard!)).toBe(false);
		expect(state.charactersOrder).toContain(spawnedOrc);
		expect(state.charactersWithTurn.has(spawnedOrc!)).toBe(true);
		expect(
			runtimeToOutOfInitiativeData(state).hazards.map((p) => p.id)
		).toEqual([spawnedHazard]);

		expect(trigger.undo()).toBe(STATUS.success);
		expect(encounterStore.getState().charactersOrder).toEqual([GOBLIN]);
		expect(encounterStore.getState().charactersMap[spawnedHazard!]).toBe(
			undefined
		);
	});
});
