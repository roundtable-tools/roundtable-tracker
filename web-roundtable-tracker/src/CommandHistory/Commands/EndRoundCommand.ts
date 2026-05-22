import { nextRound } from '@/store/operations';
import {
	COMMAND_TAGS,
	Command,
	CommandDeps,
	getDeps,
	STATUS,
	undoOriginalState,
} from '../common';
import { freezeElapsed } from '@/store/timers';
import { INITIATIVE_PHASE } from '@/store/encounterRuntimeStore';

type CommandData = {
	original?: ReturnType<typeof nextRound> & {
		turnElapsedByRoundParticipant: Record<string, number>;
		roundElapsedByRound: Record<number, number>;
		lastRoundElapsedMs: number;
		roundDurationHistory: Array<{
			round: number;
			elapsedMs: number;
		}>;
		activeTurnParticipantId?: string;
		activeTurnRound?: number;
		activeTurnStartedAtMs?: number;
		activeRoundStartedAtMs?: number;
	};
};

export class EndRoundCommand implements Command {
	readonly type = 'EndRoundCommand';
	readonly tags = [COMMAND_TAGS.endsRound] as const;
	description = 'End Round Command';

	constructor(
		public data: CommandData = {},
		private deps?: CommandDeps
	) {}

	execute() {
		const { encounterStore } = getDeps(this.deps);

		encounterStore.setState((state) => {
			const { now, turnElapsedByRoundParticipant, roundElapsedByRound } =
				freezeElapsed(state);
			const endedRound = state.round;
			const roundElapsedMs = roundElapsedByRound[endedRound] ?? 0;
			const baseNextRound = nextRound(state);
			const nextActiveParticipantId = state.charactersOrder[0];

			this.data.original = {
				round: state.round,
				charactersWithTurn: new Set(state.charactersWithTurn),
				turnElapsedByRoundParticipant: structuredClone(
					state.turnElapsedByRoundParticipant
				),
				roundElapsedByRound: structuredClone(state.roundElapsedByRound),
				lastRoundElapsedMs: state.lastRoundElapsedMs,
				roundDurationHistory: structuredClone(state.roundDurationHistory),
				activeTurnParticipantId: state.activeTurnParticipantId,
				activeTurnRound: state.activeTurnRound,
				activeTurnStartedAtMs: state.activeTurnStartedAtMs,
				activeRoundStartedAtMs: state.activeRoundStartedAtMs,
			};

			return {
				...baseNextRound,
				turnElapsedByRoundParticipant,
				roundElapsedByRound,
				lastRoundElapsedMs: roundElapsedMs,
				roundDurationHistory: [
					...state.roundDurationHistory,
					{
						round: endedRound,
						elapsedMs: roundElapsedMs,
					},
				],
				activeTurnParticipantId:
					state.initiativePhase === INITIATIVE_PHASE.Active
						? nextActiveParticipantId
						: undefined,
				activeTurnRound:
					state.initiativePhase === INITIATIVE_PHASE.Active
						? endedRound + 1
						: undefined,
				activeTurnStartedAtMs:
					state.initiativePhase === INITIATIVE_PHASE.Active &&
					typeof nextActiveParticipantId === 'string'
						? now
						: undefined,
				activeRoundStartedAtMs:
					state.initiativePhase === INITIATIVE_PHASE.Active ? now : undefined,
			};
		});

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
