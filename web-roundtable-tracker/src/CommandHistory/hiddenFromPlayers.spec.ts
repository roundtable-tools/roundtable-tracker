import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
	createEncounterStore,
	type TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import { getEncounterStore } from '@/store/encounterRuntimeInstance';
import { Character } from '@/store/data';
import {
	runtimeToPlayerInitiativeQueue,
	runtimeToPlayerVisibleQueue,
} from '@/store/trackerMappers';
import { getRoundBoundaryIndex } from '@/components/InitiativeTracker/roundBoundary';
import { getRoundActionCommand } from '@/components/InitiativeTracker/roundActionCommand';
import { ChangeHealthCommand } from './Commands/ChangeHealthCommand';
import { SetHiddenFromPlayersCommand } from './Commands/SetHiddenFromPlayersCommand';
import {
	executeCommand,
	redoNextCommand,
	undoLastCommand,
} from './commandExecution';

const character = (uuid: string, initiative: number): Character => ({
	uuid,
	name: uuid,
	initiative,
	turnState: 'normal',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
});

const meta = (hiddenUntilFirstTurn: boolean): TrackerParticipantMeta => ({
	role: 'opponent',
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
	hiddenUntilFirstTurn,
});

describe('hiding participants from the players', () => {
	let store: ReturnType<typeof createEncounterStore>;
	const deps = () => ({ encounterStore: store });

	const shownToPlayers = () =>
		runtimeToPlayerInitiativeQueue(store.getState()).map(({ id }) => id);

	const isHidden = (uuid: string) =>
		store.getState().trackerMetaMap[uuid].hiddenUntilFirstTurn;

	/** The current participant ends their turn, as the tracker does. */
	const endTurn = () =>
		executeCommand(
			store,
			getRoundActionCommand(
				store.getState().charactersOrder[0],
				'end-turn',
				store.getState(),
				deps()
			)
		);

	beforeAll(() => {
		// Registers the serializable commands, as the app does on start.
		getEncounterStore();
	});

	beforeEach(() => {
		store = createEncounterStore();
		store
			.getState()
			.startEncounter(
				[character('hero', 20), character('ghost', 15), character('imp', 10)],
				{ hero: meta(false), ghost: meta(true), imp: meta(true) }
			);
	});

	it('keeps a hidden participant out of the player view until its turn starts', () => {
		expect(shownToPlayers()).toEqual(['hero']);

		executeCommand(
			store,
			new ChangeHealthCommand({ uuid: 'ghost', delta: -3 }, deps())
		);
		expect(shownToPlayers()).toEqual(['hero']);

		endTurn();

		expect(shownToPlayers()).toEqual(['ghost', 'hero']);
		expect(isHidden('imp')).toBe(true);
	});

	it('places the round marker among the participants players see', () => {
		store.setState({ charactersWithTurn: new Set(['hero', 'imp']) });
		const visible = runtimeToPlayerVisibleQueue(store.getState());

		expect(visible.map(({ id }) => id)).toEqual(['hero']);
		expect(
			getRoundBoundaryIndex(visible, store.getState().charactersWithTurn)
		).toBe(1);
	});

	it('reveals the first participant when the encounter starts', () => {
		store
			.getState()
			.startEncounter([character('ghost', 15), character('hero', 10)], {
				ghost: meta(true),
				hero: meta(false),
			});

		expect(shownToPlayers()).toEqual(['ghost', 'hero']);
	});

	it('reveals in the same undo step as the command that starts the turn', () => {
		endTurn();
		expect(store.getState().history).toHaveLength(1);

		undoLastCommand(store);
		expect(store.getState().charactersOrder[0]).toBe('hero');
		expect(isHidden('ghost')).toBe(true);

		redoNextCommand(store);
		expect(store.getState().charactersOrder[0]).toBe('ghost');
		expect(isHidden('ghost')).toBe(false);
	});

	it('lets the GM reveal and hide a participant, with undo', () => {
		executeCommand(
			store,
			new SetHiddenFromPlayersCommand({ uuid: 'imp', hidden: false }, deps())
		);
		expect(shownToPlayers()).toEqual(['hero', 'imp']);

		executeCommand(
			store,
			new SetHiddenFromPlayersCommand({ uuid: 'hero', hidden: true }, deps())
		);
		expect(shownToPlayers()).toEqual(['imp']);

		undoLastCommand(store);
		expect(shownToPlayers()).toEqual(['hero', 'imp']);
	});

	it('keeps the current participant hidden once the GM hides it, until its next turn', () => {
		executeCommand(
			store,
			new SetHiddenFromPlayersCommand({ uuid: 'hero', hidden: true }, deps())
		);
		executeCommand(
			store,
			new ChangeHealthCommand({ uuid: 'hero', delta: -3 }, deps())
		);
		expect(isHidden('hero')).toBe(true);

		endTurn();
		endTurn();
		endTurn();

		expect(store.getState().round).toBe(2);
		expect(store.getState().charactersOrder[0]).toBe('hero');
		expect(isHidden('hero')).toBe(false);
	});
});
