import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { createEncounterStore } from '@/store/encounterRuntimeStore';
import { getEncounterStore } from '@/store/encounterRuntimeInstance';
import { Character } from '@/store/data';
import { getElapsed } from '@/store/encounterTimer';
import { getRoundActionCommand } from '@/components/InitiativeTracker/roundActionCommand';
import { ReorderCharactersCommand } from './Commands/ReorderCharactersCommand';
import {
	executeCommand,
	redoNextCommand,
	undoLastCommand,
} from './commandExecution';

const SECOND = 1000;

const character = (uuid: string, initiative: number): Character => ({
	uuid,
	name: uuid,
	initiative,
	turnState: 'normal',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
});

describe('command execution with the encounter timer', () => {
	let store: ReturnType<typeof createEncounterStore>;

	beforeAll(() => {
		// Registers the serializable commands, as the app does on start.
		getEncounterStore();
	});

	beforeEach(() => {
		vi.useFakeTimers({ toFake: ['Date'] });
		vi.setSystemTime(0);
		store = createEncounterStore();
		store
			.getState()
			.startEncounter([character('hero', 20), character('goblin', 10)]);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	/** The current participant ends their turn, as the tracker does. */
	const endTurn = (at: number) =>
		executeCommand(
			store,
			getRoundActionCommand(
				store.getState().charactersOrder[0],
				'end-turn',
				store.getState(),
				{ encounterStore: store }
			),
			at
		);

	const timer = () => store.getState().timer!;

	it('starts timing the first participant when the encounter starts', () => {
		expect(timer()).toMatchObject({
			round: 1,
			roundStartedAt: 0,
			turnParticipantId: 'hero',
			turnStartedAt: 0,
		});
	});

	it('logs each turn and the round as the tracker moves on', () => {
		endTurn(30 * SECOND);
		endTurn(50 * SECOND);

		expect(timer().turnLog).toEqual([
			{ participantId: 'hero', round: 1, durationMs: 30 * SECOND },
			{ participantId: 'goblin', round: 1, durationMs: 20 * SECOND },
		]);
		expect(timer().roundLog).toEqual([{ round: 1, durationMs: 50 * SECOND }]);
		expect(timer()).toMatchObject({ round: 2, turnParticipantId: 'hero' });
	});

	it('undo gives the turn back its time, and redo logs it again', () => {
		endTurn(30 * SECOND);
		undoLastCommand(store, 100 * SECOND);

		expect(timer().turnLog).toEqual([]);
		expect(timer().turnParticipantId).toBe('hero');
		expect(getElapsed(timer(), 100 * SECOND).turnMs).toBe(30 * SECOND);

		redoNextCommand(store, 110 * SECOND);

		expect(timer().turnLog).toEqual([
			{ participantId: 'hero', round: 1, durationMs: 40 * SECOND },
		]);
	});

	it('undo across the round end gives the round back its time', () => {
		endTurn(30 * SECOND);
		endTurn(50 * SECOND);
		undoLastCommand(store, 80 * SECOND);

		expect(timer().round).toBe(1);
		expect(timer().roundLog).toEqual([]);
		expect(getElapsed(timer(), 80 * SECOND)).toEqual({
			roundMs: 50 * SECOND,
			turnMs: 20 * SECOND,
		});
	});

	it('does not log a turn for a participant skipped because it already acted', () => {
		// The hero is on top without a turn left (e.g. from an older save); the
		// tracker skips it with a reorder that rotates to the goblin.
		store.setState({ charactersWithTurn: new Set(['goblin']) });
		executeCommand(
			store,
			new ReorderCharactersCommand(
				{ newOrder: store.getState().charactersOrder },
				{ encounterStore: store }
			),
			5 * SECOND
		);

		expect(store.getState().charactersOrder[0]).toBe('goblin');
		expect(timer().turnLog).toEqual([]);
		expect(timer()).toMatchObject({
			turnParticipantId: 'goblin',
			turnStartedAt: 5 * SECOND,
		});
	});

	it('does not log a turn when a reorder moves someone else on top', () => {
		executeCommand(
			store,
			new ReorderCharactersCommand(
				{ newOrder: ['goblin', 'hero'] },
				{ encounterStore: store }
			),
			5 * SECOND
		);

		expect(timer().turnLog).toEqual([]);
		expect(timer()).toMatchObject({
			turnParticipantId: 'goblin',
			turnStartedAt: 5 * SECOND,
		});
	});

	it('records the command and moves the timer in one store change', () => {
		const states: ReturnType<typeof store.getState>[] = [];
		store.subscribe((state) => states.push(state));

		endTurn(30 * SECOND);

		const recorded = states.find((state) => state.history.length === 1);

		expect(recorded?.timer?.turnParticipantId).toBe('goblin');
	});

	it('leaves the timer alone for commands that keep the turn', () => {
		const before = timer();

		executeCommand(
			store,
			new ReorderCharactersCommand(
				{ newOrder: ['hero', 'goblin'] },
				{ encounterStore: store }
			),
			10 * SECOND
		);

		expect(timer()).toBe(before);
	});
});
