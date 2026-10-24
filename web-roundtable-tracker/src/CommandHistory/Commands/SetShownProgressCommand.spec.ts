import { beforeEach, describe, expect, it } from 'vitest';
import { Character } from '@/store/data';
import {
	createEncounterStore,
	TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import { runtimeToPlayerInitiativeQueue } from '@/store/trackerMappers';
import { STATUS } from '../common';
import { SetShownProgressCommand } from './SetShownProgressCommand';

const CLOCKWORK = '00000000-0000-0000-0000-000000000001';
const TRAP = '00000000-0000-0000-0000-000000000002';

const character = (uuid: string): Character => ({
	uuid,
	name: uuid,
	initiative: 10,
	turnState: 'normal',
	health: 10,
	maxHealth: 20,
	tempHealth: 0,
});

const meta = (
	role: TrackerParticipantMeta['role']
): TrackerParticipantMeta => ({
	role,
	sideTheme: 'opponent',
	isSimpleHazard: false,
	disableChecksRequired: 4,
	disableChecksSucceeded: 1,
	notes: '',
});

describe('SetShownProgressCommand', () => {
	let store: ReturnType<typeof createEncounterStore>;

	beforeEach(() => {
		store = createEncounterStore();
		store.setState({
			charactersMap: {
				[CLOCKWORK]: character(CLOCKWORK),
				[TRAP]: character(TRAP),
			},
			trackerMetaMap: { [CLOCKWORK]: meta('opponent'), [TRAP]: meta('hazard') },
			charactersOrder: [CLOCKWORK, TRAP],
			charactersWithTurn: new Set([CLOCKWORK, TRAP]),
		});
	});

	const player = (uuid: string) =>
		runtimeToPlayerInitiativeQueue(store.getState()).find(
			(participant) => participant.id === uuid
		);

	const show = (uuid: string, shownProgress: 'hp' | 'disable') => {
		const command = new SetShownProgressCommand(
			{ uuid, shownProgress },
			{ encounterStore: store }
		);

		return { command, status: command.execute() };
	};

	it('shows HP for a creature and disable progress for a hazard by default', () => {
		expect(player(CLOCKWORK)?.disableProgress).toBeNull();
		expect(player(CLOCKWORK)?.hpLabel).toBe('Badly Injured');
		expect(player(TRAP)?.disableProgress).toMatchObject({
			succeeded: 1,
			required: 4,
		});
	});

	it('switches the player view to disable progress, and undoes it', () => {
		const { command, status } = show(CLOCKWORK, 'disable');

		expect(status).toBe(STATUS.success);
		expect(player(CLOCKWORK)?.disableProgress).toMatchObject({
			succeeded: 1,
			required: 4,
		});

		expect(command.undo()).toBe(STATUS.success);
		expect(store.getState().trackerMetaMap[CLOCKWORK].shownProgress).toBe(
			undefined
		);
		expect(player(CLOCKWORK)?.disableProgress).toBeNull();
	});

	it('switches a hazard to HP', () => {
		show(TRAP, 'hp');

		expect(player(TRAP)?.disableProgress).toBeNull();
		expect(player(TRAP)?.hpLabel).toBe('Badly Injured');
	});

	it('fails for an unknown participant', () => {
		expect(show('00000000-0000-0000-0000-000000000099', 'hp').status).toBe(
			STATUS.failure
		);
	});
});
