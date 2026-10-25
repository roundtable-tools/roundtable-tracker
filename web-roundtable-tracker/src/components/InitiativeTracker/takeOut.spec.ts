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
import { ReactivateCharacterCommand } from '@/CommandHistory/Commands/ReactivateCharacterCommand';
import {
	getRemoveCommand,
	getRoundActionCommand,
	removalEndsTurn,
} from './roundActionCommand';
import {
	damageDropsToZeroHp,
	disableProgressFillsChecks,
	disableProgressLeavesFullChecks,
	getApplicableTakeOutEffects,
	getBringBackEffectCommand,
	getDefaultTakeOut,
	getOtherValuesAtTakeOutLevel,
	getTakeOutEffectCommand,
	getTakeOutEffects,
	getValuesAtTakeOutLevel,
	healingLeavesZeroHp,
	inOneUndoStep,
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

	describe('getApplicableTakeOutEffects', () => {
		it('leaves out values already at their take-out level', () => {
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[CLOCKWORK]: character(CLOCKWORK, 0),
				},
			});

			expect(getApplicableTakeOutEffects(CLOCKWORK, store.getState())).toEqual([
				'checks',
			]);
			expect(getApplicableTakeOutEffects(HERO, store.getState())).toEqual([
				'hp',
			]);
		});

		it('leaves out HP at 0 even with temp HP left', () => {
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[HERO]: character(HERO, 0, 3),
				},
			});

			expect(getApplicableTakeOutEffects(HERO, store.getState())).toEqual([]);
			expect(getTakeOutEffectCommand(HERO, 'hp', store.getState())).toBeNull();
		});
	});

	describe('getDefaultTakeOut', () => {
		it('slays or destroys opponents and knocks out everyone else', () => {
			expect(
				getDefaultTakeOut({ role: 'opponent', sideTheme: 'opponent' })
			).toBe('remove');
			expect(getDefaultTakeOut({ role: 'hazard', sideTheme: 'opponent' })).toBe(
				'remove'
			);
			expect(getDefaultTakeOut({ role: 'pc', sideTheme: 'pc' })).toBe('out');
			expect(getDefaultTakeOut({ role: 'ally', sideTheme: 'ally' })).toBe(
				'out'
			);
			expect(getDefaultTakeOut({ role: 'neutral', sideTheme: 'neutral' })).toBe(
				'out'
			);
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
			const command = inOneUndoStep(
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
			const command = inOneUndoStep(
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

			expect(inOneUndoStep(null, command)).toBe(command);
		});
	});

	describe('Slay / Destroy of a participant whose turn it is', () => {
		it('ends the turn first only for the current actor or the last to act', () => {
			const state = store.getState();

			expect(removalEndsTurn(HERO, state)).toBe(true);
			expect(removalEndsTurn(CLOCKWORK, state)).toBe(false);

			store.setState({
				charactersOrder: [HERO, CLOCKWORK, TRAP, GHOST],
				charactersWithTurn: new Set([GHOST]),
			});

			expect(removalEndsTurn(GHOST, store.getState())).toBe(true);
			expect(removalEndsTurn(TRAP, store.getState())).toBe(false);
		});

		it('moves on to the next round when the last one to act is slain', () => {
			store.setState({
				charactersOrder: [GHOST, HERO, CLOCKWORK, TRAP],
				charactersWithTurn: new Set([GHOST]),
			});
			const command = getRemoveCommand(GHOST, store.getState(), deps());

			expect(command.execute()).toBe(STATUS.success);
			expect(store.getState()).toMatchObject({
				round: 2,
				charactersOrder: [HERO, CLOCKWORK, TRAP],
				charactersWithTurn: new Set([HERO, CLOCKWORK, TRAP]),
			});

			expect(command.undo()).toBe(STATUS.success);
			expect(store.getState()).toMatchObject({
				round: 1,
				charactersOrder: [GHOST, HERO, CLOCKWORK, TRAP],
				charactersWithTurn: new Set([GHOST]),
			});
		});
	});

	it('ends the current turn before slaying the current actor', () => {
		const command = getRemoveCommand(HERO, store.getState(), deps());

		expect(command.execute()).toBe(STATUS.success);
		expect(store.getState()).toMatchObject({
			round: 1,
			charactersOrder: [CLOCKWORK, TRAP, GHOST],
			charactersWithTurn: new Set([CLOCKWORK, TRAP, GHOST]),
		});

		expect(command.undo()).toBe(STATUS.success);
		expect(store.getState().charactersOrder).toEqual([
			HERO,
			CLOCKWORK,
			TRAP,
			GHOST,
		]);
	});

	it('only removes a participant whose turn is not up', () => {
		expect(
			getRemoveCommand(CLOCKWORK, store.getState(), deps())
		).toBeInstanceOf(RemoveCharacterCommand);
	});

	describe('bringing a participant back', () => {
		const knockOut = (uuid: string, health: number, succeeded: number) =>
			store.setState({
				charactersMap: {
					...store.getState().charactersMap,
					[uuid]: {
						...store.getState().charactersMap[uuid],
						health,
						tempHealth: 0,
						turnState: 'knocked-out',
					},
				},
				trackerMetaMap: {
					...store.getState().trackerMetaMap,
					[uuid]: {
						...store.getState().trackerMetaMap[uuid],
						disableChecksSucceeded: succeeded,
					},
				},
			});

		it('lists only the values at their take-out level', () => {
			knockOut(CLOCKWORK, 0, 2);
			knockOut(HERO, 4, 0);
			knockOut(TRAP, 10, 3);
			const state = store.getState();

			expect(getValuesAtTakeOutLevel(CLOCKWORK, state)).toEqual([
				'hp',
				'checks',
			]);
			expect(getValuesAtTakeOutLevel(HERO, state)).toEqual([]);
			expect(getValuesAtTakeOutLevel(TRAP, state)).toEqual(['checks']);
			expect(getOtherValuesAtTakeOutLevel(CLOCKWORK, 'hp', state)).toEqual([
				'checks',
			]);
			expect(getOtherValuesAtTakeOutLevel(TRAP, 'checks', state)).toEqual([]);
		});

		it('notices healing from 0 HP of a participant that is out', () => {
			knockOut(CLOCKWORK, 0, 2);
			knockOut(HERO, 4, 0);
			const state = store.getState();

			expect(healingLeavesZeroHp(CLOCKWORK, 3, state)).toBe(true);
			expect(healingLeavesZeroHp(CLOCKWORK, 0, state)).toBe(false);
			expect(healingLeavesZeroHp(HERO, 3, state)).toBe(false);
			expect(healingLeavesZeroHp(GHOST, 3, state)).toBe(false);
		});

		it('notices disable checks lowered from full of a participant that is out', () => {
			knockOut(CLOCKWORK, 0, 2);
			const state = store.getState();

			expect(
				disableProgressLeavesFullChecks(CLOCKWORK, { value: 1 }, state)
			).toBe(true);
			expect(
				disableProgressLeavesFullChecks(CLOCKWORK, { delta: 1 }, state)
			).toBe(false);
			expect(disableProgressLeavesFullChecks(TRAP, { value: 0 }, state)).toBe(
				false
			);
		});

		it('sets HP to 1 and the checks to one below full, with the reactivation in one step', () => {
			knockOut(CLOCKWORK, 0, 2);
			const state = store.getState();
			const command = inOneUndoStep(
				getBringBackEffectCommand(CLOCKWORK, 'hp', state, deps()),
				getBringBackEffectCommand(CLOCKWORK, 'checks', state, deps()),
				new ReactivateCharacterCommand({ uuid: CLOCKWORK }, deps())
			);

			expect(command.execute()).toBe(STATUS.success);
			expect(store.getState().charactersMap[CLOCKWORK]).toMatchObject({
				health: 1,
				turnState: 'normal',
			});
			expect(
				store.getState().trackerMetaMap[CLOCKWORK].disableChecksSucceeded
			).toBe(1);

			expect(command.undo()).toBe(STATUS.success);
			expect(store.getState().charactersMap[CLOCKWORK]).toMatchObject({
				health: 0,
				turnState: 'knocked-out',
			});
			expect(
				store.getState().trackerMetaMap[CLOCKWORK].disableChecksSucceeded
			).toBe(2);
		});

		it('leaves a value alone when it is not at its take-out level', () => {
			knockOut(CLOCKWORK, 5, 2);

			expect(
				getBringBackEffectCommand(CLOCKWORK, 'hp', store.getState())
			).toBeNull();
		});
	});
});
