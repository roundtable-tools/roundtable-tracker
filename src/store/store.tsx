import { createStore } from 'zustand/vanilla';
import { APP_MODE, AppMode, Character, STATE } from './data';
import { generateUUID, UUID } from '@/utils/uuid';
import { useStore } from 'zustand';
import { Encounter, InitiativeParticipant, PRIORITY } from '@/EncounterDirectory/Encounter';

const characters: Character[] = new Array(10).fill(0).map((_, index) => ({
	uuid: generateUUID(),
	name: `Character ${index + 1}`,
	initiative: Math.floor(Math.random() * 20) + 1,
	turnState: STATE[Math.floor(Math.random() * STATE.length)],
}));

type ValueOrFunction<T> = T | ((prev: T) => T);

function isCallableFunction<T>(
	func: ValueOrFunction<T>
): func is (prev: T) => T {
	return typeof func === 'function';
}

export interface EncounterStore {
	encounterData?: Encounter;
	charactersMap: Record<UUID, Character>;
	charactersOrder: UUID[];
	appMode: AppMode;
	partyLevel: number;
	setEncounterData: (encounterData: Encounter) => void;
	updateCharacter: (uuid: UUID, character: ValueOrFunction<Character>) => void;
	setCharacters: (characters: Character[]) => void;
	setAppMode: (mode: AppMode) => void;
	setPartyLevel: (partyLevel: number) => void;
}

function unpackValue<T>(value: ValueOrFunction<T>, currentValue: T): T {
	if (isCallableFunction(value)) return value(currentValue);

	return value;
}

export const createEncounterStore = () =>
	createStore<EncounterStore>()((set) => {
		const setCharacters =(characters: Character[]) => {
			set(() => {
				const charactersMap = characters.reduce(
					(acc, character) => {
						acc[character.uuid] = character;
						return acc;
					},
					{} as Record<UUID, Character>
				);

				const charactersOrder = characters.map((character) => character.uuid);

				return { charactersMap, charactersOrder };
			});
		}
		const updateCharacter = (uuid: UUID, newCharacter: ValueOrFunction<Character>) =>
			set((state) => {
				const character = state.charactersMap[uuid];
				if (!character) {
					console.error(`Character with uuid ${uuid} not found`);
					return {};
				}

				const newCharacterValue = unpackValue(newCharacter, character);

				state.charactersMap[uuid] = newCharacterValue;

				return {
					charactersMap: { ...state.charactersMap },
				};
			})
		
		const setAppMode = (mode: AppMode) => set(() => ({ appMode: mode }))
		const setPartyLevel = (partyLevel: number) => set(() => ({ partyLevel }))
		const setEncounterData = (encounterData: Encounter) => set(() => ({ encounterData }));
		const generateCharactersFromEncounterData = (encounterData: Encounter) => set((state) => {
			
			const totalParticipants = encounterData.participants.flatMap(({level,startingState: turnState,...participant}) =>
				Array.from({ length: participant.count ?? 1 }).map(
					() => ({
						uuid: generateUUID(),
						tiePriority: PRIORITY.NPC,
						...participant,
						level: Number.isInteger(level)
							? level as number
							: state.partyLevel + Number.parseInt(level as string),
						initiative: 0,
						turnState: turnState ?? 'normal',
					})
				)) satisfies InitiativeParticipant[]
			setCharacters(totalParticipants)
			return {}
		})
		return ({
			encounterData: undefined,
			charactersMap: {},
			charactersOrder: [],
			appMode: APP_MODE.Empty, // Initial appMode value
			partyLevel: 0,
			setEncounterData,
			setCharacters,
			updateCharacter,
			setAppMode,
			setPartyLevel,
		});
	});

export const encounterStore = createEncounterStore();

encounterStore.getState().setCharacters(characters);

export const useEncounterStore = <T,>(selector: (state: EncounterStore) => T) =>
	useStore(encounterStore, selector);
