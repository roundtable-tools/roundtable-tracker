import { beforeEach, describe, expect, it } from 'vitest';
import { Character } from '@/store/data';
import {
	createEncounterStore,
	TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import { STATUS } from '@/CommandHistory/common';
import { ChangeHealthCommand } from '@/CommandHistory/Commands/ChangeHealthCommand';
import { RecordDisableProgressCommand } from '@/CommandHistory/Commands/RecordDisableProgressCommand';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { getRoundActionCommand } from './roundActionCommand';
import {
	damageDropsToZeroHp,
	disableProgressFillsChecks,
	getTakeOutEffectCommand,
	getTakeOutEffects,
	withPrecedingCommand,
} from './takeOut';

const HERO = '00000000-0000-0000-0000-000000000001';
const CLOCKWORK = '00000000-0000-0000-0000-000000000002';
const TRAP = '00000000-0000-0000-0000-000000000003';
const GHOST = '00000000-0000-0000-0000-000000000004';

const character = (uuid: string, health = 10, tempHealth = 0): Character => ({
	uuid,
	name: uuid,
	initiative: 10,
	turnState: 'normal',
	health,
	maxHealth: 10,
	tempHealth,
});

const meta = (
	overrides: Partial<TrackerParticipantMeta> = {}
): TrackerParticipantMeta => ({
	role: 'opponent',
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 0,
	disableChecksSucceeded: 0,
	notes: '',
	...overrides,
});

describe('taking a participant out of the fight', () => {
	let store: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		store = createEncounterStore();
		store.setState({
			charactersMap: {
				[HERO]: character(HERO),
				[CLOCKWORK]: character(CLOCKWORK, 10, 5),
				[TRAP]: character(TRAP),
				[GHOST]: character(GHOST),
			},
			trackerMetaMap: {
				[HERO]: meta({ role: 'pc', sideTheme: 'pc' }),
				[CLOCKWORK]: meta({ disableChecksRequired: 2 }),
				[TRAP]: meta({
					role: 'hazard',
					hasHealthData: false,
					disableChecksRequired: 3,
				}),
				[GHOST]: meta({ hasHealthData: false }),
			},
			charactersOrder: [HERO, CLOCKWORK, TRAP, GHOST],
			delayedOrder: [],
			charactersWithTurn: new Set([HERO, CLOCKWORK, TRAP, GHOST]),
			round: 1,
		});
	});

	const deps = () => ({ encounterStore: store });

	describe('getTakeOutEffects', () => {
		it('offers one effect per value the participant has', () => {
			const state = store.getState();

			expect(getTakeOutEffects(CLOCKWORK, state)).toEqual(['hp', 'checks']);
			expect(getTakeOutEffects(HERO, state)).toEqual(['hp']);
			expect(getTakeOutEffects(TRAP, state)).toEqual(['checks']);
			expect(getTakeOutEffects(GHOST, state)).toEqual([]);
		});
	});

	describe('getTakeOutEffectCommand', () => {
		it('sets HP, temp HP included, to 0', () => {
			getTakeOutEffectCommand(
				CLOCKWORK,
				'hp',
				store.getState(),
				deps()
			)?.execute();

			expect(store.getState().charactersMap[CLOCKWORK]).toMatchObject({
				health: 0,
				tempHealth: 0,
			});
		});

		it('fills the disable checks', () => {
			getTakeOutEffectCommand(
				TRAP,
				'checks',
				store.getState(),
				deps()
			)?.execute();

			expect(store.getState().trackerMetaMap[TRAP].disableChecksSucceeded).toBe(
				3
			);
		});

		it('has nothing to do when the value is already set', () => {
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[HERO]: character(HERO, 0),
				},
				trackerMetaMap: {
					...store.getState().trackerMetaMap,
					[TRAP]: meta({
						role: 'hazard',
						disableChecksRequired: 3,
						disableChecksSucceeded: 3,
					}),
				},
			});

			expect(getTakeOutEffectCommand(HERO, 'hp', store.getState())).toBeNull();
			expect(
				getTakeOutEffectCommand(TRAP, 'checks', store.getState())
			).toBeNull();
		});
	});

	describe('damageDropsToZeroHp', () => {
		it('is true when the damage takes the last HP, after temp HP', () => {
			const state = store.getState();

			expect(damageDropsToZeroHp(HERO, 10, state)).toBe(true);
			expect(damageDropsToZeroHp(HERO, 9, state)).toBe(false);
			expect(damageDropsToZeroHp(CLOCKWORK, 14, state)).toBe(false);
			expect(damageDropsToZeroHp(CLOCKWORK, 15, state)).toBe(true);
		});

		it('is false without HP data, at 0 HP already or when already out', () => {
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[HERO]: character(HERO, 0),
					[CLOCKWORK]: { ...character(CLOCKWORK), turnState: 'knocked-out' },
				},
			});
			const state = store.getState();

			expect(damageDropsToZeroHp(GHOST, 50, state)).toBe(false);
			expect(damageDropsToZeroHp(HERO, 5, state)).toBe(false);
			expect(damageDropsToZeroHp(CLOCKWORK, 50, state)).toBe(false);
		});
	});

	describe('disableProgressFillsChecks', () => {
		it('is true when a success or a correction reaches the required count', () => {
			const state = store.getState();

			expect(disableProgressFillsChecks(TRAP, { delta: 2 }, state)).toBe(false);
			expect(disableProgressFillsChecks(TRAP, { value: 3 }, state)).toBe(true);
			expect(disableProgressFillsChecks(CLOCKWORK, { delta: 2 }, state)).toBe(
				true
			);
			expect(disableProgressFillsChecks(HERO, { delta: 2 }, state)).toBe(false);
		});

		it('is false when the checks are full already or the participant is out', () => {
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[CLOCKWORK]: { ...character(CLOCKWORK), turnState: 'knocked-out' },
				},
				trackerMetaMap: {
					...store.getState().trackerMetaMap,
					[TRAP]: meta({
						role: 'hazard',
						disableChecksRequired: 3,
						disableChecksSucceeded: 3,
					}),
				},
			});
			const state = store.getState();

			expect(disableProgressFillsChecks(TRAP, { delta: 1 }, state)).toBe(false);
			expect(disableProgressFillsChecks(CLOCKWORK, { delta: 2 }, state)).toBe(
				false
			);
		});
	});

	describe('one undo step with the change that caused it', () => {
		it('undoes the damage and the K.O. together', () => {
			const command = withPrecedingCommand(
				new ChangeHealthCommand({ uuid: HERO, delta: -10 }, deps()),
				getRoundActionCommand(HERO, 'ko', store.getState(), deps())
			);

			expect(command.execute()).toBe(STATUS.success);
			expect(store.getState().charactersMap[HERO]).toMatchObject({
				health: 0,
				turnState: 'knocked-out',
			});
			expect(store.getState().charactersOrder[0]).toBe(CLOCKWORK);

			expect(command.undo()).toBe(STATUS.success);
			expect(store.getState().charactersMap[HERO]).toMatchObject({
				health: 10,
				turnState: 'normal',
			});
			expect(store.getState().charactersOrder[0]).toBe(HERO);
		});

		it('undoes the filled checks and the Destroy together', () => {
			const command = withPrecedingCommand(
				new RecordDisableProgressCommand({ uuid: TRAP, value: 3 }, deps()),
				new RemoveCharacterCommand({ uuid: TRAP }, deps())
			);

			expect(command.execute()).toBe(STATUS.success);
			expect(store.getState().charactersMap[TRAP]).toBeUndefined();
			expect(store.getState().charactersOrder).not.toContain(TRAP);

			expect(command.undo()).toBe(STATUS.success);
			expect(store.getState().charactersMap[TRAP]).toBeDefined();
			expect(store.getState().charactersOrder).toContain(TRAP);
			expect(store.getState().trackerMetaMap[TRAP].disableChecksSucceeded).toBe(
				0
			);
		});

		it('runs the command alone without a preceding change', () => {
			const command = new RemoveCharacterCommand({ uuid: TRAP }, deps());

			expect(withPrecedingCommand(null, command)).toBe(command);
		});
	});
});
