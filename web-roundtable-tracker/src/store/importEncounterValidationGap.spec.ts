import { describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	ConcreteEncounterSchema,
	DIFFICULTY,
	LEVEL_REPRESENTATION,
	PRIORITY,
	characterConfigToCharacter,
	type CharacterConfig,
} from './data';
import { participantsToEncounterCharacters } from './convert';
import { createEncounterStore } from './store';

describe('Import encounter validation gap', () => {
	it('accepts the default Import Encounter payload', () => {
		const importPayload = {
			id: 'imported-encounter',
			name: 'Imported Encounter',
			description: 'Imported Encounter',
			difficulty: DIFFICULTY.Trivial,
			level: 1,
			partySize: 4,
			levelRepresentation: LEVEL_REPRESENTATION.Exact,
			participants: [],
		};

		const parsed = ConcreteEncounterSchema.parse(importPayload);

		expect(parsed.name).toBe('Imported Encounter');
		expect(parsed.participants).toEqual([]);
		expect(parsed.partySize).toBe(4);
	});

	it('accepts participants without health fields', () => {
		const importPayload = {
			id: 'imported-encounter',
			name: 'Missing Health Fields',
			description: 'Schema characterization',
			difficulty: DIFFICULTY.Low,
			level: 3,
			partySize: 4,
			levelRepresentation: LEVEL_REPRESENTATION.Exact,
			participants: [
				{
					name: 'Bandit',
					level: 2,
					side: ALIGNMENT.Opponents,
					count: 1,
				},
			],
		};

		const parsed = ConcreteEncounterSchema.parse(importPayload);

		expect(parsed.participants).toHaveLength(1);
		expect(parsed.participants[0].name).toBe('Bandit');
		expect(parsed.participants[0].health).toBeUndefined();
		expect(parsed.participants[0].maxHealth).toBeUndefined();
		expect(parsed.participants[0].tempHealth).toBeUndefined();
	});

	it('provides defaults when converting potentially incomplete CharacterConfig', () => {
		const importedParticipant = {
			uuid: 'character-1',
			name: 'Bandit',
			level: 2,
			side: ALIGNMENT.Opponents,
			tiePriority: PRIORITY.NPC,
			initiative: 10,
		} as unknown as CharacterConfig;

		const character = characterConfigToCharacter(importedParticipant);

		// After fix: characterConfigToCharacter ensures numeric defaults
		expect(character.health).toBe(1);
		expect(character.maxHealth).toBe(1);
		expect(character.tempHealth).toBe(0);
		expect(character.group).toBe('enemies');
	});

	it('provides default health values when converting participants without them', () => {
		const importedParticipant = {
			uuid: 'character-1',
			name: 'Bandit',
			level: 2,
			side: ALIGNMENT.Opponents,
			tiePriority: PRIORITY.NPC,
			initiative: 10,
		} as unknown as CharacterConfig;
		const converted = participantsToEncounterCharacters([importedParticipant]);
		const encounterStore = createEncounterStore();

		encounterStore.getState().startEncounter(converted);

		const state = encounterStore.getState();
		const stored = state.charactersMap['character-1'];

		expect(state.charactersOrder).toEqual(['character-1']);
		expect(state.round).toBe(1);
		// After fix: health fields should always be numeric
		expect(stored.health).toBe(1);
		expect(stored.maxHealth).toBe(1);
		expect(stored.tempHealth).toBe(0);
	});

	it('produces initiative-ready characters when preview defaults are materialized first', () => {
		const previewPreparedParticipant: CharacterConfig = {
			uuid: 'character-2',
			name: 'Bandit',
			level: 2,
			side: ALIGNMENT.Opponents,
			tiePriority: PRIORITY.NPC,
			initiative: 10,
			health: 1,
			maxHealth: 1,
			tempHealth: 0,
		};

		const [character] = participantsToEncounterCharacters([
			previewPreparedParticipant,
		]);

		expect(character.health).toBe(1);
		expect(character.maxHealth).toBe(1);
		expect(character.tempHealth).toBe(0);
	});
});
