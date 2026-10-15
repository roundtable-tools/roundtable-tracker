import {
	ALIGNMENT,
	Character,
	NarrativeSlot,
	normalizeLevel,
} from '@/store/data';
import { TrackerParticipantMeta } from '@/store/encounterRuntimeStore';
import { generateUUID, UUID } from '@/utils/uuid';
import { uniqueNames } from '@/utils/uniqueNames';
import {
	Command,
	CommandDeps,
	getDeps,
	STATUS,
	undoOriginalState,
} from '../common';

type CommandProps = {
	slotId: string;
};

type SpawnedParticipant = {
	character: Character;
	meta: TrackerParticipantMeta;
};

type ReinforcementSlotParticipant = NonNullable<
	NarrativeSlot['participants']
>[number];

type CommandData = CommandProps & {
	spawnedParticipants?: SpawnedParticipant[];
	original?: {
		charactersMap: Record<UUID, Character>;
		charactersOrder: UUID[];
		delayedOrder: UUID[];
		charactersWithTurn: Set<UUID>;
		trackerMetaMap: Record<UUID, TrackerParticipantMeta>;
	};
};

const sideThemeFromAlignment = (
	side: (typeof ALIGNMENT)[keyof typeof ALIGNMENT]
): TrackerParticipantMeta['sideTheme'] => {
	if (side === ALIGNMENT.PCs) {
		return 'pc';
	}

	if (side === ALIGNMENT.Neutral) {
		return 'other';
	}

	return 'opponent';
};

const normalizeParticipantLevel = (
	slotParticipant: ReinforcementSlotParticipant,
	partyLevel: number
): number => {
	if (typeof slotParticipant.level === 'number') {
		return slotParticipant.level;
	}

	return normalizeLevel(partyLevel, slotParticipant.level);
};

// Arrivals roll when they arrive: d20 + initiative bonus, unless the slot
// fixes the initiative. The result is stored in the command data, so redo and
// reload replay it instead of rolling again.
const rollParticipantInitiative = (
	slotParticipant: ReinforcementSlotParticipant
): number => {
	const initiative = (slotParticipant as { initiative?: unknown }).initiative;

	if (typeof initiative === 'number' && Number.isFinite(initiative)) {
		return initiative;
	}

	const initiativeBonus =
		typeof slotParticipant.initiativeBonus === 'number' &&
		Number.isFinite(slotParticipant.initiativeBonus)
			? slotParticipant.initiativeBonus
			: 0;

	return Math.floor(Math.random() * 20) + 1 + initiativeBonus;
};

const expandSlotParticipants = (
	slot: NarrativeSlot,
	partyLevel: number,
	takenNames: string[]
): SpawnedParticipant[] => {
	if (!slot.participants || slot.participants.length === 0) {
		return [];
	}

	const spawned = slot.participants.flatMap((slotParticipant) => {
		const count = Math.max(1, slotParticipant.count ?? 1);
		const level = normalizeParticipantLevel(slotParticipant, partyLevel);
		const maxHealth = slotParticipant.maxHealth ?? Math.max(1, level * 5);
		const sideTheme = sideThemeFromAlignment(slotParticipant.side);

		return Array.from({ length: count }).map(() => {
			const uuid = generateUUID();
			const initiative = rollParticipantInitiative(slotParticipant);
			const baseName = slotParticipant.name.trim() || 'Reinforcement';
			const notes =
				slot.description?.trim() || slotParticipant.description?.trim() || '';

			const character: Character = {
				uuid,
				name: baseName,
				initiative,
				turnState: slotParticipant.startingState ?? 'normal',
				health: slotParticipant.health ?? maxHealth,
				maxHealth,
				tempHealth: slotParticipant.tempHealth ?? 0,
				group: slotParticipant.side === ALIGNMENT.PCs ? 'players' : 'enemies',
				level,
			};

			const meta: TrackerParticipantMeta = {
				role: slotParticipant.type === 'hazard' ? 'hazard' : 'reinforcement',
				sideTheme,
				isSimpleHazard:
					slotParticipant.type === 'hazard'
						? !slotParticipant.isComplexHazard
						: false,
				disableChecksRequired:
					slotParticipant.type === 'hazard'
						? (slotParticipant.successesToDisable ?? 0)
						: 0,
				disableChecksSucceeded: 0,
				notes,
				hardness: slotParticipant.hardness,
				initiativeBonus: slotParticipant.initiativeBonus,
				dcs: slotParticipant.dcs,
				adjustmentDescription: slotParticipant.adjustmentDescription,
				adjustmentLevelModifier: slotParticipant.adjustmentLevelModifier,
				reinforcementSlotId: slot.id,
			};

			return {
				character,
				meta,
			};
		});
	});
	const names = uniqueNames(
		spawned.map(({ character }) => character.name),
		takenNames
	);

	return spawned.map((participant, index) => ({
		...participant,
		character: { ...participant.character, name: names[index] },
	}));
};

