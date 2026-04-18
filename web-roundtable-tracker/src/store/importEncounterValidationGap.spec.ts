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
import { createEncounterStore } from './encounterRuntimeStore';

describe('Import encounter validation gap', () => {
	const createBaseImportPayload = () => ({
		id: 'imported-encounter',
		name: 'Imported Encounter',
		description: 'Imported Encounter',
		difficulty: DIFFICULTY.Trivial,
		level: 1,
		partySize: 4,
		levelRepresentation: LEVEL_REPRESENTATION.Exact,
		participants: [],
	});

	it('accepts the default Import Encounter payload', () => {
		const importPayload = createBaseImportPayload();

		const parsed = ConcreteEncounterSchema.parse(importPayload);

		expect(parsed.name).toBe('Imported Encounter');
		expect(parsed.participants).toEqual([]);
		expect(parsed.partySize).toBe(4);
	});

	it('accepts participant simple hazard and adjustment fields', () => {
		const importPayload = {
			...createBaseImportPayload(),
			participants: [
				{
					name: 'Simple Trap',
					level: 2,
					side: ALIGNMENT.Opponents,
					type: 'hazard',
					successesToDisable: 2,
					isComplexHazard: false,
				},
			],
		};

		const parsed = ConcreteEncounterSchema.parse(importPayload) as {
			participants: Array<Record<string, unknown>>;
		};

		expect(parsed.participants).toHaveLength(1);
		expect(parsed.participants[0].type).toBe('hazard');
		expect(parsed.participants[0].isComplexHazard).toBe(false);
	});

	it('rejects invalid participant adjustment values', () => {
		const importPayload = {
			...createBaseImportPayload(),
			participants: [
				{
					name: 'Bandit',
					level: 2,
					side: ALIGNMENT.Opponents,
					type: 'creature',
					adjustment: 'mythic',
				},
			],
		};

		const parsed = ConcreteEncounterSchema.safeParse(importPayload);

		expect(parsed.success).toBe(false);
	});

	it('accepts and preserves narrative slot elements', () => {
		const importPayload = {
			...createBaseImportPayload(),
			narrativeSlots: [
				{
					id: 'slot-1',
					type: 'reinforcement',
					description: 'More enemies arrive at the start of round 2.',
					trigger: {
						round: 2,
						frequency: 1,
					},
					participants: [
						{
							name: 'Reinforcement Scout',
							level: 1,
							side: ALIGNMENT.Opponents,
							type: 'creature',
							count: 1,
						},
					],
				},
			],
		};

		const parsed = ConcreteEncounterSchema.parse(importPayload) as {
			narrativeSlots?: Array<Record<string, unknown>>;
		};

		expect(parsed.narrativeSlots).toHaveLength(1);
		expect(parsed.narrativeSlots?.[0].type).toBe('reinforcement');
		expect(parsed.narrativeSlots?.[0].trigger).toEqual({ round: 2, frequency: 1 });
	});

	it('rejects narrative slot elements with invalid type', () => {
		const importPayload = {
			...createBaseImportPayload(),
			narrativeSlots: [
				{
					id: 'slot-2',
					type: 'weather',
					description: 'Heavy rain starts.',
					trigger: {
						round: 3,
					},
				},
			],
		};

		const parsed = ConcreteEncounterSchema.safeParse(importPayload);

		expect(parsed.success).toBe(false);
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
					type: 'creature',
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
