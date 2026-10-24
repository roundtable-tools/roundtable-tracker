import { UUID } from '@/utils/uuid';
import { TrackerParticipantMeta } from '@/store/encounterRuntimeStore';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

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
	originalMeta?: TrackerParticipantMeta;
};

/**
 * Changes how many disable check successes (Disable a Device) a hazard or a
 * creature has. The count is clamped to 0…disableChecksRequired.
 *
 * It never changes the participant's state: when the checks become full, or
 * stop being full for a participant that is out, the tracker decides what
 * happens and runs that as a separate command.
 */
export class RecordDisableProgressCommand implements Command {
	readonly type = 'RecordDisableProgressCommand';
	description = 'Record Disable Progress';
	data: CommandData;

	constructor(
		{ originalMeta, ...props }: CommandData,
		private deps?: CommandDeps
	) {
		this.data = {
			...structuredClone(props),
			originalMeta: structuredClone(originalMeta),
		};
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const meta = state.trackerMetaMap[this.data.uuid];

		if (
			!meta ||
			meta.disableChecksRequired <= 0 ||
			!(this.data.uuid in state.charactersMap)
		) {
			console.error(
				`Participant with uuid ${this.data.uuid} not found or has no disable count`
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

		this.data.originalMeta = structuredClone(meta);
		this.setMeta(nextMeta);

		return STATUS.success;
	}

	undo() {
		const { originalMeta } = this.data;

		if (!originalMeta) {
			console.error(`Original state is not defined`);

			return STATUS.failure;
		}

		this.setMeta(structuredClone(originalMeta));

		return STATUS.success;
	}

	private setMeta(meta: TrackerParticipantMeta) {
		getDeps(this.deps).encounterStore.setState((current) => ({
			trackerMetaMap: { ...current.trackerMetaMap, [this.data.uuid]: meta },
		}));
	}
}