/**
 * Initiative values that follow the current order. A reorder or a return from
 * Delay changes positions but not the stored numbers, so the stored numbers
 * can contradict the order. The longest run of participants whose stored
 * numbers still fall in order keep them; everyone else takes the value of the
 * nearest such participant above them (below, if there is none above). When
 * a change reads two ways (two neighbours swapped: one moved up, or the other
 * moved down), the participant now higher keeps its number.
 *
 * `roundOrder` is the order of one round, from its first turn to its last.
 */
export function effectiveInitiatives(
	roundOrder: UUID[],
	charactersMap: Record<UUID, Character>
): Map<UUID, number> {
	const stored = roundOrder.map((uuid) => charactersMap[uuid]?.initiative ?? 0);
	// Longest non-increasing subsequence, O(n²): rosters are small.
	const runLength = stored.map(() => 1);
	const previous = stored.map(() => -1);

	for (let i = 0; i < stored.length; i += 1) {
		for (let j = 0; j < i; j += 1) {
			if (stored[j] >= stored[i] && runLength[j] + 1 > runLength[i]) {
				runLength[i] = runLength[j] + 1;
				previous[i] = j;
			}
		}
	}

	const anchors = new Set<number>();
	let last = runLength.indexOf(Math.max(0, ...runLength));

	while (last !== -1) {
		anchors.add(last);
		last = previous[last];
	}

	const effective = new Map<UUID, number>();
	let valueAbove: number | undefined;

	roundOrder.forEach((uuid, index) => {
		if (anchors.has(index)) {
			valueAbove = stored[index];
		}

		if (valueAbove !== undefined) {
			effective.set(uuid, valueAbove);
		}
	});

	const firstAnchorValue = anchors.size > 0 ? stored[Math.min(...anchors)] : 0;

	for (const uuid of roundOrder) {
		if (!effective.has(uuid)) {
			effective.set(uuid, firstAnchorValue);
		}
	}

	return effective;
}

/**
 * The rotating queue holds the participants still to act first and the ones
 * that already acted after them, so a round runs from the first one that
 * acted to the last one still to act. Delaying participants are left out.
 */
function roundOrderOf(
	currentOrder: UUID[],
	charactersWithTurn: Set<UUID>,
	delayedOrder: UUID[],
	isStillToAct: (uuid: UUID) => boolean = (uuid) => charactersWithTurn.has(uuid)
): UUID[] {
	const delayed = new Set(delayedOrder);
	const inRound = currentOrder.filter((uuid) => !delayed.has(uuid));

	return [
		...inRound.filter((uuid) => !isStillToAct(uuid)),
		...inRound.filter(isStillToAct),
	];
}

/**
 * Whether an arrival acts before a participant already in the order, given
 * that participant's initiative. Higher initiative goes first. On a tie with a
 * PC, an opposing arrival goes first ("If your result is tied with an enemy's
 * result, the enemy goes first"); other ties go after the participant already
 * there.
 */
