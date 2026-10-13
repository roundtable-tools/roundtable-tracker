import { describe, expect, it } from 'vitest';
import { validateImportedEncounter } from '@/components/EncounterDirectory/EncounterDetails/importEncounter';
import { FinalizeTurnAndAdvanceRoundCommand } from '@/CommandHistory/Commands/FinalizeTurnAndAdvanceRoundCommand';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { STATUS } from '@/CommandHistory/common';
import { participantsToEncounterCharacters } from './convert';
import { PRIORITY, type CharacterConfig } from './data';
import { createEncounterStore } from './encounterRuntimeStore';

// Encounter JSON from issue #48, plus the participant `type` that the current
// import schema requires.
const ticketEncounterJson = JSON.stringify({
	name: '',
	description: '',
	difficulty: 1,
	level: 1,
	partySize: 1,
	participants: [
		{
			type: 'creature',
			name: 'Sleepy Joe',
			level: 1,
			side: 1,
			startingState: 'delayed',
		},
		{
			type: 'creature',
			name: 'Energetic Mark',
			level: 1,
			side: 1,
		},
	],
});

const JOE = 'sleepy-joe';
const MARK = 'energetic-mark';

const startTicketEncounter = () => {
	const [encounter, error] = validateImportedEncounter(ticketEncounterJson);

	expect(error).toBe('');

	const uuids = [JOE, MARK];
	const configs = encounter!.participants.map(
		(participant, index) =>
			({
				...participant,
				uuid: uuids[index],
				tiePriority: PRIORITY.NPC,
				initiative: 10,
			}) as CharacterConfig
	);
	const encounterStore = createEncounterStore();

	encounterStore
		.getState()
		.startEncounter(participantsToEncounterCharacters(configs));

	return encounterStore;
};

describe('Participants that start the encounter delaying (#48)', () => {
	it('starts the delayed participant out of the initiative order', () => {
		const state = startTicketEncounter().getState();

		expect(state.round).toBe(1);
		expect(state.charactersMap[JOE].turnState).toBe('delayed');
		expect(state.delayedOrder).toEqual([JOE]);
		expect(state.charactersOrder).toEqual([MARK]);
	});

	it('keeps the round-1 turn of the delayed participant', () => {
		const state = startTicketEncounter().getState();

		expect(state.charactersWithTurn.has(JOE)).toBe(true);
		expect(state.charactersWithTurn.has(MARK)).toBe(true);
	});

	it('lets the delayed participant return and act in round 1', () => {
		const encounterStore = startTicketEncounter();
		const deps = { encounterStore };

		expect(
			new ReturnToInitiativeCommand(
				{ activeUuid: MARK, returningUuid: JOE, action: 'end-turn' },
				deps
			).execute()
		).toBe(STATUS.success);

		let state = encounterStore.getState();

		expect(state.round).toBe(1);
		expect(state.charactersOrder).toEqual([JOE, MARK]);
		expect(state.delayedOrder).toEqual([]);
		expect(state.charactersWithTurn.has(JOE)).toBe(true);
		expect(state.charactersWithTurn.has(MARK)).toBe(false);

		expect(
			new FinalizeTurnAndAdvanceRoundCommand(
				{ uuid: JOE, action: 'end-turn' },
				deps
			).execute()
		).toBe(STATUS.success);

		state = encounterStore.getState();

		expect(state.round).toBe(2);
		expect(state.charactersWithTurn).toEqual(new Set([JOE, MARK]));
	});
});
