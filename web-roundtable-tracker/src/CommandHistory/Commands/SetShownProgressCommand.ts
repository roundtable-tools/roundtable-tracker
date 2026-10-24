import { UUID } from '@/utils/uuid';
import { TrackerParticipantMeta } from '@/store/encounterRuntimeStore';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type ShownProgress = NonNullable<TrackerParticipantMeta['shownProgress']>;

type CommandProps = {
	uuid: UUID;
	shownProgress: ShownProgress;
};

type CommandData = CommandProps & {
	oldShownProgress?: ShownProgress | null;
};

/**
 * Picks whether the tracker and the player view show a participant's HP or
 * its disable progress, for a participant that has both.
 */
export class SetShownProgressCommand implements Command {
	readonly type = 'SetShownProgressCommand';
	data: CommandData;
	description = 'Set Shown Progress';

	constructor(
		props: CommandData,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const meta = encounterStore.getState().trackerMetaMap[this.data.uuid];

		if (!meta) {
			console.error(`Participant with uuid ${this.data.uuid} not found`);

			return STATUS.failure;
		}

		this.data.oldShownProgress = meta.shownProgress ?? null;
		this.setShownProgress(this.data.shownProgress);

		return STATUS.success;
	}

	undo() {
		if (this.data.oldShownProgress === undefined) {
			console.error(`Original state is not defined`);

			return STATUS.failure;
		}

		this.setShownProgress(this.data.oldShownProgress ?? undefined);

		return STATUS.success;
	}

	private setShownProgress(shownProgress: ShownProgress | undefined) {
		getDeps(this.deps).encounterStore.setState((current) => ({
			trackerMetaMap: {
				...current.trackerMetaMap,
				[this.data.uuid]: {
					...current.trackerMetaMap[this.data.uuid],
					shownProgress,
				},
			},
		}));
	}
}
