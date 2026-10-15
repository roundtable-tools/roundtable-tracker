import { describe, expect, it } from 'vitest';
import { isFinalActiveParticipant } from './isFinalActiveParticipant';

const JOE = 'sleepy-joe';
const MARK = 'energetic-mark';

// Round 1 of the issue #48 encounter: Joe starts delaying but keeps his turn,
// Mark is the only participant in the active part of the round.
const roundOneWithStartingDelayer = {
	activeParticipantCount: 1,
	charactersWithTurn: new Set([JOE, MARK]),
	charactersMap: {
		[JOE]: { turnState: 'delayed' as const },
		[MARK]: { turnState: 'normal' as const },
	},
};

describe('isFinalActiveParticipant', () => {
	it('closes the round on the last active participant with a turn', () => {
		expect(isFinalActiveParticipant(MARK, roundOneWithStartingDelayer)).toBe(
			true
		);
	});

	it('never closes the round for a delaying participant that has a turn', () => {
		expect(isFinalActiveParticipant(JOE, roundOneWithStartingDelayer)).toBe(
			false
		);
	});

	it('keeps the round open while more active participants have a turn', () => {
		expect(
			isFinalActiveParticipant(MARK, {
				...roundOneWithStartingDelayer,
				activeParticipantCount: 2,
			})
		).toBe(false);
	});

	it('ignores participants that already acted', () => {
		expect(
			isFinalActiveParticipant(MARK, {
				...roundOneWithStartingDelayer,
				charactersWithTurn: new Set([JOE]),
			})
		).toBe(false);
	});
});
