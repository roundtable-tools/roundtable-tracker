import {
	ALIGNMENT,
	CharacterConfig,
	InitiativeParticipant,
	PRIORITY,
} from '@/store/data';
import { Party } from '@/store/savedParties';

/** A row of the preview form: a participant with its starting HP and initiative. */
export type PreviewCharacterConfig = CharacterConfig & {
	hasHealthData?: boolean;
	/** Set on a reinforcement: the slot that brings it in when triggered. */
	reinforcementSlotId?: string;
};

/** The party's members as preview participants. */
export const generatePartyFromData = (party: Party): InitiativeParticipant[] =>
	party.members.map((member) => ({
		uuid: member.uuid,
		name: member.name,
		level: member.level,
		side: ALIGNMENT.PCs,
		tiePriority: member.tiePriority ? PRIORITY.PC : PRIORITY.NPC,
		maxHealth: member.maxHealth,
		health: member.maxHealth,
		tempHealth: typeof member.maxHealth === 'number' ? 0 : undefined,
		initiative: 0,
		type: 'creature' as const,
		isSimpleHazard: false,
	}));

/** Fills in the preview form fields for a participant. */
export const toPreviewCharacter = (participant: InitiativeParticipant) => ({
	hasHealthData:
		typeof participant.maxHealth === 'number' ||
		typeof participant.health === 'number' ||
		typeof participant.tempHealth === 'number',
	...participant,
	initiative: participant.initiative ?? 0,
	maxHealth: participant.maxHealth ?? 1,
	tempHealth: participant.tempHealth ?? 0,
	health: participant.health ?? participant.maxHealth,
});

/**
 * The participant the tracker starts with: HP and initiative fall back to
 * valid values, and a participant without HP data gets 1 / 1 HP.
 */
export const toStartingParticipant = (participant: PreviewCharacterConfig) => {
	const hasHealthData = participant.hasHealthData !== false;
	const maxHealth =
		typeof participant.maxHealth === 'number' &&
		Number.isFinite(participant.maxHealth) &&
		participant.maxHealth >= 0
			? participant.maxHealth
			: 1;
	const health =
		typeof participant.health === 'number' &&
		Number.isFinite(participant.health) &&
		participant.health >= 0
			? participant.health
			: maxHealth;
	const tempHealth =
		typeof participant.tempHealth === 'number' &&
		Number.isFinite(participant.tempHealth) &&
		participant.tempHealth >= 0
			? participant.tempHealth
			: 0;
	const initiative =
		typeof participant.initiative === 'number' &&
		Number.isFinite(participant.initiative)
			? participant.initiative
			: (participant.initiative ?? 0);

	if (!hasHealthData) {
		return {
			...participant,
			hasHealthData: false,
			initiative,
			maxHealth: 1,
			health: 1,
			tempHealth: 0,
		};
	}

	return {
		...participant,
		hasHealthData: true,
		initiative,
		maxHealth,
		health,
		tempHealth,
	};
};
