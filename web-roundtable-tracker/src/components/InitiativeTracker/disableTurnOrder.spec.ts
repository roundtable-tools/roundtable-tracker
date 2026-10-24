import { beforeEach, describe, expect, it } from 'vitest';
import { Character } from '@/store/data';
import {
	createEncounterStore,
	TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import { delayingIds } from '@/store/operations';
import { STATUS } from '@/CommandHistory/common';
import { getRoundActionCommand } from './roundActionCommand';

const HERO = '00000000-0000-0000-0000-000000000001';
const GOBLIN = '00000000-0000-0000-0000-000000000002';
const TRAP = '00000000-0000-0000-0000-000000000003';
const SNEAK = '00000000-0000-0000-0000-000000000004';

const character = (
	uuid: string,
	turnState: Character['turnState'] = 'normal'
): Character => ({
	uuid,
	name: uuid,
	initiative: 10,
	turnState,
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
});

const meta = (
	role: TrackerParticipantMeta['role']
): TrackerParticipantMeta => ({
	role,
	sideTheme: role === 'pc' ? 'pc' : 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: role === 'hazard' ? 2 : 0,
	disableChecksSucceeded: 0,
	notes: '',
});

// Disable is the hazard's K.O.: the tracker takes a hazard out with the same
// round action, so the turn order changes the same way.
describe('disabling a hazard in the turn order', () => {
	let store: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		store = createEncounterStore();
		store.setState({
			charactersMap: {
				[HERO]: character(HERO),
				[GOBLIN]: character(GOBLIN),
				[TRAP]: character(TRAP),
				[SNEAK]: character(SNEAK),
			},
			trackerMetaMap: {
				[HERO]: meta('pc'),
				[GOBLIN]: meta('opponent'),
				[TRAP]: meta('hazard'),
				[SNEAK]: meta('opponent'),
			},
			round: 1,
		});
	});

	const disable = (uuid: string) => {
		const command = getRoundActionCommand(uuid, 'ko', store.getState(), {
			encounterStore: store,
		});

		return { command, status: command.execute() };
	};

	it('ends the round like a K.O. when the hazard was the last to act', () => {
		const takeOutLast = (uuid: string) => {
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[uuid]: character(uuid),
				},
				charactersOrder: [uuid, HERO],
				charactersWithTurn: new Set([uuid]),
				round: 1,
			});
			disable(uuid);
			const { round, charactersOrder, charactersWithTurn } = store.getState();

			return { round, charactersOrder, charactersWithTurn };
		};

		expect(takeOutLast(TRAP)).toEqual({
			round: 2,
			charactersOrder: [HERO, TRAP],
			charactersWithTurn: new Set([HERO, TRAP]),
		});
		expect(takeOutLast(GOBLIN)).toEqual({
			round: 2,
			charactersOrder: [HERO, GOBLIN],
			charactersWithTurn: new Set([HERO, GOBLIN]),
		});
	});

	it('keeps a disabled hazard in the order, with the Disabled state', () => {
		store.setState({
			charactersOrder: [HERO, TRAP, GOBLIN],
			charactersWithTurn: new Set([HERO, TRAP, GOBLIN]),
		});

		const { command } = disable(TRAP);
		const state = store.getState();

		expect(state.charactersMap[TRAP].turnState).toBe('knocked-out');
		expect(state.charactersOrder).toEqual([HERO, GOBLIN, TRAP]);
		expect(state.charactersWithTurn.has(TRAP)).toBe(false);

		expect(command.undo()).toBe(STATUS.success);
		expect(store.getState().charactersOrder).toEqual([HERO, TRAP, GOBLIN]);
		expect(store.getState().charactersMap[TRAP].turnState).toBe('normal');
	});

	it('passes the turn to the next participant with a turn when the current hazard is disabled', () => {
		store.setState({
			charactersOrder: [TRAP, GOBLIN, HERO],
			charactersWithTurn: new Set([TRAP, HERO]),
		});

		disable(TRAP);

		expect(store.getState().charactersOrder).toEqual([HERO, TRAP, GOBLIN]);
	});

	it('keeps the current actor first when a hazard is disabled outside its turn', () => {
		store.setState({
			charactersMap: {
				...store.getState().charactersMap,
				[SNEAK]: character(SNEAK, 'delayed'),
			},
			charactersOrder: [HERO, SNEAK, TRAP],
			charactersWithTurn: new Set([HERO, SNEAK, TRAP]),
		});

		disable(TRAP);
		const state = store.getState();

		expect(state.charactersOrder[0]).toBe(HERO);
		expect(delayingIds(state)).toEqual([SNEAK]);
		expect(state.charactersMap[SNEAK].turnState).toBe('delayed');
		expect(state.charactersMap[TRAP].turnState).toBe('knocked-out');
	});
});
