import { ALIGNMENT, Character, NarrativeSlot, normalizeLevel } from '@/store/data';
import { TrackerParticipantMeta } from '@/store/encounterRuntimeStore';
import { generateUUID, UUID } from '@/utils/uuid';
import { Command, CommandDeps, getDeps, STATUS, undoOriginalState } from '../common';

type CommandProps = {
	slotId: string;
};

type SpawnedParticipant = {
	character: Character;
	meta: TrackerParticipantMeta;
};

type ReinforcementSlotParticipant = NonNullable<NarrativeSlot['participants']>[number];

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
	partyLevel: number
): SpawnedParticipant[] => {
	if (!slot.participants || slot.participants.length === 0) {
		return [];
	}

	return slot.participants.flatMap((slotParticipant, slotIndex) => {
		const count = Math.max(1, slotParticipant.count ?? 1);
		const level = normalizeParticipantLevel(slotParticipant, partyLevel);
		const maxHealth = slotParticipant.maxHealth ?? Math.max(1, level * 5);
		const sideTheme = sideThemeFromAlignment(slotParticipant.side);

		return Array.from({ length: count }).map((_, countIndex) => {
			const uuid = generateUUID();
			const fallbackId = `${slot.id}-${slotIndex}-${countIndex}`;
			const initiative = normalizeParticipantInitiative(slotParticipant, fallbackId);
			const baseName = slotParticipant.name.trim() || 'Reinforcement';
			const withSuffix = count > 1 ? `${baseName} ${countIndex + 1}` : baseName;
			const notes = slot.description?.trim() || slotParticipant.description?.trim() || '';

			const character: Character = {
				uuid,
				name: withSuffix,
				initiative,
				turnState: 'normal',
				hasTurn: false,
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
						? (slotParticipant.isSimpleHazard ?? !slotParticipant.isComplexHazard)
						: false,
				disableChecksRequired:
					slotParticipant.type === 'hazard'
						? slotParticipant.successesToDisable ?? 0
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
};

function insertByInitiative(
	currentOrder: UUID[],
	charactersMap: Record<UUID, Character>,
	spawned: Character[]
): UUID[] {
	const nextOrder = [...currentOrder];
	const currentTurnOffset = nextOrder.length > 0 ? 1 : 0;

	const sortedSpawned = [...spawned].sort((a, b) => b.initiative - a.initiative);

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

	constructor(props: CommandProps, private deps?: CommandDeps) {
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
			this.data.spawnedParticipants = expandSlotParticipants(slot, state.partyLevel);
		}

		if (this.data.spawnedParticipants.length === 0) {
			console.error(`Reinforcement slot ${this.data.slotId} has no participants`);

			return STATUS.failure;
		}

		const existingMetaValues = Object.entries(state.trackerMetaMap);

		// Check if participants were pre-added as pending reinforcements for this slot
		const preAddedUuids = existingMetaValues
			.filter(([, meta]) => meta.reinforcementSlotId === this.data.slotId && meta.reinforcementPending === true)
			.map(([uuid]) => uuid);

		const alreadyTriggered = existingMetaValues.some(
			([, meta]) =>
				meta.reinforcementSlotId === this.data.slotId &&
				meta.reinforcementPending === false
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

		if (preAddedUuids.length > 0) {
			// Activate pre-added pending participants
			encounterStore.setState((current) => {
				const trackerMetaMap = { ...current.trackerMetaMap };
				const charactersWithTurn = new Set(current.charactersWithTurn);
				// Re-insert by initiative relative to current queue (excluding themselves)
				const orderWithoutPending = current.charactersOrder.filter(
					(uuid) => !preAddedUuids.includes(uuid)
				);
				const pendingCharacters = preAddedUuids
					.map((uuid) => current.charactersMap[uuid])
					.filter((c): c is NonNullable<typeof c> => c != null);

				const newCharactersOrder = insertByInitiative(
					orderWithoutPending,
					current.charactersMap,
					pendingCharacters
				);

				for (const uuid of preAddedUuids) {
					trackerMetaMap[uuid] = {
						...trackerMetaMap[uuid],
						reinforcementPending: false,
					};
					charactersWithTurn.add(uuid);
				}

				return {
					charactersOrder: newCharactersOrder,
					charactersWithTurn,
					trackerMetaMap,
				};
			});
		} else {
			// No pre-added participants — spawn fresh
			if (!this.data.spawnedParticipants) {
				this.data.spawnedParticipants = expandSlotParticipants(slot, state.partyLevel);
			}

			if (this.data.spawnedParticipants.length === 0) {
				console.error(`Reinforcement slot ${this.data.slotId} has no participants`);

				return STATUS.failure;
			}

			encounterStore.setState((current) => {
				const charactersMap = { ...current.charactersMap };
				const trackerMetaMap = { ...current.trackerMetaMap };
				const charactersWithTurn = new Set(current.charactersWithTurn);

				for (const participant of this.data.spawnedParticipants ?? []) {
					charactersMap[participant.character.uuid] = participant.character;
					trackerMetaMap[participant.character.uuid] = {
						...participant.meta,
						reinforcementPending: false,
					};
					charactersWithTurn.add(participant.character.uuid);
				}

				const charactersOrder = insertByInitiative(
					current.charactersOrder,
					charactersMap,
					(this.data.spawnedParticipants ?? []).map(
						(participant) => participant.character
					)
				);

				return {
					charactersMap,
					charactersOrder,
					charactersWithTurn,
					trackerMetaMap,
				};
			});
		}

		return STATUS.success;
	}

	undo() {
		return undoOriginalState(this.data.original, this.deps);
	}
}
