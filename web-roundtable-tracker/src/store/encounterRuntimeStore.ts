import { createStore } from 'zustand/vanilla';
import { Character, type ParticipantDcEntry } from './data';
import { UUID } from '@/utils/uuid';

export type TrackerParticipantRole =
	| 'pc'
	| 'opponent'
	| 'neutral'
	| 'ally'
	| 'hazard'
	| 'reinforcement';

export type TrackerParticipantSideTheme = 'pc' | 'opponent' | 'ally' | 'other';

export type TrackerParticipantMeta = {
	role: TrackerParticipantRole;
	sideTheme: TrackerParticipantSideTheme;
	hasHealthData?: boolean;
	isSimpleHazard: boolean;
	disableChecksRequired: number;
	disableChecksSucceeded: number;
	notes: string;
	hardness?: number;
	initiativeBonus?: number;
	dcs?: ParticipantDcEntry[];
	adjustmentDescription?: string;
	adjustmentLevelModifier?: number;
	traits?: string[];
	/** Kept from the players until the participant's first turn starts. */
	hiddenUntilFirstTurn?: boolean;
	reinforcementSlotId?: string;
};
import { persist, createJSONStorage } from 'zustand/middleware';
import { Encounter } from './data';
import { Command } from '@/CommandHistory/common';
import { jsonConfiguration } from './serializer';
import {
	CommandJSON,
	keepRedoableCommands,
	keepUndoableCommands,
} from '@/CommandHistory/serialization';
import { type EncounterTimer, startTimer } from './encounterTimer';
import { type PendingReinforcement } from './pendingReinforcements';

// A hazard is disabled once its Disable a Device successes reach the required
// count. Hazards without a required count can't be disabled this way.
export const isHazardDisabled = (meta: {
	role: TrackerParticipantRole;
	disableChecksRequired?: number;
	disableChecksSucceeded?: number;
}) =>
	meta.role === 'hazard' &&
	(meta.disableChecksRequired ?? 0) > 0 &&
	(meta.disableChecksSucceeded ?? 0) >= (meta.disableChecksRequired ?? 0);

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
}

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

export interface EncounterStore {
	encounterData?: Encounter;
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>;
	/** Reinforcements given an initiative in the preview, not yet triggered. */
	pendingReinforcements: PendingReinforcement[];
	partyLevel: number;
	round: number;
	charactersWithTurn: Set<UUID>;
	history: Command[];
	redoStack: Command[];
	/** Round and turn timing; null when no encounter is running. */
	timer: EncounterTimer | null;
	startEncounter: (
		characters: Character[],
		trackerMetaMap?: Record<UUID, TrackerParticipantMeta>,
		pendingReinforcements?: PendingReinforcement[]
	) => void;
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setPartyLevel: (partyLevel: number) => void;
	setTrackerMetaMap: (metaMap: Record<UUID, TrackerParticipantMeta>) => void;
	setHistory: (history: ValueOrFunction<Command[]>) => void;
	setRedoStack: (redoStack: ValueOrFunction<Command[]>) => void;
	setTimer: (timer: ValueOrFunction<EncounterTimer | null>) => void;
}

export type EncounterStoreJson = {
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	history: CommandJSON[];
	redoStack: CommandJSON[];
};

function simpleSet<
	T,
	K extends (fn: (state: EncounterStore) => Record<string, unknown>) => void,
>(set: K, key: keyof EncounterStore) {
	return (value: ValueOrFunction<T>) => {
		set((state) => {
			const newValue = unpackValue(value, state[key] as T);

			return { [key]: newValue };
		});
	};
}

// Simple hazards never take turns, so they stay out of the turn order and the
// turn bookkeeping. They live only in charactersMap (and the hazards panel).
export const isSimpleHazardId = (
	trackerMetaMap: Record<UUID, TrackerParticipantMeta>,
	uuid: UUID
) => trackerMetaMap[uuid]?.isSimpleHazard === true;

