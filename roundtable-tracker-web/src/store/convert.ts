import { Character, CharacterConfig, characterConfigToCharacter } from './data';

export const participantsToEncounterCharacters = (
	participants: CharacterConfig[]
): Character[] => {
	return participants
		.sort(
			(a, b) => b.initiative! - a.initiative! || b.tiePriority - a.tiePriority
		)
		.map(characterConfigToCharacter);
};
