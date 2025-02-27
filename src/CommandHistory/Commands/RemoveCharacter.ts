import { UUID } from '@/utils/uuid';
import { Character } from '@/store/data';
import { Command, CommandDeps, getDeps, STATUS } from '../common';

type CommandProps = {
	uuid: UUID;
};

type CommandData = CommandProps & {
	removedCharacter?: Character;
	originalOrder?: UUID[];
	originalCharactersWithTurn?: Set<UUID>;
};

export class RemoveCharacterCommand implements Command {
	readonly type = 'RemoveCharacterCommand';
	data: CommandData;
	description = 'Remove Character Command';
	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		if (!(this.data.uuid in state.charactersMap)) {
			console.error(`Character with uuid ${this.data.uuid} not found`);
			return STATUS.failure;
		}

		this.data.originalOrder = structuredClone(state.charactersOrder);
		this.data.originalCharactersWithTurn = new Set(state.charactersWithTurn);

		encounterStore.setState((state) => {
			const { [this.data.uuid]: removed, ...charactersMap } =
				state.charactersMap;

			this.data.removedCharacter = structuredClone(removed);

			const charactersOrder = state.charactersOrder.filter(
				(uuid) => uuid !== this.data.uuid
			);

			const charactersWithTurn = new Set(state.charactersWithTurn);
			charactersWithTurn.delete(this.data.uuid);

			return { charactersMap, charactersOrder, charactersWithTurn };
		});

		return STATUS.success;
	}

	undo() {
		const { removedCharacter, originalOrder } = this.data;

		if (!removedCharacter) {
			console.error(`Character is not defined`);
			return STATUS.failure;
		}

		if (!originalOrder) {
			console.error(`Original order is not defined`);
			return STATUS.failure;
		}

		const { encounterStore } = getDeps(this.deps);

		encounterStore.setState((state) => {
			state.charactersMap[removedCharacter.uuid] = removedCharacter;

			return {
				charactersMap: { ...state.charactersMap },
				charactersOrder: structuredClone(originalOrder),
				charactersWithTurn: new Set(this.data.originalCharactersWithTurn),
			};
		});

		return STATUS.success;
	}
}
