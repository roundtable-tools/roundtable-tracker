import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '@/CommandHistory/common';
import { EncounterStore } from '@/store/encounterRuntimeStore';
import { freezeElapsed } from '@/store/timers';
import { INITIATIVE_PHASE } from '@/store/encounterRuntimeStore';

type CommandProps = {
	newOrder: UUID[];
	oldOrder?: UUID[];
	originalTiming?: {
		turnElapsedByRoundParticipant: Record<string, number>;
		roundElapsedByRound: Record<number, number>;
		activeTurnParticipantId?: UUID;
		activeTurnRound?: number;
		activeTurnStartedAtMs?: number;
		activeRoundStartedAtMs?: number;
	};
	type?: 'initiative' | 'delay';
};

export class ReorderCharactersCommand implements Command {
	readonly type = 'ReorderCharactersCommand';
	description = 'Reorder Characters Command';
	data: CommandProps;
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
		this.description = `Reorder ${getOrderName(this.data)} order`;
	}

	execute() {
		getDeps(this.deps).encounterStore.setState((state) => {
			const { now, turnElapsedByRoundParticipant, roundElapsedByRound } =
				freezeElapsed(state);
			this.data.oldOrder = structuredClone(getOrder(this.data, state));
			this.data.originalTiming = {
				turnElapsedByRoundParticipant: structuredClone(
					state.turnElapsedByRoundParticipant
				),
				roundElapsedByRound: structuredClone(state.roundElapsedByRound),
				activeTurnParticipantId: state.activeTurnParticipantId,
				activeTurnRound: state.activeTurnRound,
				activeTurnStartedAtMs: state.activeTurnStartedAtMs,
				activeRoundStartedAtMs: state.activeRoundStartedAtMs,
			};

			const orderName = getOrderName(this.data);
			const nextState: Record<string, unknown> = {
				[orderName]: structuredClone(this.data.newOrder),
			};

			if (orderName === 'charactersOrder') {
				const nextActiveParticipantId = this.data.newOrder[0];

				nextState.turnElapsedByRoundParticipant = turnElapsedByRoundParticipant;
				nextState.roundElapsedByRound = roundElapsedByRound;
				nextState.activeTurnParticipantId =
					state.initiativePhase === INITIATIVE_PHASE.Active
						? nextActiveParticipantId
						: undefined;
				nextState.activeTurnRound =
					state.initiativePhase === INITIATIVE_PHASE.Active ? state.round : undefined;
				nextState.activeTurnStartedAtMs =
					state.initiativePhase === INITIATIVE_PHASE.Active &&
					typeof nextActiveParticipantId === 'string'
						? now
						: undefined;
				nextState.activeRoundStartedAtMs =
					state.initiativePhase === INITIATIVE_PHASE.Active ? now : undefined;
			}

			return nextState;
		});

		return STATUS.success;
	}
	undo() {
		const orderToRestore = this.data.oldOrder;

		if (!orderToRestore) {
			console.error(`Old Order is not defined`);

			return STATUS.failure;
		}

		getDeps(this.deps).encounterStore.setState(() => ({
			[getOrderName(this.data)]: structuredClone(orderToRestore),
			...(this.data.originalTiming ?? {}),
		}));

		return STATUS.success;
	}
}

const getOrderName = (props: CommandProps) => {
	const type = props.type || 'initiative';

	if (type === 'initiative') {
		return 'charactersOrder';
	} else {
		return 'delayedOrder';
	}
};

const getOrder = (props: CommandProps, state: EncounterStore) => {
	const orderName = getOrderName(props);

	return state[orderName];
};
