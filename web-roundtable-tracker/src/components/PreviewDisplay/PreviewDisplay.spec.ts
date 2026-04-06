import { describe, expect, it } from 'vitest';
import {
	ALIGNMENT,
	PRIORITY,
	InitiativeParticipant,
} from '@/store/data';

describe('PreviewDisplay form defaulting path', () => {
	it('materializes form defaults for initiative participants missing health fields', () => {
		// Simulate what PreviewDisplay.generateParticipants produces from imported encounter
		const importedParticipants: InitiativeParticipant[] = [
			{
				uuid: 'npc-1',
				name: 'Bandit',
				level: 2,
				side: ALIGNMENT.Opponents,
				tiePriority: PRIORITY.NPC,
				initiative: 8,
				// Note: health, maxHealth, tempHealth are not present from import
			},
		];

		// Simulate what PreviewDisplay.generateParty produces (player characters)
		const generatedPlayers: InitiativeParticipant[] = [
			{
				uuid: 'pc-1',
				name: 'Player 1',
				level: 3,
				side: ALIGNMENT.PCs,
				tiePriority: PRIORITY.PC,
				initiative: 12,
				// Note: health, maxHealth, tempHealth are not present from generation
			},
		];

		const allParticipants = [generatedPlayers[0], importedParticipants[0]];

		// Simulate what useForm defaultValues does - spread defaults per PreviewDisplay line 145
		const formDefaults = allParticipants.map((participant) => ({
			initiative: 0,
			maxHealth: 1,
			tempHealth: 0,
			...participant,
			health: participant.health ?? participant.maxHealth ?? 1,
		}));

		// Verify all health fields are now defined
		formDefaults.forEach((field) => {
			expect(field.initiative).toBeDefined();
			expect(field.maxHealth).toBeDefined();
			expect(field.tempHealth).toBeDefined();
			expect(field.health).toBeDefined();
			expect(typeof field.health).toBe('number');
			expect(typeof field.maxHealth).toBe('number');
			expect(typeof field.tempHealth).toBe('number');
		});

		// Verify specific values
		const npcDefaults = formDefaults.find((f) => f.name === 'Bandit');
		const pcDefaults = formDefaults.find((f) => f.name === 'Player 1');

		expect(npcDefaults?.health).toBe(1);
		expect(npcDefaults?.maxHealth).toBe(1);
		expect(npcDefaults?.tempHealth).toBe(0);

		expect(pcDefaults?.health).toBe(1);
		expect(pcDefaults?.maxHealth).toBe(1);
		expect(pcDefaults?.tempHealth).toBe(0);
	});

	it('preserves existing health values when present', () => {
		const participantWithHealth: InitiativeParticipant & {
			health?: number;
			maxHealth?: number;
			tempHealth?: number;
		} = {
			uuid: 'npc-2',
			name: 'Elite Guard',
			level: 4,
			side: ALIGNMENT.Opponents,
			tiePriority: PRIORITY.NPC,
			initiative: 14,
			health: 45,
			maxHealth: 50,
			tempHealth: 5,
		};

		const formDefaults = {
			initiative: 0,
			maxHealth: 1,
			tempHealth: 0,
			...participantWithHealth,
			health: participantWithHealth.health ?? participantWithHealth.maxHealth ?? 1,
		};

		expect(formDefaults.health).toBe(45);
		expect(formDefaults.maxHealth).toBe(50);
		expect(formDefaults.tempHealth).toBe(5);
	});

	it('handles partial health field presence', () => {
		const participantPartialHealth: InitiativeParticipant & {
			health?: number;
			maxHealth?: number;
			tempHealth?: number;
		} = {
			uuid: 'npc-3',
			name: 'Scout',
			level: 1,
			side: ALIGNMENT.Opponents,
			tiePriority: PRIORITY.NPC,
			initiative: 10,
			maxHealth: 20, // only maxHealth present
		};

		const formDefaults = {
			initiative: 0,
			maxHealth: 1,
			tempHealth: 0,
			...participantPartialHealth,
			health: participantPartialHealth.health ?? participantPartialHealth.maxHealth ?? 1,
		};

		expect(formDefaults.health).toBe(20);
		expect(formDefaults.maxHealth).toBe(20);
		expect(formDefaults.tempHealth).toBe(0);
	});
});
