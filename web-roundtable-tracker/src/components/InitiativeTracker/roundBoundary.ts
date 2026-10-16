import { type TrackerParticipant } from '@/store/trackerMappers';

export function hasTurnLeft(
	participant: Pick<TrackerParticipant, 'id' | 'state'>,
	charactersWithTurn: Set<string>
) {
	return (
		participant.state !== 'delayed' && charactersWithTurn.has(participant.id)
	);
}

// The round ends after the last participant that still has a turn. After a
// manual reorder, participants that already acted can sit before it; they are
// skipped when the turn passes to them.
export function getRoundBoundaryIndex(
	participants: Pick<TrackerParticipant, 'id' | 'state'>[],
	charactersWithTurn: Set<string>
) {
	return (
		participants.findLastIndex((participant) =>
			hasTurnLeft(participant, charactersWithTurn)
		) + 1
	);
}
