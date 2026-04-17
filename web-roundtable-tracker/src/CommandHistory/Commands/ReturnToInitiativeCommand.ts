import { UUID } from '@/utils/uuid';
import { Command, CommandDeps, STATUS, getDeps } from '../common';
import { FinalizeTurnAction } from './FinalizeTurnAndAdvanceRoundCommand';

type CommandData = {
	activeUuid: UUID;
	returningUuid: UUID;
	action: FinalizeTurnAction;
	original?: {
		charactersOrder: UUID[];
		charactersWithTurn: Set<UUID>;
		delayedOrder: UUID[];
		charactersMap: Record<UUID, { turnState: string }>;
	};
};

/**
 * Ends the active participant's turn (with the given action) and simultaneously
 * returns a delayed participant to the initiative queue at the front.
 *
 * Corner case: when the active participant is the last one with a turn this round,
 * the returning participant re-enters as the new final participant of the current
 * round instead of triggering a round advance.
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

		if (!state.delayedOrder.includes(this.data.returningUuid)) {
			console.error(
				`ReturnToInitiativeCommand: returning character ${this.data.returningUuid} is not in delayedOrder`
			);

			return STATUS.failure;
		}

		// Capture pre-state for undo
		this.data.original = {
			charactersOrder: structuredClone(state.charactersOrder),
			charactersWithTurn: new Set(state.charactersWithTurn),
			delayedOrder: structuredClone(state.delayedOrder),
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

			// Remove returning participant from delayedOrder
			const newDelayedOrder = state.delayedOrder.filter(
				(id) => id !== this.data.returningUuid
			);

			let newCharactersOrder: UUID[];

			if (this.data.action === 'delay') {
				// Active participant moves to delayed, not to end of charactersOrder
				newCharactersOrder = state.charactersOrder.filter(
					(id) => id !== this.data.activeUuid
				);
				newDelayedOrder.push(this.data.activeUuid);
			} else {
				// end-turn or ko: active stays in order but moves to the end
				newCharactersOrder = state.charactersOrder
					.filter((id) => id !== this.data.activeUuid)
					.concat(this.data.activeUuid);
			}

			// Insert the returning participant at the front of the initiative queue
			newCharactersOrder = [
				this.data.returningUuid,
				...newCharactersOrder.filter((id) => id !== this.data.returningUuid),
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
				delayedOrder: newDelayedOrder,
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
					restoredMap[id] = { ...restoredMap[id], turnState: partial.turnState as never };
				}
			}

			return {
				charactersOrder: structuredClone(original.charactersOrder),
				charactersWithTurn: new Set(original.charactersWithTurn),
				delayedOrder: structuredClone(original.delayedOrder),
				charactersMap: restoredMap,
			};
		});

		return STATUS.success;
	}
}