const parseCharacters = (
	characters: Character[],
	trackerMetaMap: Record<UUID, TrackerParticipantMeta> = {}
) => {
	const charactersMap = characters.reduce(
		(acc, character) => {
			acc[character.uuid] = character;

			return acc;
		},
		{} as Record<UUID, Character>
	);

	// Everyone starts in the order: nobody starts the encounter delayed.
	const charactersOrder = characters
		.map((character) => character.uuid)
		.filter((uuid) => !isSimpleHazardId(trackerMetaMap, uuid));

	return {
		charactersMap,
		charactersOrder,
	};
};

const resetHistory = () => ({ history: [], redoStack: [] });

const startEncounter = (
	characters: Character[],
	trackerMetaMap: Record<UUID, TrackerParticipantMeta> = {},
	pendingReinforcements: PendingReinforcement[] = []
): Partial<EncounterStore> => {
	const { charactersMap, charactersOrder } = parseCharacters(
		characters,
		trackerMetaMap
	);

	return {
		charactersMap,
		charactersOrder,
		trackerMetaMap,
		pendingReinforcements,
		round: 1,
		charactersWithTurn: new Set(charactersOrder),
		timer:
			charactersOrder.length > 0
				? startTimer(
						{ participantId: charactersOrder[0] ?? null, round: 1 },
						Date.now()
					)
				: null,
		...resetHistory(),
	};
};

const updateCharacter =
	(set: (fn: (state: EncounterStore) => Partial<EncounterStore>) => void) =>
	(uuid: UUID, newCharacter: ValueOrFunction<Character>) =>
		set((state) => {
			const character = state.charactersMap[uuid];

			if (!character) {
				console.error(`Character with uuid ${uuid} not found`);

				return {};
			}
			const newCharacterValue = unpackValue(newCharacter, character);

			return {
				charactersMap: {
					...state.charactersMap,
					[uuid]: newCharacterValue,
				},
			};
		});

export const createEncounterStore = () =>
	createStore<EncounterStore>()(
		persist(
			(set) => ({
				charactersMap: {},
				charactersOrder: [],
				trackerMetaMap: {},
				pendingReinforcements: [],
				round: 0,
				charactersWithTurn: new Set(),
				history: [],
				redoStack: [],
				partyLevel: 1,
				encounterData: undefined,
				timer: null,
				startEncounter: (
					characters: Character[],
					trackerMetaMap?: Record<UUID, TrackerParticipantMeta>,
					pendingReinforcements?: PendingReinforcement[]
				) =>
					set(() =>
						startEncounter(characters, trackerMetaMap, pendingReinforcements)
					),
				setCharacters: (characters: Character[]) =>
					set(() => parseCharacters(characters)),
				updateCharacter: updateCharacter(set),
				setPartyLevel: (partyLevel: number) => set(() => ({ partyLevel })),
				setEncounterData: (encounterData: Encounter) =>
					set(() => ({ encounterData })),
				setTrackerMetaMap: (metaMap: Record<UUID, TrackerParticipantMeta>) =>
					set(() => ({ trackerMetaMap: metaMap })),
				setHistory: simpleSet<Command[], typeof set>(set, 'history'),
				setRedoStack: simpleSet<Command[], typeof set>(set, 'redoStack'),
				setTimer: simpleSet<EncounterTimer | null, typeof set>(set, 'timer'),
			}),
			{
				name: 'encounter-store',
				storage: createJSONStorage<EncounterStoreJson>(
					() => localStorage,
					jsonConfiguration
				),
				merge: (persistedState, currentState) => {
					const persisted = persistedState as Partial<EncounterStore>;

					return {
						...currentState,
						...persisted,
						history: keepUndoableCommands(persisted?.history ?? []),
						redoStack: keepRedoableCommands(persisted?.redoStack ?? []),
					};
				},
			}
		)
	);