export function arrivalActsBefore(
	arrival: Pick<Character, 'initiative'>,
	arrivalMeta: Pick<TrackerParticipantMeta, 'sideTheme'> | undefined,
	participant: Pick<Character, 'group'> | undefined,
	participantInitiative: number
): boolean {
	if (arrival.initiative !== participantInitiative) {
		return arrival.initiative > participantInitiative;
	}

	return (
		arrivalMeta?.sideTheme === 'opponent' && participant?.group === 'players'
	);
}

/**
 * Whether an arrival that comes in delayed still has its turn this round: only
 * when its initiative puts it after the current actor, among the participants
 * still to act. If its spot is before the current actor, its turn has already
 * passed. Without a current actor (an empty queue, or a head with no turn
 * left), nobody in the order is still to act, so it gets no turn either.
 */
function delayedArrivalKeepsTurn(
	arrival: SpawnedParticipant,
	currentOrder: UUID[],
	charactersWithTurn: Set<UUID>,
	delayedOrder: UUID[],
	charactersMap: Record<UUID, Character>
): boolean {
	const currentUuid = currentOrder[0];

	if (
		currentUuid === undefined ||
		!charactersWithTurn.has(currentUuid) ||
		delayedOrder.includes(currentUuid)
	) {
		return false;
	}

	const effective = effectiveInitiatives(
		roundOrderOf(currentOrder, charactersWithTurn, delayedOrder),
		charactersMap
	);

	return !arrivalActsBefore(
		arrival.character,
		arrival.meta,
		charactersMap[currentUuid],
		effective.get(currentUuid) ?? 0
	);
}

/**
 * Places arrivals among the participants still to act this round, by their
 * initiative against the current order (see `effectiveInitiatives`), never
 * before the current turn. On a tie with a PC, an opposing arrival goes first
 * ("If your result is tied with an enemy's result, the enemy goes first");
 * other ties go after the participants already there.
 *
 * House rule (the rules have no procedure for reinforcements): arrivals act
 * this round. One whose initiative is above everyone still to act goes right
 * after the current turn and keeps that spot in later rounds.
 */
function insertByInitiative(
	currentOrder: UUID[],
	charactersWithTurn: Set<UUID>,
	delayedOrder: UUID[],
	charactersMap: Record<UUID, Character>,
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>,
	spawned: Character[]
): UUID[] {
	const nextOrder = [...currentOrder];
	const delayed = new Set(delayedOrder);
	const arrivals = new Set<UUID>();
	const isStillToAct = (uuid: UUID) =>
		arrivals.has(uuid) || (charactersWithTurn.has(uuid) && !delayed.has(uuid));

	const effective = effectiveInitiatives(
		roundOrderOf(currentOrder, charactersWithTurn, delayedOrder, isStillToAct),
		charactersMap
	);

	const sortedSpawned = [...spawned].sort(
		(a, b) => b.initiative - a.initiative
	);

	for (const character of sortedSpawned) {
		const stillToAct = nextOrder
			.map((uuid, index) => ({ uuid, index }))
			.filter(({ uuid, index }) => index > 0 && isStillToAct(uuid));
		const before = stillToAct.find(({ uuid }) =>
			arrivalActsBefore(
				character,
				trackerMetaMap[character.uuid],
				charactersMap[uuid],
				effective.get(uuid) ?? 0
			)
		);
		const insertionIndex =
			before?.index ??
			(stillToAct.length > 0
				? stillToAct[stillToAct.length - 1].index + 1
				: Math.min(1, nextOrder.length));

		nextOrder.splice(insertionIndex, 0, character.uuid);
		arrivals.add(character.uuid);
		effective.set(character.uuid, character.initiative);
	}

	return nextOrder;
}

