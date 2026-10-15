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

const stableInitiativeFromId = (id: string): number => {
	let hash = 0;

	for (let i = 0; i < id.length; i += 1) {
		hash = (hash << 5) - hash + id.charCodeAt(i);
		hash |= 0;
	}

	return (Math.abs(hash) % 20) + 1;
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

const normalizeParticipantInitiative = (
	slotParticipant: ReinforcementSlotParticipant,
	fallbackId: string
): number => {
	const initiative = (slotParticipant as { initiative?: unknown }).initiative;

	if (typeof initiative === 'number' && Number.isFinite(initiative)) {
		return initiative;
	}

	return stableInitiativeFromId(fallbackId);
};

const expandSlotParticipants = (
	slot: NarrativeSlot,
	partyLevel: number,
	takenNames: string[]
): SpawnedParticipant[] => {
	if (!slot.participants || slot.participants.length === 0) {
		return [];
	}

	const spawned = slot.participants.flatMap((slotParticipant, slotIndex) => {
		const count = Math.max(1, slotParticipant.count ?? 1);
		const level = normalizeParticipantLevel(slotParticipant, partyLevel);
		const maxHealth = slotParticipant.maxHealth ?? Math.max(1, level * 5);
		const sideTheme = sideThemeFromAlignment(slotParticipant.side);

		return Array.from({ length: count }).map((_, countIndex) => {
			const uuid = generateUUID();
			const fallbackId = `${slot.id}-${slotIndex}-${countIndex}`;
			const initiative = normalizeParticipantInitiative(
				slotParticipant,
				fallbackId
			);
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

function insertByInitiative(
	currentOrder: UUID[],
	charactersMap: Record<UUID, Character>,
	spawned: Character[]
): UUID[] {
	const nextOrder = [...currentOrder];
	const currentTurnOffset = nextOrder.length > 0 ? 1 : 0;

	const sortedSpawned = [...spawned].sort(
		(a, b) => b.initiative - a.initiative
	);

	for (const character of sortedSpawned) {
		let insertionIndex = nextOrder.length;

		for (let i = currentTurnOffset; i < nextOrder.length; i += 1) {
			const candidate = charactersMap[nextOrder[i]];

			if (!candidate) {
				continue;
			}

			if (character.initiative > candidate.initiative) {
				insertionIndex = i;
				break;
			}
		}

		nextOrder.splice(insertionIndex, 0, character.uuid);
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
			const turnTakers = (this.data.spawnedParticipants ?? [])
				.filter((participant) => !participant.meta.isSimpleHazard)
				.map((participant) => participant.character);
			// Participants that arrive delayed wait in the delayed list, everyone
			// else joins the order and gets a turn. Unlike the starting roster,
			// arriving delayers get no turn this round; returning from Delay
			// still lets them act. The rules don't cover reinforcements, so this
			// is a house rule.
			const arrivingDelayed = turnTakers.filter(
				(character) => character.turnState === 'delayed'
			);
			const arrivingInOrder = turnTakers.filter(
				(character) => character.turnState !== 'delayed'
			);

			for (const participant of this.data.spawnedParticipants ?? []) {
				charactersMap[participant.character.uuid] = participant.character;
				trackerMetaMap[participant.character.uuid] = participant.meta;
			}

			for (const character of arrivingInOrder) {
				charactersWithTurn.add(character.uuid);
			}

			const charactersOrder = insertByInitiative(
				current.charactersOrder,
				charactersMap,
				arrivingInOrder
			);

			return {
				charactersMap,
				charactersOrder,
				delayedOrder: [
					...current.delayedOrder,
					...arrivingDelayed.map((character) => character.uuid),
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
