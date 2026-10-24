import { Character } from './data';
import { TrackerParticipantMeta } from './encounterRuntimeStore';
import {
	arrivalActsBefore,
	effectiveInitiatives,
	roundOrderOf,
} from './initiativePlacement';
import { UUID } from '@/utils/uuid';

/**
 * A reinforcement whose initiative was set in the encounter preview. It waits,
 * invisible, at a spot in the round order until its slot is triggered, and is
 * then placed at that spot (TriggerReinforcementEventCommand).
 *
 * The spot is held by its neighbours: it sits directly before `below`, or,
 * when `below` is no longer in the order, directly after `above`. `below` is
 * null for a spot at the end of the round, `above` for one at its start.
 * Simple hazards take no turns, so theirs are both null and unused.
 */
export type PendingReinforcement = {
	slotId: string;
	character: Character;
	meta: TrackerParticipantMeta;
	above: UUID | null;
	below: UUID | null;
};

type Spot = Pick<PendingReinforcement, 'above' | 'below'>;

/**
 * The spots of reinforcements in a roster sorted by initiative: each one's
 * neighbours among the participants that start in the order. Reinforcements
 * next to each other share the same spot and keep their sorted order.
 */
export function spotsFromSortedRoster(
	sortedIds: UUID[],
	isReinforcement: (uuid: UUID) => boolean,
	isInStartingOrder: (uuid: UUID) => boolean
): Map<UUID, Spot> {
	const spots = new Map<UUID, Spot>();

	sortedIds.forEach((uuid, index) => {
		if (!isReinforcement(uuid)) return;

		const above = sortedIds.slice(0, index).findLast(isInStartingOrder) ?? null;
		const below = sortedIds.slice(index + 1).find(isInStartingOrder) ?? null;

		spots.set(uuid, { above, below });
	});

	return spots;
}

/**
 * Where a pending reinforcement goes in a round order: the index it is
 * inserted at. Before `below`; at the end when `below` is null; after
 * `above` when `below` has left the order (delaying, slain). When both have
 * left, by its initiative against the order, as an arrival without a preset
 * spot is placed.
 *
 * `placed` are arrivals already placed at the same time: one at the top or
 * after `above` goes after those, so arrivals sharing a spot keep their order.
 */
export function spotIndex(
	pending: PendingReinforcement,
	roundOrder: UUID[],
	charactersMap: Record<UUID, Character>,
	placed: Set<UUID> = new Set()
): number {
	if (pending.below === null) return roundOrder.length;

	const belowIndex = roundOrder.indexOf(pending.below);

	if (belowIndex !== -1) return belowIndex;

	const afterPlaced = (index: number) => {
		while (index < roundOrder.length && placed.has(roundOrder[index])) {
			index += 1;
		}

		return index;
	};

	if (pending.above === null) return afterPlaced(0);

	const aboveIndex = roundOrder.indexOf(pending.above);

	if (aboveIndex !== -1) return afterPlaced(aboveIndex + 1);

	const effective = effectiveInitiatives(roundOrder, charactersMap);
	const before = roundOrder.findIndex((uuid) =>
		arrivalActsBefore(
			pending.character,
			pending.meta,
			charactersMap[uuid],
			effective.get(uuid) ?? 0
		)
	);

	return before === -1 ? roundOrder.length : before;
}

/**
 * The participants a reorder moved: everyone outside the longest run that
 * kept its relative order. Used when the reorder doesn't say who was dragged.
 */
export function movedInReorder(oldOrder: UUID[], newOrder: UUID[]): Set<UUID> {
	// Longest common subsequence, O(n²): rosters are small.
	const lengths = oldOrder.map(() => newOrder.map(() => 0));
	const at = (i: number, j: number) =>
		i < oldOrder.length && j < newOrder.length ? lengths[i][j] : 0;

	for (let i = oldOrder.length - 1; i >= 0; i -= 1) {
		for (let j = newOrder.length - 1; j >= 0; j -= 1) {
			lengths[i][j] =
				oldOrder[i] === newOrder[j]
					? at(i + 1, j + 1) + 1
					: Math.max(at(i + 1, j), at(i, j + 1));
		}
	}

	const kept = new Set<UUID>();
	let i = 0;
	let j = 0;

	while (i < oldOrder.length && j < newOrder.length) {
		if (oldOrder[i] === newOrder[j]) {
			kept.add(oldOrder[i]);
			i += 1;
			j += 1;
		} else if (at(i + 1, j) >= at(i, j + 1)) {
			i += 1;
		} else {
			j += 1;
		}
	}

	return new Set(newOrder.filter((uuid) => !kept.has(uuid)));
}

