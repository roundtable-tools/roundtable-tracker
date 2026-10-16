/**
 * Builds the running-tracker examples in examples/tracker-states/ the way the
 * app does: the preview's starting participants, then the tracker's own
 * commands. Each example is the persisted encounter-store, so the dev server
 * can load it with ?example=<file name>.
 *
 * `vitest run src/examples -u` rewrites the files; a plain run fails when the
 * app would now produce a different state.
 */
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { format, resolveConfig } from 'prettier';
import {
	ALIGNMENT,
	DIFFICULTY,
	Encounter,
	LEVEL_REPRESENTATION,
} from '@/store/data';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { getEncounterStore } from '@/store/encounterRuntimeInstance';
import {
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from '@/store/convert';
import { Party } from '@/store/savedParties';
import { type Command, STATUS } from '@/CommandHistory/common';
import { ChangeHealthCommand } from '@/CommandHistory/Commands/ChangeHealthCommand';
import { SetTempHealthCommand } from '@/CommandHistory/Commands/SetTempHealthCommand';
import { TriggerReinforcementEventCommand } from '@/CommandHistory/Commands/TriggerReinforcementEventCommand';
import { generateParticipants } from '@/components/PreviewDisplay/generateParticipants';
import {
	generatePartyFromData,
	toPreviewCharacter,
	toStartingParticipant,
	type PreviewCharacterConfig,
} from '@/components/PreviewDisplay/startingParticipants';
import {
	getRoundActionCommand,
	type RoundAction,
} from '@/components/InitiativeTracker/roundActionCommand';
import { ENCOUNTER_STORE_KEY } from '@/store/playerViewSync';
import { runtimeToPlayerInitiativeQueue } from '@/store/trackerMappers';

// Stable ids, so the files only change when the state does.
const uuidCounter = vi.hoisted(() => ({ next: 0 }));
vi.mock('@/utils/uuid', () => ({
	generateUUID: () =>
		`00000000-0000-4000-8000-${String(++uuidCounter.next).padStart(12, '0')}`,
}));

type EncounterStoreApi = ReturnType<typeof createEncounterStore>;

const party: Party = {
	id: 'example-party',
	name: 'Example Party',
	icon: 'Swords',
	savedAt: '2026-01-01T00:00:00.000Z',
	members: [
		{
			uuid: 'pc-valeros',
			name: 'Valeros',
			level: 3,
			maxHealth: 45,
			tiePriority: true,
		},
		{
			uuid: 'pc-kyra',
			name: 'Kyra',
			level: 3,
			maxHealth: 38,
			tiePriority: true,
		},
		{
			uuid: 'pc-merisiel',
			name: 'Merisiel',
			level: 3,
			maxHealth: 32,
			tiePriority: true,
		},
		// No max HP: the tracker shows no HP data for this PC.
		{ uuid: 'pc-ezren', name: 'Ezren', level: 3, tiePriority: true },
	],
};

/**
 * One participant of each kind the encounter builder makes: opponents with
 * elite and weak adjustments, a hidden one, a neutral creature, a complex and
 * a simple hazard, one that starts delayed, and two reinforcement events.
 */
const encounter: Encounter = {
	id: 'example-bridge-ambush',
	name: 'Bridge Ambush',
	description:
		'Goblins hold the rope bridge over the gorge. The bridge is rigged to collapse.',
	difficulty: DIFFICULTY.Severe,
	partySize: 4,
	levelRepresentation: LEVEL_REPRESENTATION.Exact,
	level: 3,
	notes: {
		gm: 'The warchief flees once bloodied.',
		player: 'The bridge sways under every step.',
	},
	participants: [
		{
			type: 'creature',
			name: 'Goblin Warchief',
			level: 4,
			side: ALIGNMENT.Opponents,
			maxHealth: 70,
			initiativeBonus: 9,
			adjustmentDescription: 'Elite',
			adjustmentLevelModifier: 1,
			traits: ['Goblin', 'Humanoid'],
			description: 'Leads from the far end of the bridge.',
			dcs: [{ name: 'AC', value: 22 }],
		},
		{
			type: 'creature',
			name: 'Goblin Archer',
			level: 1,
			count: 2,
			side: ALIGNMENT.Opponents,
			maxHealth: 18,
			initiativeBonus: 6,
			adjustmentDescription: 'Weak',
			adjustmentLevelModifier: -1,
			traits: ['Goblin', 'Humanoid'],
		},
		{
			type: 'creature',
			name: 'Goblin Dog',
			level: 1,
			side: ALIGNMENT.Opponents,
			maxHealth: 17,
			initiativeBonus: 6,
			traits: ['Animal'],
			hiddenFromPlayers: true,
		},
		{
			type: 'creature',
			name: 'Goblin Sneak',
			level: 2,
			side: ALIGNMENT.Opponents,
			maxHealth: 25,
			initiativeBonus: 8,
			startingState: 'delayed',
			initiativeDescription: 'Waits in the rigging to ambush',
		},
		{
			type: 'creature',
			name: 'Bridge Keeper',
			level: 3,
			side: ALIGNMENT.Neutral,
			maxHealth: 45,
			initiativeBonus: 7,
			traits: ['Human'],
			description: 'Collects the toll and wants nobody hurt.',
		},
		{
			type: 'hazard',
			name: 'Collapsing Bridge',
			level: 3,
			side: ALIGNMENT.Opponents,
			isComplexHazard: true,
			successesToDisable: 3,
			maxHealth: 40,
			hardness: 8,
			initiativeBonus: 9,
			description: 'Planks drop away each round.',
			dcs: [
				{ name: 'Thievery', value: 20, disableSuccesses: 2 },
				{ name: 'Athletics', value: 22, disableSuccesses: 1 },
			],
		},
		{
			type: 'hazard',
			name: 'Hidden Pit',
			level: 1,
			side: ALIGNMENT.Opponents,
			successesToDisable: 1,
			dcs: [{ name: 'Perception', value: 18 }],
		},
	],
	narrativeSlots: [
		{
			id: 'goblin-reinforcements',
			type: 'reinforcement',
			description: 'More goblins climb up from the gorge.',
			trigger: { round: 2 },
			participants: [
				{
					type: 'creature',
					name: 'Goblin Warrior',
					level: '-1',
					count: 2,
					side: ALIGNMENT.Opponents,
					maxHealth: 15,
					initiativeBonus: 5,
					traits: ['Goblin'],
				},
			],
		},
		{
			id: 'town-guard',
			type: 'reinforcement',
			description: 'The town guard comes to see what the noise is.',
			trigger: { round: 3 },
			participants: [
				{
					type: 'creature',
					name: 'Town Guard',
					level: '+0',
					side: ALIGNMENT.Neutral,
					maxHealth: 40,
					initiativeBonus: 7,
				},
			],
		},
	],
};

// The initiatives the GM enters in the preview. The simple hazard has none.
const INITIATIVES: Record<string, number> = {
	Valeros: 24,
	'Goblin Warchief': 22,
	'Collapsing Bridge': 20,
	Kyra: 19,
	'Goblin Archer A': 17,
	'Goblin Sneak': 16,
	'Bridge Keeper': 15,
	Merisiel: 14,
	'Goblin Dog': 12,
	'Goblin Archer B': 10,
	Ezren: 8,
};

/** Starts the encounter as Preview → Start → Initiative Tracker does. */
const startFromPreview = (store: EncounterStoreApi) => {
	const partyLevel = 3;
	const teams = [
		generatePartyFromData(party),
		...generateParticipants(encounter, partyLevel),
	];
	const prepared = teams
		.flat()
		.map(toPreviewCharacter)
		// The preview form holds these rows as PreviewCharacterConfig.
		.map(
			(participant): PreviewCharacterConfig => ({
				...(participant as PreviewCharacterConfig),
				initiative: INITIATIVES[participant.name] ?? participant.initiative,
			})
		)
		.map(toStartingParticipant);

	store.getState().setEncounterData(encounter);
	store.getState().setPartyLevel(partyLevel);
	store
		.getState()
		.startEncounter(
			participantsToEncounterCharacters(prepared),
			buildTrackerMetaMap(prepared)
		);
};

/** Runs a command and records it, as CommandHistoryProvider.executeCommand does. */
const run = (store: EncounterStoreApi, command: Command) => {
	expect(command.execute()).toBe(STATUS.success);
	store.getState().setHistory((history) => [...history, command]);
	store.getState().setRedoStack([]);
};

const uuidOf = (store: EncounterStoreApi, name: string) => {
	const entry = Object.values(store.getState().charactersMap).find(
		(character) => character.name === name
	);

	expect(entry, `participant ${name}`).toBeDefined();

	return entry!.uuid;
};

/** The current participant ends their turn, delays or is knocked out. */
const act = (store: EncounterStoreApi, name: string, action: RoundAction) => {
	const uuid = uuidOf(store, name);

	expect(store.getState().charactersOrder[0]).toBe(uuid);
	run(
		store,
		getRoundActionCommand(uuid, action, store.getState(), {
			encounterStore: store,
		})
	);
};

const changeHealth = (store: EncounterStoreApi, name: string, delta: number) =>
	run(
		store,
		new ChangeHealthCommand(
			{ uuid: uuidOf(store, name), delta },
			{ encounterStore: store }
		)
	);

/** Every participant in initiative or delaying appears once for players. */
const expectEachParticipantOnceForPlayers = (store: EncounterStoreApi) => {
	const state = store.getState();
	const ids = runtimeToPlayerInitiativeQueue(state).map(({ id }) => id);
	const expected = new Set(
		[...state.charactersOrder, ...state.delayedOrder].filter(
			(uuid) => !state.trackerMetaMap[uuid]?.isSimpleHazard
		)
	);

	expect(ids).toHaveLength(expected.size);
	expect(new Set(ids)).toEqual(expected);
};

/** The persisted encounter-store, formatted like the repo's other JSON. */
const storedExample = async () => {
	const stored = localStorage.getItem(ENCOUNTER_STORE_KEY);

	expect(stored).not.toBeNull();

	return format(stored!, {
		...(await resolveConfig(import.meta.filename)),
		parser: 'json',
	});
};

const examplePath = (name: string) =>
	`../../examples/tracker-states/${name}.json`;

describe('tracker state examples', () => {
	let store: EncounterStoreApi;

	afterEach(() => {
		vi.restoreAllMocks();
	});

	beforeAll(() => {
		// Registers the serializable commands, as the app does on start.
		getEncounterStore();
	});

	beforeEach(() => {
		// Every d20 roll (preview defaults, arriving reinforcements) comes up 11.
		vi.spyOn(Math, 'random').mockReturnValue(0.5);
		uuidCounter.next = 0;
		store = createEncounterStore();
		startFromPreview(store);
	});

	it('round-1-start: every kind of participant, nobody has acted', async () => {
		const state = store.getState();

		expect(state.round).toBe(1);
		expect(state.delayedOrder).toEqual([uuidOf(store, 'Goblin Sneak')]);
		expect(
			Object.values(state.trackerMetaMap).some((meta) => meta.isSimpleHazard)
		).toBe(true);

		expectEachParticipantOnceForPlayers(store);

		await expect(await storedExample()).toMatchFileSnapshot(
			examplePath('round-1-start')
		);
	});

	it('round-2-mid-round: damage, temp HP, delay, knock-out, reinforcements and disable progress', async () => {
		// Round 1
		changeHealth(store, 'Goblin Warchief', -14);
		act(store, 'Valeros', 'end-turn');
		changeHealth(store, 'Valeros', -20);
		act(store, 'Goblin Warchief', 'end-turn');
		act(store, 'Collapsing Bridge', 'end-turn');
		run(
			store,
			new SetTempHealthCommand(
				{
					uuid: uuidOf(store, 'Kyra'),
					tempHealth: 8,
					description: 'False Life, until the end of the encounter',
				},
				{ encounterStore: store }
			)
		);
		act(store, 'Kyra', 'end-turn');
		changeHealth(store, 'Merisiel', -28);
		act(store, 'Goblin Archer A', 'end-turn');
		act(store, 'Bridge Keeper', 'delay');
		act(store, 'Merisiel', 'end-turn');
		changeHealth(store, 'Goblin Dog', -17);
		act(store, 'Goblin Dog', 'ko');
		changeHealth(store, 'Goblin Archer B', -2);
		act(store, 'Goblin Archer B', 'end-turn');
		act(store, 'Ezren', 'end-turn');

		// Round 2: the reinforcements arrive, then three turns pass.
		expect(store.getState().round).toBe(2);
		run(
			store,
			new TriggerReinforcementEventCommand(
				{ slotId: 'goblin-reinforcements' },
				{ encounterStore: store }
			)
		);
		changeHealth(store, 'Goblin Archer A', -12);
		act(store, 'Valeros', 'end-turn');
		act(store, 'Goblin Warchief', 'end-turn');

		// No command records disable progress yet; it lives in the tracker meta.
		const bridge = uuidOf(store, 'Collapsing Bridge');
		const meta = store.getState().trackerMetaMap;
		store.getState().setTrackerMetaMap({
			...meta,
			[bridge]: { ...meta[bridge], disableChecksSucceeded: 1 },
		});
		act(store, 'Collapsing Bridge', 'end-turn');

		const state = store.getState();

		expect(state.round).toBe(2);
		expect(state.charactersMap[uuidOf(store, 'Goblin Dog')].turnState).toBe(
			'knocked-out'
		);
		expect(state.delayedOrder).toEqual(
			expect.arrayContaining([
				uuidOf(store, 'Goblin Sneak'),
				uuidOf(store, 'Bridge Keeper'),
			])
		);

		expectEachParticipantOnceForPlayers(store);

		await expect(await storedExample()).toMatchFileSnapshot(
			examplePath('round-2-mid-round')
		);
	});
});
