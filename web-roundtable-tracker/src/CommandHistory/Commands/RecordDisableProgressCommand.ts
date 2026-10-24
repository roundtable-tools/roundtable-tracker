import { UUID } from '@/utils/uuid';
import {
	hasFullDisableChecks,
	TrackerParticipantMeta,
} from '@/store/encounterRuntimeStore';
import { Command, CommandDeps, getDeps, STATUS } from '../common';
import { ReactivateCharacterCommand } from './ReactivateCharacterCommand';

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
	/** Brings the participant back when a correction empties full checks. */
	reactivate?: Command;
};

/**
 * Changes how many disable check successes (Disable a Device) a hazard or a
 * creature has. The count is clamped to 0…disableChecksRequired.
 *
 * Filling the checks doesn't change the participant's state: the tracker asks
 * the GM whether it is disabled (knocked out) or destroyed (slain), and runs
 * that as a separate command. A correction below the required count brings a
 * disabled or knocked-out participant back, like Reactivate.
 */
export class RecordDisableProgressCommand implements Command {
	readonly type = 'RecordDisableProgressCommand';
	description = 'Record Disable Progress';
	data: CommandData;

	constructor(
		{ originalMeta, reactivate, ...props }: CommandData,
		private deps?: CommandDeps
	) {
		this.data = {
			...structuredClone(props),
			originalMeta: structuredClone(originalMeta),
			reactivate,
		};
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const meta = state.trackerMetaMap[this.data.uuid];
		const character = state.charactersMap[this.data.uuid];

		if (!meta || meta.disableChecksRequired <= 0 || !character) {
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

		const isReEnabled =
			hasFullDisableChecks(meta) &&
			!hasFullDisableChecks(nextMeta) &&
			character.turnState === 'knocked-out';

		if (!isReEnabled) {
			this.data.reactivate = undefined;

			return STATUS.success;
		}

		this.data.reactivate ??= new ReactivateCharacterCommand(
			{ uuid: this.data.uuid },
			this.deps
		);

		if (this.data.reactivate.execute() !== STATUS.success) {
			this.setMeta(meta);

			return STATUS.failure;
		}

		return STATUS.success;
	}

	undo() {
		const { originalMeta, reactivate } = this.data;

		if (!originalMeta) {
			console.error(`Original state is not defined`);

			return STATUS.failure;
		}

		if (reactivate && reactivate.undo() !== STATUS.success) {
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
