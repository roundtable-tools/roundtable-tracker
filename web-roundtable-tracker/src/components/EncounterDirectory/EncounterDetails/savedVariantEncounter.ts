import { LEVEL_REPRESENTATION, type Encounter } from '@/store/data';

export type SavedVariant = NonNullable<Encounter['variants']>[number];

/**
 * Builds the encounter to run when a saved variant is selected. Fields the
 * variant does not set fall back to the base encounter, including the events
 * and notes of a relative-level variant; an explicit empty event list stays
 * empty.
 */
export function buildSavedVariantEncounter(
	encounter: Encounter,
	variant: SavedVariant
): Encounter {
	return {
		...encounter,
		partySize: variant.partySize ?? encounter.partySize,
		level: variant.level ?? encounter.level,
		difficulty: variant.difficulty ?? encounter.difficulty,
		description: variant.description ?? encounter.description,
		participants: variant.participants,
		// Imported template variants carry their own events and notes
		...(encounter.levelRepresentation === LEVEL_REPRESENTATION.Relative
			? {
					narrativeSlots:
						('narrativeSlots' in variant
							? variant.narrativeSlots
							: undefined) ?? encounter.narrativeSlots,
					notes:
						('notes' in variant ? variant.notes : undefined) ?? encounter.notes,
				}
			: {}),
	} as Encounter;
}
