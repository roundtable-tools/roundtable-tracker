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
import { RecordHazardDisableProgressCommand } from './RecordHazardDisableProgressCommand';

const HERO = '00000000-0000-0000-0000-000000000001';
const TRAP = '00000000-0000-0000-0000-000000000002';
const PIT = '00000000-0000-0000-0000-000000000003';

const createCharacter = (uuid: string, name: string): Character => ({
	uuid,
	name,
	initiative: 10,
	turnState: 'normal',
	hasTurn: false,
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

describe('RecordHazardDisableProgressCommand', () => {
	let encounterStore: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		encounterStore = createEncounterStore();
		encounterStore.setState({
			charactersMap: {
				[HERO]: createCharacter(HERO, 'Hero'),
				[TRAP]: createCharacter(TRAP, 'Poison Dart Gallery'),
				[PIT]: createCharacter(PIT, 'Hidden Pit'),
			},
			charactersOrder: [HERO, TRAP],
			delayedOrder: [],
			charactersWithTurn: new Set([HERO, TRAP]),
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
			},
		});
	});

	const successes = (uuid: string) =>
		encounterStore.getState().trackerMetaMap[uuid].disableChecksSucceeded;

	const run = (
		props: ConstructorParameters<typeof RecordHazardDisableProgressCommand>[0]
	) => {
		const command = new RecordHazardDisableProgressCommand(props, {
			encounterStore,
		});

		return { command, status: command.execute() };
	};

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

	it('fails for a participant that is not a hazard with a disable count', () => {
		expect(run({ uuid: HERO, delta: 1 }).status).toBe(STATUS.failure);
		expect(
			run({ uuid: '00000000-0000-0000-0000-000000000099', delta: 1 }).status
		).toBe(STATUS.failure);
	});

	it('keeps a disabled simple hazard in the hazards panel only', () => {
		run({ uuid: PIT, value: 2 });

		const state = encounterStore.getState();
		const panelHazard = runtimeToOutOfInitiativeData(state).hazards.find(
			(participant) => participant.id === PIT
		);

		expect(panelHazard?.disableChecksSucceeded).toBe(2);
		expect(state.charactersOrder).toEqual([HERO, TRAP]);
		expect(state.charactersWithTurn).toEqual(new Set([HERO, TRAP]));
	});

	it('takes a disabled complex hazard out of the turn order and undoes it', () => {
		const { command } = run({ uuid: TRAP, value: 3 });
		const state = encounterStore.getState();

		expect(state.charactersOrder).toEqual([HERO]);
		expect(state.charactersWithTurn).toEqual(new Set([HERO]));
		expect(runtimeToInitiativeQueue(state).map((p) => p.id)).toEqual([HERO]);
		expect(
			runtimeToOutOfInitiativeData(state).hazards.map((p) => p.id)
		).toContain(TRAP);

		expect(command.undo()).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(0);
		expect(encounterStore.getState().charactersOrder).toEqual([HERO, TRAP]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([HERO, TRAP])
		);
	});

	it('advances the round when the disabled hazard was the last with a turn', () => {
		encounterStore.setState({
			charactersOrder: [TRAP, HERO],
			charactersWithTurn: new Set([TRAP]),
		});

		run({ uuid: TRAP, delta: 2 });

		expect(successes(TRAP)).toBe(2);
		expect(encounterStore.getState().round).toBe(1);

		const { command } = run({ uuid: TRAP, delta: 1 });

		expect(encounterStore.getState().round).toBe(2);
		expect(encounterStore.getState().charactersOrder).toEqual([HERO]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([HERO])
		);

		expect(command.undo()).toBe(STATUS.success);
		expect(encounterStore.getState().round).toBe(1);
		expect(encounterStore.getState().charactersOrder).toEqual([TRAP, HERO]);
		expect(encounterStore.getState().charactersWithTurn).toEqual(
			new Set([TRAP])
		);
	});

	it('puts a complex hazard back at the end of the queue when corrected below the required count', () => {
		run({ uuid: TRAP, value: 3 });
		run({ uuid: TRAP, value: 1 });

		const state = encounterStore.getState();

		expect(successes(TRAP)).toBe(1);
		expect(state.charactersOrder).toEqual([HERO, TRAP]);
		expect(state.charactersWithTurn.has(TRAP)).toBe(false);
	});

	it('restores the original state when revived from its serialized data', () => {
		const { command } = run({ uuid: TRAP, value: 3 });
		const revived = new RecordHazardDisableProgressCommand(
			structuredClone(command.data),
			{ encounterStore }
		);

		expect(revived.undo()).toBe(STATUS.success);
		expect(successes(TRAP)).toBe(0);
		expect(encounterStore.getState().charactersOrder).toEqual([HERO, TRAP]);
	});
});