/**
 * The spots of pending reinforcements after a reorder. A reinforcement sticks
 * to the participant below it, and moves with it, while others are reordered
 * around it. When that participant is the one being moved, it sticks to the
 * participant above instead and stays where it was. The reorder is a house
 * rule: the rules have no procedure for reinforcements.
 */
export function respotAfterReorder(
	pending: PendingReinforcement[],
	oldRoundOrder: UUID[],
	newRoundOrder: UUID[],
	moved: Set<UUID>,
	charactersMap: Record<UUID, Character>
): PendingReinforcement[] {
	return pending.map((reinforcement) => {
		if (reinforcement.meta.isSimpleHazard) return reinforcement;

		const index = spotIndex(reinforcement, oldRoundOrder, charactersMap);
		const below = oldRoundOrder[index] ?? null;
		const above = oldRoundOrder[index - 1] ?? null;

		if (below === null) {
			return { ...reinforcement, above: newRoundOrder.at(-1) ?? null, below };
		}

		const newBelowIndex = newRoundOrder.indexOf(below);

		if (!moved.has(below) && newBelowIndex !== -1) {
			return {
				...reinforcement,
				above: newRoundOrder[newBelowIndex - 1] ?? null,
				below,
			};
		}

		const newAboveIndex = above === null ? -1 : newRoundOrder.indexOf(above);

		return {
			...reinforcement,
			above: newAboveIndex === -1 ? null : above,
			below: newRoundOrder[newAboveIndex + 1] ?? null,
		};
	});
}

/**
 * Places triggered reinforcements at their spots. One whose spot comes after
 * the current turn acts this round; so does one whose spot is at the very
 * start of a round nobody has acted in yet, which makes it the current actor.
 * One whose spot has already passed waits for the next round (house rule).
 *
 * `arrivals` are in initiative order, so ones sharing a spot keep it.
 */
export function placePendingReinforcements(
	state: {
		charactersOrder: UUID[];
		charactersWithTurn: Set<UUID>;
		charactersMap: Record<UUID, Character>;
	},
	arrivals: PendingReinforcement[]
): {
	charactersOrder: UUID[];
	charactersWithTurn: Set<UUID>;
} {
	const charactersOrder = [...state.charactersOrder];
	const charactersWithTurn = new Set(state.charactersWithTurn);
	const placed = new Set<UUID>();
	// Arrivals placed earlier are compared by their own initiative when a
	// later one falls back to placing by initiative.
	const charactersMap = { ...state.charactersMap };

	for (const arrival of arrivals) {
		charactersMap[arrival.character.uuid] = arrival.character;
	}

	for (const arrival of arrivals) {
		if (arrival.meta.isSimpleHazard) continue;

		const uuid = arrival.character.uuid;
		const roundOrder = roundOrderOf(
			charactersOrder,
			charactersWithTurn,
			charactersMap
		);
		const acted = roundOrder.filter(
			(participant) => !charactersWithTurn.has(participant)
		).length;
		const index = spotIndex(arrival, roundOrder, charactersMap, placed);
		const keepsTurn = index > acted || (index === acted && acted === 0);

		if (keepsTurn) {
			charactersWithTurn.add(uuid);
		}

		// The order rotates: the participants still to act come first and the
		// ones that acted follow them, so the spot right before the current
		// actor is after the last one that acted.
		const insertAfterLastActed = !keepsTurn && index === acted;
		const insertionIndex =
			roundOrder.length === 0
				? charactersOrder.length
				: insertAfterLastActed || index === roundOrder.length
					? charactersOrder.indexOf(roundOrder[index - 1]) + 1
					: charactersOrder.indexOf(roundOrder[index]);

		charactersOrder.splice(insertionIndex, 0, uuid);
		placed.add(uuid);
	}

	return { charactersOrder, charactersWithTurn };
}

/**
 * The order with each pending reinforcement at the spot it would take if its
 * slot triggered now, for showing where the arrivals will come in.
 */
export function orderWithPendingSpots(
	state: Parameters<typeof placePendingReinforcements>[0],
	pending: PendingReinforcement[]
): UUID[] {
	return placePendingReinforcements(state, pending).charactersOrder;
}
