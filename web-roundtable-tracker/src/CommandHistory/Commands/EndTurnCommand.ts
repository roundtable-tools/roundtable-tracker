import { UUID } from '@/utils/uuid';
import {
	Command,
	CommandDeps,
	getDeps,
	STATUS,
	undoOriginalState,
} from '../common';
import {
	freezeElapsed,
	getOwnerLabelAndKey,
	getTurnDurationKey,
} from '@/store/timers';
import { INITIATIVE_PHASE } from '@/store/encounterRuntimeStore';

type CommandProps = {
	uuid: UUID;
};

type CommandData = CommandProps & {
	original?: {
		charactersOrder: UUID[];
		charactersWithTurn: Set<UUID>;
		turnElapsedByRoundParticipant: Record<string, number>;
		roundElapsedByRound: Record<number, number>;
		lastTurnElapsedMs: number;
		turnDurationHistory: Array<{
			id: string;
			round: number;
			participantId: UUID;
			participantName: string;
			ownerKey: string;
			ownerLabel: string;
			elapsedMs: number;
		}>;
		activeTurnParticipantId?: UUID;
		activeTurnRound?: number;
		activeTurnStartedAtMs?: number;
		activeRoundStartedAtMs?: number;
	};
};

export class EndTurnCommand implements Command {
	readonly type = 'EndTurnCommand';
	data: CommandData;
	description = 'End Turn Command';
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		if (!state.charactersWithTurn.has(this.data.uuid)) {
			console.error(
				`Character with uuid ${this.data.uuid} does not have a turn`
			);

			return STATUS.failure;
		}

		this.data.original = {
			charactersOrder: structuredClone(state.charactersOrder),
			charactersWithTurn: structuredClone(state.charactersWithTurn),
			turnElapsedByRoundParticipant: structuredClone(
				state.turnElapsedByRoundParticipant
			),
			roundElapsedByRound: structuredClone(state.roundElapsedByRound),
			lastTurnElapsedMs: state.lastTurnElapsedMs,
			turnDurationHistory: structuredClone(state.turnDurationHistory),
			activeTurnParticipantId: state.activeTurnParticipantId,
			activeTurnRound: state.activeTurnRound,
			activeTurnStartedAtMs: state.activeTurnStartedAtMs,
			activeRoundStartedAtMs: state.activeRoundStartedAtMs,
		};

		encounterStore.setState((state) => {
			const { now, turnElapsedByRoundParticipant, roundElapsedByRound } =
				freezeElapsed(state);
			const endedRound = state.activeTurnRound ?? state.round;
			const turnKey = getTurnDurationKey(endedRound, this.data.uuid);
			const elapsedMs = turnElapsedByRoundParticipant[turnKey] ?? 0;
			const { ownerKey, ownerLabel, participantName } = getOwnerLabelAndKey(
				state,
				this.data.uuid
			);

			state.charactersWithTurn.delete(this.data.uuid);
			const charactersOrder = state.charactersOrder
				.filter((id) => id !== this.data.uuid)
				.concat(this.data.uuid);
			const nextActiveParticipantId = charactersOrder[0];
			const turnDurationHistoryEntryId = `${endedRound}:${this.data.uuid}:${state.turnDurationHistory.length}`;

			return {
				charactersWithTurn: new Set(state.charactersWithTurn),
				charactersOrder,
				turnElapsedByRoundParticipant,
				roundElapsedByRound,
				lastTurnElapsedMs: elapsedMs,
				turnDurationHistory: [
					...state.turnDurationHistory,
					{
						id: turnDurationHistoryEntryId,
						round: endedRound,
						participantId: this.data.uuid,
						participantName,
						ownerKey,
						ownerLabel,
						elapsedMs,
					},
				],
				activeTurnParticipantId:
					state.initiativePhase === INITIATIVE_PHASE.Active
						? nextActiveParticipantId
						: undefined,
				activeTurnRound:
					state.initiativePhase === INITIATIVE_PHASE.Active
						? state.round
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
