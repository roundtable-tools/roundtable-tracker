import type { Character } from '@/store/data';
import { isDelaying } from '@/store/operations';

type RoundState = {
	// Participants in the initiative queue that aren't delaying and still have
	// their turn this round.
	activeParticipantCount: number;
	charactersWithTurn: Set<string>;
	charactersMap: Record<string, Pick<Character, 'turnState'>>;
};

// Whether acting on this participant (end turn, delay, K.O.) closes the round.
// Delaying participants keep their turn but aren't in the active part of the
// round, so acting on one (e.g. a K.O. from the Delaying tab) never closes it.
export function isFinalActiveParticipant(
	participantId: string,
	{ activeParticipantCount, charactersWithTurn, charactersMap }: RoundState
) {
	return (
		activeParticipantCount === 1 &&
		charactersWithTurn.has(participantId) &&
		!isDelaying(charactersMap, participantId)
	);
}
