import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, STATUS, getDeps } from '../common';
import { FinalizeTurnAction } from './FinalizeTurnAndAdvanceRoundCommand';
import { isDelaying, type TurnStates } from '@/store/operations';

type CommandData = {
	activeUuid: UUID;
	returningUuid: UUID;
	action: FinalizeTurnAction;
	original?: {
		charactersOrder: UUID[];
		charactersWithTurn: Set<UUID>;
		charactersMap: TurnStates;
	};
};

/**
 * Ends the active participant's turn (with the given action) and returns a
 * delaying participant to the front of the queue, with a turn this round.
 *
 * Used for a delayer the GM picks in the return prompt, and for one whose old
 * spot comes up mid-round (`delayerReturningAfterTurn`). After the round's
 * last turn, a picked delayer becomes the last turn of the current round; the
 * round advances when its turn ends. A delayer nobody picked whose spot comes
 * up after the last turn goes through `FinalizeTurnAndReturnToInitiativeCommand`
 * instead, which also advances the round.
 */
export class ReturnToInitiativeCommand implements Command {
	readonly type = 'ReturnToInitiativeCommand';
	description = 'Return to Initiative Command';
	data: CommandData;

	constructor(
		data: Pick<CommandData, 'activeUuid' | 'returningUuid' | 'action'>,
		private deps?: CommandDeps
	) {
		this.data = { ...data };
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();

		if (!state.charactersWithTurn.has(this.data.activeUuid)) {
			console.error(
				`ReturnToInitiativeCommand: active character ${this.data.activeUuid} does not have a turn`
			);

			return STATUS.failure;
		}

		if (!isDelaying(state.charactersMap, this.data.returningUuid)) {
			console.error(
				`ReturnToInitiativeCommand: returning character ${this.data.returningUuid} is not delaying`
			);

			return STATUS.failure;
		}

		// Capture pre-state for undo
		this.data.original = {
			charactersOrder: structuredClone(state.charactersOrder),
			charactersWithTurn: new Set(state.charactersWithTurn),
			charactersMap: Object.fromEntries(
				Object.entries(state.charactersMap).map(([id, char]) => [
					id,
					{ turnState: char.turnState },
				])
			),
		};

		encounterStore.setState((state) => {
			const newCharactersWithTurn = new Set(state.charactersWithTurn);
			// Active participant loses their turn
			newCharactersWithTurn.delete(this.data.activeUuid);
			// Returning participant gains a turn in the current round
			newCharactersWithTurn.add(this.data.returningUuid);

			// The returning participant goes to the front of the queue. The active
			// participant stays in the order but moves to the end, whether it ends
			// its turn, delays or is knocked out.
			const newCharactersOrder = [
				this.data.returningUuid,
				...state.charactersOrder.filter(
					(id) => id !== this.data.activeUuid && id !== this.data.returningUuid
				),
				this.data.activeUuid,
			];

			// Update turnState in charactersMap
			const newCharactersMap = { ...state.charactersMap };

			if (this.data.action === 'delay') {
				newCharactersMap[this.data.activeUuid] = {
					...newCharactersMap[this.data.activeUuid],
					turnState: 'delayed',
				};
			} else if (this.data.action === 'ko') {
				newCharactersMap[this.data.activeUuid] = {
					...newCharactersMap[this.data.activeUuid],
					turnState: 'knocked-out',
				};
			}

			newCharactersMap[this.data.returningUuid] = {
				...newCharactersMap[this.data.returningUuid],
				turnState: 'normal',
			};

			return {
				charactersOrder: newCharactersOrder,
				charactersWithTurn: newCharactersWithTurn,
				charactersMap: newCharactersMap,
			};
		});

		return STATUS.success;
	}

	undo() {
		if (!this.data.original) {
			console.error('ReturnToInitiativeCommand: no original state to restore');

			return STATUS.failure;
		}

		const { encounterStore } = getDeps(this.deps);
		const { original } = this.data;

		encounterStore.setState((state) => {
			const restoredMap = { ...state.charactersMap };

			for (const [id, partial] of Object.entries(original.charactersMap)) {
				if (restoredMap[id]) {
					restoredMap[id] = {
						...restoredMap[id],
						turnState: partial.turnState,
					};
				}
			}

			return {
				charactersOrder: structuredClone(original.charactersOrder),
				charactersWithTurn: new Set(original.charactersWithTurn),
				charactersMap: restoredMap,
			};
		});

		return STATUS.success;
	}
}
