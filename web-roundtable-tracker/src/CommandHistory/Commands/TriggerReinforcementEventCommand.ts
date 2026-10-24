import {
	ALIGNMENT,
	Character,
	NarrativeSlot,
	normalizeLevel,
} from '@/store/data';
import { TrackerParticipantMeta } from '@/store/encounterRuntimeStore';
import { generateUUID, UUID } from '@/utils/uuid';
import { uniqueNames } from '@/utils/uniqueNames';
import { isDelaying, roundOrderOf } from '@/store/operations';
import {
	arrivalActsBefore,
	effectiveInitiatives,
} from '@/store/initiativePlacement';
import {
	PendingReinforcement,
	placePendingReinforcements,
} from '@/store/pendingReinforcements';
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
		charactersWithTurn: Set<UUID>;
		trackerMetaMap: Record<UUID, TrackerParticipantMeta>;
		pendingReinforcements: PendingReinforcement[];
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
				traits: slotParticipant.traits,
				hiddenUntilFirstTurn: slotParticipant.hiddenUntilFirstTurn,
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
	charactersMap: Record<UUID, Character>,
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>,
	spawned: Character[]
): UUID[] {
	const nextOrder = [...currentOrder];
	const arrivals = new Set<UUID>();
	const isStillToAct = (uuid: UUID) =>
		arrivals.has(uuid) ||
		(charactersWithTurn.has(uuid) && !isDelaying(charactersMap, uuid));

	const effective = effectiveInitiatives(
		roundOrderOf(currentOrder, charactersWithTurn, charactersMap, isStillToAct),
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

		// Reinforcements given an initiative in the preview wait at their spot in
		// the order; slots without them (encounters started before the preview
		// set it) roll on arrival and are placed by initiative.
		const pending = (state.pendingReinforcements ?? []).filter(
			(reinforcement) => reinforcement.slotId === this.data.slotId
		);

		if (pending.length > 0) {
			this.data.spawnedParticipants = pending.map(({ character, meta }) => ({
				character,
				meta,
			}));
		} else if (!this.data.spawnedParticipants) {
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
			charactersWithTurn: structuredClone(state.charactersWithTurn),
			trackerMetaMap: structuredClone(state.trackerMetaMap),
			pendingReinforcements: structuredClone(state.pendingReinforcements ?? []),
		};

		if (pending.length > 0) {
			encounterStore.setState((current) => {
				const charactersMap = { ...current.charactersMap };
				const trackerMetaMap = { ...current.trackerMetaMap };

				for (const { character, meta } of pending) {
					charactersMap[character.uuid] = character;
					trackerMetaMap[character.uuid] = meta;
				}

				return {
					...placePendingReinforcements(current, pending),
					charactersMap,
					trackerMetaMap,
					pendingReinforcements: current.pendingReinforcements.filter(
						(reinforcement) => reinforcement.slotId !== this.data.slotId
					),
				};
			});

			return STATUS.success;
		}

		encounterStore.setState((current) => {
			const charactersMap = { ...current.charactersMap };
			const trackerMetaMap = { ...current.trackerMetaMap };
			const charactersWithTurn = new Set(current.charactersWithTurn);
			// Simple hazards never take turns, so they stay out of the order and
			// the turn bookkeeping.
			const arrivingInOrder = (this.data.spawnedParticipants ?? [])
				.filter((participant) => !participant.meta.isSimpleHazard)
				.map((participant) => participant.character);

			for (const participant of this.data.spawnedParticipants ?? []) {
				charactersMap[participant.character.uuid] = participant.character;
				trackerMetaMap[participant.character.uuid] = participant.meta;
			}

			for (const character of arrivingInOrder) {
				charactersWithTurn.add(character.uuid);
			}

			const charactersOrder = insertByInitiative(
				current.charactersOrder,
				current.charactersWithTurn,
				charactersMap,
				trackerMetaMap,
				arrivingInOrder
			);

			return {
				charactersMap,
				charactersOrder,
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
