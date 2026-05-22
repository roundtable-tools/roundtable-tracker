import type { UUID } from '@/utils/uuid';
import type { EncounterStore } from './encounterRuntimeStore';

export function getNowMs() {
	if (
		typeof performance !== 'undefined' &&
		typeof performance.now === 'function'
	) {
		return performance.now();
	}

	return Date.now();
}

export function getTurnDurationKey(round: number, participantId: string) {
	return `${round}:${participantId}`;
}

export function freezeElapsed(
	state: Pick<
		EncounterStore,
		| 'turnElapsedByRoundParticipant'
		| 'roundElapsedByRound'
		| 'activeTurnParticipantId'
		| 'activeTurnRound'
		| 'activeTurnStartedAtMs'
		| 'activeRoundStartedAtMs'
	>
) {
	const now = getNowMs();
	let turnElapsedByRoundParticipant = state.turnElapsedByRoundParticipant;
	let roundElapsedByRound = state.roundElapsedByRound;

	if (
		typeof state.activeTurnStartedAtMs === 'number' &&
		typeof state.activeTurnRound === 'number' &&
		typeof state.activeTurnParticipantId === 'string'
	) {
		const turnDelta = Math.max(0, now - state.activeTurnStartedAtMs);
		const turnKey = getTurnDurationKey(
			state.activeTurnRound,
			state.activeTurnParticipantId
		);

		turnElapsedByRoundParticipant = {
			...turnElapsedByRoundParticipant,
			[turnKey]: (turnElapsedByRoundParticipant[turnKey] ?? 0) + turnDelta,
		};
	}

	if (
		typeof state.activeRoundStartedAtMs === 'number' &&
		typeof state.activeTurnRound === 'number'
	) {
		const roundDelta = Math.max(0, now - state.activeRoundStartedAtMs);

		roundElapsedByRound = {
			...roundElapsedByRound,
			[state.activeTurnRound]:
				(roundElapsedByRound[state.activeTurnRound] ?? 0) + roundDelta,
		};
	}

	return {
		now,
		turnElapsedByRoundParticipant,
		roundElapsedByRound,
	};
}

export function getOwnerLabelAndKey(
	state: Pick<EncounterStore, 'trackerMetaMap' | 'charactersMap'>,
	participantId: UUID
) {
	const meta = state.trackerMetaMap[participantId];
	const participant = state.charactersMap[participantId];

	return {
		ownerLabel: meta?.ownerLabel ?? 'GM',
		ownerKey: meta?.ownerKey ?? 'gm',
		participantName: participant?.name ?? 'Unknown',
	};
}
