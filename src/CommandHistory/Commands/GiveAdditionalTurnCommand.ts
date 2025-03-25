import { UUID } from '@/utils/uuid';
import {
    Command,
    CommandDeps,
    getDeps,
    STATUS,
    undoOriginalState,
} from '../common';

type CommandProps = {
    uuid: UUID;
};

type CommandData = CommandProps & {
    original?: {
        charactersWithTurn: Set<UUID>;
    };
};

export class GiveAdditionalTurnCommand implements Command {
    readonly type = 'GiveAdditionalTurnCommand';
    data: CommandData;
    description = 'Give Additional Turn Command';
    constructor(
        props: CommandProps,
        private deps?: CommandDeps
    ) {
        this.data = structuredClone(props);
    }

    execute() {
        const { encounterStore } = getDeps(this.deps);
        const state = encounterStore.getState();

        if (state.charactersWithTurn.has(this.data.uuid)) {
            console.error(
                `Character with uuid ${this.data.uuid} still has a turn in this round`
            );

            return STATUS.failure;
        }

        this.data.original = {
            charactersWithTurn: structuredClone(state.charactersWithTurn),
        };

        encounterStore.setState((state) => {
            state.charactersWithTurn.add(this.data.uuid);
            
            return {
                charactersWithTurn: new Set(state.charactersWithTurn),
            };
        });

        return STATUS.success;
    }

    undo() {
        return undoOriginalState(this.data.original, this.deps);
    }
}
