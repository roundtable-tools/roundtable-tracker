import {
	InitiativeParticipant,
	Character,
	initiativeParticipantToCharacter,
} from './data';

export const participantsToEncounterCharacters = (
	participants: InitiativeParticipant[]
): Character[] => {
	return participants
		.sort(
			(a, b) => b.initiative! - a.initiative! || b.tiePriority - a.tiePriority
		)
		.map(initiativeParticipantToCharacter);
};
