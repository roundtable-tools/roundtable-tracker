import { beforeEach, describe, expect, it } from 'vitest';
import { validateImportedEncounter } from '@/components/EncounterDirectory/EncounterDetails/importEncounter';
import {
	buildTrackerMetaMap,
	participantsToEncounterCharacters,
} from './convert';
import { PRIORITY, type CharacterConfig } from './data';
import { createEncounterStore } from './encounterRuntimeStore';
import {
	migrateLegacyEncounter,
	migrateLegacyParticipant,
} from './legacyEncounterFields';
import { createSavedEncountersStore } from './savedEncounters';

// Encounter JSON from issue #48, plus the participant `type` that the current
// import schema requires. Sleepy Joe was exported with a starting delay.
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

describe('migrateLegacyParticipant', () => {
	it('starts a delayed participant in the order, hidden until its first turn', () => {
		expect(
			migrateLegacyParticipant({ name: 'Joe', startingState: 'delayed' })
		).toEqual({
			name: 'Joe',
			startingState: 'normal',
			hiddenUntilFirstTurn: true,
		});
	});

	it('drops a silent delay with the starting delay', () => {
		expect(
			migrateLegacyParticipant({
				name: 'Lurker',
				startingState: 'delayed',
				silentDelay: true,
			})
		).toEqual({
			name: 'Lurker',
			startingState: 'normal',
			hiddenUntilFirstTurn: true,
		});
	});

	it('turns hiddenFromPlayers into hiddenUntilFirstTurn', () => {
		expect(
			migrateLegacyParticipant({
				name: 'Guard',
				startingState: 'knocked-out',
				hiddenFromPlayers: true,
			})
		).toEqual({
			name: 'Guard',
			startingState: 'knocked-out',
			hiddenUntilFirstTurn: true,
		});
		expect(
			migrateLegacyParticipant({ name: 'Guard', hiddenFromPlayers: false })
		).toEqual({ name: 'Guard' });
	});

	it('leaves current participants unchanged', () => {
		const participant = {
			name: 'Scout',
			startingState: 'normal',
			hiddenUntilFirstTurn: true,
		};

		expect(migrateLegacyParticipant(participant)).toEqual(participant);
	});
});

describe('migrateLegacyEncounter', () => {
	it('migrates the participants of the encounter, its slots and variants', () => {
		const delayed = { name: 'Joe', startingState: 'delayed' };
		const migrated = {
			name: 'Joe',
			startingState: 'normal',
			hiddenUntilFirstTurn: true,
		};

		expect(
			migrateLegacyEncounter({
				participants: [delayed],
				narrativeSlots: [{ participants: [delayed] }, {}],
				variants: [{ participants: [delayed] }],
			})
		).toEqual({
			participants: [migrated],
			narrativeSlots: [{ participants: [migrated] }, {}],
			variants: [{ participants: [migrated] }],
		});
	});
});

describe('Importing an encounter exported with a starting delay (#48)', () => {
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
			.startEncounter(
				participantsToEncounterCharacters(configs),
				buildTrackerMetaMap(configs)
			);

		return encounterStore.getState();
	};

	it('starts the participant in the initiative order with its turn', () => {
		const state = startTicketEncounter();

		expect(state.charactersMap[JOE].turnState).toBe('normal');
		expect(state.charactersOrder).toEqual([JOE, MARK]);
		expect(state.delayedOrder).toEqual([]);
		expect(state.charactersWithTurn).toEqual(new Set([JOE, MARK]));
	});

	it('keeps the participant hidden until its first turn', () => {
		const state = startTicketEncounter();

		expect(state.trackerMetaMap[JOE].hiddenUntilFirstTurn).toBe(true);
		expect(state.trackerMetaMap[MARK].hiddenUntilFirstTurn).toBeUndefined();
	});
});

describe('Saved encounters from before the migration', () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it('are migrated when the store loads them', async () => {
		localStorage.setItem(
			'saved-encounters-store',
			JSON.stringify({
				state: {
					savedEncounters: [
						{
							id: 'old',
							name: 'Old',
							participants: [
								{ name: 'Joe', startingState: 'delayed', silentDelay: true },
								{ name: 'Guard', hiddenFromPlayers: true },
							],
							narrativeSlots: [
								{
									id: 'slot',
									participants: [{ name: 'Late', startingState: 'delayed' }],
								},
							],
						},
					],
				},
				version: 0,
			})
		);

		const store = createSavedEncountersStore();

		await store.persist.rehydrate();

		const [encounter] = store.getState().savedEncounters;

		expect(encounter.participants).toEqual([
			{ name: 'Joe', startingState: 'normal', hiddenUntilFirstTurn: true },
			{ name: 'Guard', hiddenUntilFirstTurn: true },
		]);
		expect(encounter.narrativeSlots?.[0]?.participants).toEqual([
			{ name: 'Late', startingState: 'normal', hiddenUntilFirstTurn: true },
		]);
	});
});