export class TriggerReinforcementEventCommand implements Command {
	readonly type = 'TriggerReinforcementEventCommand';
	description = 'Trigger Reinforcement Event Command';
	data: CommandData;

	constructor(
		props: CommandProps,
		private deps?: CommandDeps
	) {
		this.data = structuredClone(props);
	}

	execute() {
		const { encounterStore } = getDeps(this.deps);
		const state = encounterStore.getState();
		const slot = state.encounterData?.narrativeSlots?.find(
			(candidate) =>
				candidate.type === 'reinforcement' && candidate.id === this.data.slotId
		);

		if (!slot) {
			console.error(`Reinforcement slot ${this.data.slotId} not found`);

			return STATUS.failure;
		}

		if (!this.data.spawnedParticipants) {
			this.data.spawnedParticipants = expandSlotParticipants(
				slot,
				state.partyLevel,
				Object.values(state.charactersMap).map((character) => character.name)
			);
		}

		if (this.data.spawnedParticipants.length === 0) {
			console.error(
				`Reinforcement slot ${this.data.slotId} has no participants`
			);

			return STATUS.failure;
		}

		// Reinforcements are not in the starting roster; any participant tagged
		// with this slot means the event has already been triggered.
		const alreadyTriggered = Object.values(state.trackerMetaMap).some(
			(meta) => meta.reinforcementSlotId === this.data.slotId
		);

		if (alreadyTriggered) {
			console.error(`Reinforcement slot ${this.data.slotId} already triggered`);

			return STATUS.failure;
		}

		this.data.original = {
			charactersMap: structuredClone(state.charactersMap),
			charactersOrder: structuredClone(state.charactersOrder),
			delayedOrder: structuredClone(state.delayedOrder),
			charactersWithTurn: structuredClone(state.charactersWithTurn),
			trackerMetaMap: structuredClone(state.trackerMetaMap),
		};

		encounterStore.setState((current) => {
			const charactersMap = { ...current.charactersMap };
			const trackerMetaMap = { ...current.trackerMetaMap };
			const charactersWithTurn = new Set(current.charactersWithTurn);
			// Simple hazards never take turns, so they stay out of the order,
			// the delayed list and the turn bookkeeping.
			const turnTakers = (this.data.spawnedParticipants ?? []).filter(
				(participant) => !participant.meta.isSimpleHazard
			);
			// Participants that arrive delayed wait in the delayed list, everyone
			// else joins the order and gets a turn. An arriving delayer keeps its
			// turn this round only if its initiative puts it after the current
			// actor; if its spot has already passed, it waits for the next round.
			// The rules don't cover reinforcements, so this is a house rule.
			const arrivingDelayed = turnTakers.filter(
				(participant) => participant.character.turnState === 'delayed'
			);
			const arrivingInOrder = turnTakers
				.filter((participant) => participant.character.turnState !== 'delayed')
				.map((participant) => participant.character);

			for (const participant of this.data.spawnedParticipants ?? []) {
				charactersMap[participant.character.uuid] = participant.character;
				trackerMetaMap[participant.character.uuid] = participant.meta;
			}

			for (const character of arrivingInOrder) {
				charactersWithTurn.add(character.uuid);
			}

			for (const participant of arrivingDelayed) {
				if (
					delayedArrivalKeepsTurn(
						participant,
						current.charactersOrder,
						current.charactersWithTurn,
						current.delayedOrder,
						current.charactersMap
					)
				) {
					charactersWithTurn.add(participant.character.uuid);
				}
			}

			const charactersOrder = insertByInitiative(
				current.charactersOrder,
				current.charactersWithTurn,
				current.delayedOrder,
				charactersMap,
				trackerMetaMap,
				arrivingInOrder
			);

			return {
				charactersMap,
				charactersOrder,
				delayedOrder: [
					...current.delayedOrder,
					...arrivingDelayed.map(({ character }) => character.uuid),
				],
				charactersWithTurn,
				trackerMetaMap,
			};
		});

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
