import { describe, it, expect } from 'vitest';
import { TrackedInitiative } from './TrackedInitiative.class';
import { InitiativeParticipant } from './InitiativeParticipant.class';
import { Command } from '@/CommandHistory/common';
import { Encounter } from '../encounters/Encounter.class';
import { RoundParticipant } from '../actors/participant/RoundParticipant.class';

// Mocks for dependencies
class MockEncounter {
	toEncounterParticipantList() {
		return [new InitiativeParticipant({
            initiative: 0,
            actor: {} as RoundParticipant,
        })];
	}
}

describe('TrackedInitiative', () => {
	it('should set properties from props', () => {
		const participants = [
			{} as InitiativeParticipant,
			{} as InitiativeParticipant,
		];
		const encounter = new MockEncounter() as unknown as Encounter;
		const history = [] as Command[];
		const tracked = new TrackedInitiative({
			participants,
			encounter,
			history,
		});

		expect(tracked.participants).toBe(participants);
		expect(tracked.encounter).toBe(encounter);
		expect(tracked.history).toBe(history);
	});

	it('startInitiative should create TrackedInitiative with correct participants', () => {
		// Arrange
		const encounter = new MockEncounter() as unknown as Encounter;
		const initiativeList = [15, 10, 5];

		// Act
		const tracked = TrackedInitiative.startInitiative(
			encounter,
			initiativeList
		);

		// Assert
		expect(tracked.encounter).toBe(encounter);
		expect(Array.isArray(tracked.participants)).toBe(true);
		expect(tracked.participants.length).toBe(3);
		tracked.participants.forEach((p, i) => {
			expect(p).toBeInstanceOf(InitiativeParticipant);
			expect(p.initiative).toBe(initiativeList[i]);
		});
		expect(Array.isArray(tracked.history)).toBe(true);
		expect(tracked.history.length).toBe(0);
	});
});
