import { beforeEach, describe, expect, it } from 'vitest';
import { Character } from '@/store/data';
import {
	createEncounterStore,
	TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import {
	runtimeToInitiativeQueue,
	runtimeToOutOfInitiativeData,
} from '@/store/trackerMappers';
import { STATUS } from '../common';
import { KnockOutCharacterCommand } from './KnockOutCharacterCommand';
import { RecordDisableProgressCommand } from './RecordDisableProgressCommand';

const HERO = '00000000-0000-0000-0000-000000000001';
const TRAP = '00000000-0000-0000-0000-000000000002';
const PIT = '00000000-0000-0000-0000-000000000003';
const CLOCKWORK = '00000000-0000-0000-0000-000000000004';

const createCharacter = (uuid: string, name: string): Character => ({
	uuid,
	name,
	initiative: 10,
	turnState: 'normal',
	health: 10,
	maxHealth: 10,
	tempHealth: 0,
	group: 'enemies',
});

const createMeta = (
	overrides: Partial<TrackerParticipantMeta>
): TrackerParticipantMeta => ({
	role: 'hazard',
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 3,
	disableChecksSucceeded: 0,
	notes: '',
	...overrides,
});

describe('RecordDisableProgressCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		encounterStore.setState({
			charactersMap: {
				[HERO]: createCharacter(HERO, 'Hero'),
				[TRAP]: createCharacter(TRAP, 'Poison Dart Gallery'),
				[PIT]: createCharacter(PIT, 'Hidden Pit'),
				[CLOCKWORK]: createCharacter(CLOCKWORK, 'Clockwork Soldier'),
			},
			charactersOrder: [HERO, TRAP, CLOCKWORK],
			charactersWithTurn: new Set([HERO, TRAP, CLOCKWORK]),
			round: 1,
			trackerMetaMap: {
				[HERO]: createMeta({
					role: 'pc',
					sideTheme: 'pc',
					disableChecksRequired: 0,
				}),
				[TRAP]: createMeta({}),
				[PIT]: createMeta({
					isSimpleHazard: true,
					disableChecksRequired: 2,
				}),
				[CLOCKWORK]: createMeta({
					role: 'opponent',
					disableChecksRequired: 2,
				}),
			},
		});
	});

	const successes = (uuid: string) =>
		encounterStore.getState().trackerMetaMap[uuid].disableChecksSucceeded;

	const turnState = (uuid: string) =>
		encounterStore.getState().charactersMap[uuid].turnState;

	const run = (
		props: ConstructorParameters<typeof RecordDisableProgressCommand>[0]
	) => {
		const command = new RecordDisableProgressCommand(props, {
			encounterStore,
		});

		return { command, status: command.execute() };
	};

	const knockOut = (uuid: string) =>
		new KnockOutCharacterCommand({ uuid }, { encounterStore }).execute();

	it('adds one success and undoes it', () => {
		const { command, status } = run({ uuid: TRAP, delta: 1 });

		expect(status).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(1);

		expect(command.undo()).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(0);
	});

	it('adds two successes for a critical success', () => {
		run({ uuid: TRAP, delta: 1 });
		run({ uuid: TRAP, delta: 2 });

		expect(successes(TRAP)).toBe(3);
	});

	it('sets the count manually, clamped to 0…required', () => {
		run({ uuid: TRAP, value: 2 });
		expect(successes(TRAP)).toBe(2);

		run({ uuid: TRAP, value: 10 });
		expect(successes(TRAP)).toBe(3);

		run({ uuid: TRAP, value: -4 });
		expect(successes(TRAP)).toBe(0);
	});

	it('clamps a critical success at the required count', () => {
		run({ uuid: PIT, delta: 1 });
		run({ uuid: PIT, delta: 2 });

		expect(successes(PIT)).toBe(2);
	});

	it('records successes for a creature with a disable count', () => {
		expect(run({ uuid: CLOCKWORK, delta: 2 }).status).toBe(STATUS.success);
		expect(successes(CLOCKWORK)).toBe(2);
	});

	it('fails for a participant without a disable count', () => {
		expect(run({ uuid: HERO, delta: 1 }).status).toBe(STATUS.failure);
		expect(
			run({ uuid: '00000000-0000-0000-0000-000000000099', delta: 1 }).status
		).toBe(STATUS.failure);
	});

	it('keeps a simple hazard with full checks in the hazards panel only', () => {
		run({ uuid: PIT, value: 2 });

		const state = encounterStore.getState();
		const panelHazard = runtimeToOutOfInitiativeData(state).hazards.find(
			(participant) => participant.id === PIT
		);

		expect(panelHazard?.disableChecksSucceeded).toBe(2);
		expect(state.charactersOrder).toEqual([HERO, TRAP, CLOCKWORK]);
		expect(state.charactersWithTurn).toEqual(new Set([HERO, TRAP, CLOCKWORK]));
	});

	it('leaves the turn order and the round alone when the checks fill up', () => {
		encounterStore.setState({
			charactersOrder: [TRAP, HERO, CLOCKWORK],
			charactersWithTurn: new Set([TRAP]),
		});

		run({ uuid: TRAP, value: 3 });

		const state = encounterStore.getState();

		expect(state.round).toBe(1);
		expect(state.charactersOrder).toEqual([TRAP, HERO, CLOCKWORK]);
		expect(state.charactersWithTurn).toEqual(new Set([TRAP]));
		expect(turnState(TRAP)).toBe('normal');
		expect(runtimeToInitiativeQueue(state).map((p) => p.id)).toContain(TRAP);
		expect(
			runtimeToOutOfInitiativeData(state).hazards.map((p) => p.id)
		).not.toContain(TRAP);
	});

	it('leaves a disabled participant out when its checks are corrected below full', () => {
		run({ uuid: TRAP, value: 3 });
		knockOut(TRAP);

		const disabledOrder = encounterStore.getState().charactersOrder;
		const { command } = run({ uuid: TRAP, value: 1 });

		expect(successes(TRAP)).toBe(1);
		expect(turnState(TRAP)).toBe('knocked-out');
		expect(encounterStore.getState().charactersOrder).toEqual(disabledOrder);

		expect(command.undo()).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(3);
		expect(turnState(TRAP)).toBe('knocked-out');
	});

	it('undoes and redoes after being rebuilt from its data', () => {
		const { command } = run({ uuid: TRAP, delta: 2 });
		const rebuilt = new RecordDisableProgressCommand(command.data, {
			encounterStore,
		});

		expect(rebuilt.undo()).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(0);

		expect(rebuilt.execute()).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(2);
	});
});
