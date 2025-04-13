import { createStore } from 'zustand/vanilla';
import { Character } from './data';
import { UUID } from '@/utils/uuid';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Encounter } from './data';
import { Command } from '@/CommandHistory/common';
import { jsonConfiguration } from './serializer';
import { CommandJSON } from '@/CommandHistory/serialization';
import { splitArray } from '@/utils/array';
import { supabase } from './supbase';
import { v4 as uuidv4 } from 'uuid'; // Import UUID generator

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
	delayedOrder: UUID[];
	partyLevel: number;
	round: number;
	charactersWithTurn: Set<UUID>;
	history: Command[];
	redoStack: Command[];
	roomUuid: string;
	gmUuid: string;
	startEncounter: (characters: Character[]) => void;
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setPartyLevel: (partyLevel: number) => void;
	setHistory: (history: ValueOrFunction<Command[]>) => void;
	setRedoStack: (redoStack: ValueOrFunction<Command[]>) => void;
	saveStateToSupabase: (roomUuid: string, gmUuid: string) => Promise<void>;
	loadStateFromSupabase: (roomUuid: string) => Promise<void>;
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

const parseCharacters = (characters: Character[]) => {
	const charactersMap = characters.reduce(
		(acc, character) => {
			acc[character.uuid] = character;

			return acc;
		},
		{} as Record<UUID, Character>
	);

	const charactersId = characters.map((character) => character.uuid);
	const [delayedOrder, charactersOrder] = splitArray(
		charactersId,
		(uuid) => charactersMap[uuid].turnState === 'delayed'
	);

	return {
		charactersMap,
		charactersOrder,
		delayedOrder,
	};
};

const resetHistory = () => ({ history: [], redoStack: [] });

const startEncounter = (characters: Character[]): Partial<EncounterStore> => {
	const { charactersMap, charactersOrder, delayedOrder } =
		parseCharacters(characters);

	return {
		charactersMap,
		charactersOrder,
		delayedOrder,
		round: 1,
		charactersWithTurn: new Set(charactersOrder),
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
			state.charactersMap[uuid] = newCharacterValue;

			return { charactersMap: { ...state.charactersMap } };
		});

export const createEncounterStore = () => {
	const store = createStore<EncounterStore>()(
		persist(
			(set, get) => ({
				charactersMap: {},
				charactersOrder: [],
				delayedOrder: [],
				round: 0,
				charactersWithTurn: new Set(),
				history: [],
				redoStack: [],
				partyLevel: 1,
				roomUuid: '',
				gmUuid: '',
				encounterData: undefined,
				startEncounter: async (characters: Character[]) => {
					const {
						data: { session },
						error,
					} = await supabase.auth.getSession();

					if (error || !session) {
						console.error('Error fetching logged-in user:', error);

						return;
					}

					const gmUuid = session.user.id; // Use logged-in user's ID as gm_uuid
					const roomUuid = uuidv4(); // Generate a new room_uuid

					set(() => ({
						...startEncounter(characters),
						roomUuid,
						gmUuid,
					}));

					// Save the initial state to Supabase
					store.getState().saveStateToSupabase(roomUuid, gmUuid);
				},
				setCharacters: (characters: Character[]) =>
					set(() => parseCharacters(characters)),
				updateCharacter: updateCharacter(set),
				setPartyLevel: (partyLevel: number) => set(() => ({ partyLevel })),
				setEncounterData: (encounterData: Encounter) =>
					set(() => ({ encounterData })),
				setHistory: simpleSet<Command[], typeof set>(set, 'history'),
				setRedoStack: simpleSet<Command[], typeof set>(set, 'redoStack'),
				saveStateToSupabase: async (roomUuid: string, gmUuid: string) => {
					const state = get();
					const { error } = await supabase.from('rooms').upsert(
						{
							room_uuid: roomUuid,
							gm_uuid: gmUuid,
							state: JSON.stringify({
								charactersMap: state.charactersMap,
								charactersOrder: state.charactersOrder,
								delayedOrder: state.delayedOrder,
								round: state.round,
								charactersWithTurn: Array.from(state.charactersWithTurn),
								history: state.history,
								redoStack: state.redoStack,
								partyLevel: state.partyLevel,
								encounterData: state.encounterData,
							}),
						},
						{ onConflict: 'room_uuid' }
					); // Ensure conflict resolution is based on room_uuid

					if (error) {
						console.error('Error saving state to Supabase:', error);
					}
				},
				loadStateFromSupabase: async (roomUuid: string) => {
					const { data, error } = await supabase
						.from('rooms')
						.select('state')
						.eq('room_uuid', roomUuid)
						.single();

					if (error) {
						console.error('Error loading state from Supabase:', error);

						return;
					}

					if (data?.state) {
						const parsedState = JSON.parse(data.state);
						set(() => ({
							charactersMap: parsedState.charactersMap,
							charactersOrder: parsedState.charactersOrder,
							delayedOrder: parsedState.delayedOrder,
							round: parsedState.round,
							charactersWithTurn: new Set(parsedState.charactersWithTurn),
							history: parsedState.history,
							redoStack: parsedState.redoStack,
							partyLevel: parsedState.partyLevel,
							encounterData: parsedState.encounterData,
						}));
					}
				},
			}),
			{
				name: 'encounter-store',
				storage: createJSONStorage<EncounterStoreJson>(
					() => localStorage,
					jsonConfiguration
				),
			}
		)
	);

	// Subscribe to store changes and update Supabase
	store.subscribe((state) => {
		const roomUuid = state.roomUuid;
		const gmUuid = state.gmUuid;
		if (roomUuid && gmUuid) {
			store.getState().saveStateToSupabase(roomUuid, gmUuid);
		}
	});

	// Listen for changes in Supabase and log them
	supabase
		.channel('rooms')
		.on(
			'postgres_changes',
			{ event: '*', schema: 'public', table: 'rooms' },
			(payload) => {
				console.log('Supabase state change:', payload.new);
			}
		)
		.subscribe();

	return store;
};
