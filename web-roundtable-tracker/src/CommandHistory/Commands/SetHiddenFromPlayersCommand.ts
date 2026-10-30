import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
	hidden: boolean;
};

type CommandData = CommandProps & {
	oldHidden?: boolean;
};

/**
 * Hides a participant from the player view or reveals it (the tracker's
 * Hide / Reveal, and the reveal when a hidden participant's turn starts).
 * A hidden participant stays hidden until its next turn starts.
 */
export class SetHiddenFromPlayersCommand implements Command {
	readonly type = 'SetHiddenFromPlayersCommand';
	data: CommandData;
	description: string;

	constructor(
		props: CommandData,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
		this.description = props.hidden ? 'Hide From Players' : 'Reveal To Players';
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const meta = encounterStore.getState().trackerMetaMap[this.data.uuid];

		if (!meta) {
			console.error(`Participant with uuid ${this.data.uuid} not found`);

			return STATUS.failure;
		}

		this.data.oldHidden = meta.hiddenUntilFirstTurn === true;
		this.setHidden(this.data.hidden);

		return STATUS.success;
	}

	undo() {
		if (this.data.oldHidden === undefined) {
			console.error(`Original state is not defined`);

			return STATUS.failure;
		}

		this.setHidden(this.data.oldHidden);

		return STATUS.success;
	}

	private setHidden(hidden: boolean) {
		getDeps(this.deps).encounterStore.setState((current) => ({
			trackerMetaMap: {
				...current.trackerMetaMap,
				[this.data.uuid]: {
					...current.trackerMetaMap[this.data.uuid],
					hiddenUntilFirstTurn: hidden,
				},
			},
		}));
	}
}
