import {
	INITIATIVE_PHASE,
	type InitiativePhase,
} from '@/store/encounterRuntimeStore';
import { Command, CommandDeps, STATUS, getDeps } from '@/CommandHistory/common';
import { getNowMs } from '@/store/timers';

type CommandData = {
	original?: {
		initiativePhase: InitiativePhase;
		activeTurnParticipantId?: string;
		activeTurnRound?: number;
		activeTurnStartedAtMs?: number;
		activeRoundStartedAtMs?: number;
	};
};

export class StartInitiativeCommand implements Command {
	readonly type = 'StartInitiativeCommand';
	description = 'Start Initiative Command';
	data: CommandData;

	constructor(
		data: CommandData = {},
		private deps?: CommandDeps
	) {
		this.data = data;
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		if (state.initiativePhase === INITIATIVE_PHASE.Active) {
			return STATUS.success;
		}

		this.data.original = {
			initiativePhase: state.initiativePhase,
			activeTurnParticipantId: state.activeTurnParticipantId,
			activeTurnRound: state.activeTurnRound,
			activeTurnStartedAtMs: state.activeTurnStartedAtMs,
			activeRoundStartedAtMs: state.activeRoundStartedAtMs,
		};

		const now = getNowMs();
		const activeTurnParticipantId = state.charactersOrder[0];

		encounterStore.setState(() => ({
			initiativePhase: INITIATIVE_PHASE.Active,
			activeTurnParticipantId,
			activeTurnRound: state.round,
			activeTurnStartedAtMs:
				typeof activeTurnParticipantId === 'string' ? now : undefined,
			activeRoundStartedAtMs: now,
		}));

		return STATUS.success;
	}

	undo() {
		if (!this.data.original) {
			return STATUS.failure;
		}

		const { encounterStore } = getDeps(this.deps);

		encounterStore.setState(() => ({
			initiativePhase: this.data.original?.initiativePhase,
			activeTurnParticipantId: this.data.original?.activeTurnParticipantId,
			activeTurnRound: this.data.original?.activeTurnRound,
			activeTurnStartedAtMs: this.data.original?.activeTurnStartedAtMs,
			activeRoundStartedAtMs: this.data.original?.activeRoundStartedAtMs,
		}));

		return STATUS.success;
	}
}
