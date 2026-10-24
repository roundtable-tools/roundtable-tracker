import { UUID } from '@/utils/uuid';
import { nextRound } from '@/store/operations';
import {
	isHazardDisabled,
	TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import {
	Command,
	CommandDeps,
	getDeps,
	STATUS,
	undoOriginalState,
} from '../common';

type CommandProps = {
	uuid: UUID;
} & (
	| {
			/** Successes to add: 1 for a success, 2 for a critical success. */
			delta: number;
	  }
	| {
			/** Manual correction: the new success count. */
			value: number;
	  }
);

type CommandData = CommandProps & {
	original?: {
		trackerMetaMap: Record<UUID, TrackerParticipantMeta>;
		charactersOrder: UUID[];
		charactersWithTurn: Set<UUID>;
		round: number;
	};
};

/**
 * Changes how many Disable a Device successes a hazard has. The count is
 * clamped to 0…disableChecksRequired.
 *
 * Proposed house rule (#95): a disabled complex hazard stops taking turns. It
 * leaves the turn order and is listed with the hazards instead. If it was the
 * last participant with a turn this round, the round advances. A correction
 * below the required count puts it back at the end of the queue (directly
 * before the current actor), without a turn this round.
 */
export class RecordHazardDisableProgressCommand implements Command {
	readonly type = 'RecordHazardDisableProgressCommand';
	description = 'Record Hazard Disable Progress';
	data: CommandData;

	constructor(
		props: CommandData,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const meta = state.trackerMetaMap[this.data.uuid];

		if (
			!meta ||
			meta.role !== 'hazard' ||
			meta.disableChecksRequired <= 0 ||
			!(this.data.uuid in state.charactersMap)
		) {
			console.error(
				`Hazard with uuid ${this.data.uuid} not found or has no disable count`
			);

			return STATUS.failure;
		}

		const requested =
			'value' in this.data
				? this.data.value
				: meta.disableChecksSucceeded + this.data.delta;

		if (!Number.isFinite(requested)) {
			console.error(`Invalid disable success count: ${requested}`);

			return STATUS.failure;
		}

		const nextMeta: TrackerParticipantMeta = {
			...meta,
			disableChecksSucceeded: Math.min(
				Math.max(Math.trunc(requested), 0),
				meta.disableChecksRequired
			),
		};

		this.data.original = {
			trackerMetaMap: structuredClone(state.trackerMetaMap),
			charactersOrder: structuredClone(state.charactersOrder),
			charactersWithTurn: structuredClone(state.charactersWithTurn),
			round: state.round,
		};

		encounterStore.setState((current) => {
			const trackerMetaMap = {
				...current.trackerMetaMap,
				[this.data.uuid]: nextMeta,
			};

			if (meta.isSimpleHazard) {
				return { trackerMetaMap };
			}

			const wasDisabled = isHazardDisabled(meta);
			const isDisabled = isHazardDisabled(nextMeta);

			if (isDisabled && !wasDisabled) {
				const charactersOrder = current.charactersOrder.filter(
					(uuid) => uuid !== this.data.uuid
				);
				const charactersWithTurn = new Set(current.charactersWithTurn);
				charactersWithTurn.delete(this.data.uuid);

				const anyTurnLeft = charactersOrder.some((uuid) =>
					charactersWithTurn.has(uuid)
				);

				if (!anyTurnLeft && charactersOrder.length > 0) {
					return {
						trackerMetaMap,
						charactersOrder,
						...nextRound({
							round: current.round,
							charactersOrder,
							charactersWithTurn,
						}),
					};
				}

				return {
					trackerMetaMap,
					charactersOrder,
					charactersWithTurn,
				};
			}

			if (wasDisabled && !isDisabled) {
				return {
					trackerMetaMap,
					charactersOrder: current.charactersOrder
						.filter((uuid) => uuid !== this.data.uuid)
						.concat(this.data.uuid),
				};
			}

			return { trackerMetaMap };
		});

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
