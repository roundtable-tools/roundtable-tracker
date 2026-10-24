/**
 * Participant fields that encounters saved or exported by older versions can
 * still hold:
 * - `startingState: 'delayed'`: starting delayed let a participant join right
 *   after the first turn of the encounter, so it now starts in the order,
 *   hidden until its first turn.
 * - `silentDelay`: a starting delay that didn't ask to return; dropped with
 *   the starting delay.
 * - `hiddenFromPlayers`: replaced by `hiddenUntilFirstTurn`.
 */
type LegacyParticipantFields = {
	startingState?: string;
	silentDelay?: boolean;
	hiddenFromPlayers?: boolean;
	hiddenUntilFirstTurn?: boolean;
};

type EncounterWithParticipants = {
	participants?: unknown[];
	narrativeSlots?: { participants?: unknown[] }[];
	variants?: { participants?: unknown[] }[];
};

export function migrateLegacyParticipant<T extends object>(participant: T): T {
	const {
		silentDelay: _silentDelay,
		hiddenFromPlayers,
		...rest
	} = participant as T & LegacyParticipantFields;
	const startedDelayed = rest.startingState === 'delayed';
	const hiddenUntilFirstTurn =
		rest.hiddenUntilFirstTurn || hiddenFromPlayers || startedDelayed;

	return {
		...rest,
		...(startedDelayed && { startingState: 'normal' }),
		...(hiddenUntilFirstTurn && { hiddenUntilFirstTurn: true }),
	} as T;
}

const migrateParticipants = <T extends { participants?: unknown[] }>(
	holder: T
): T =>
	holder.participants
		? {
				...holder,
				participants: holder.participants.map((participant) =>
					migrateLegacyParticipant(participant as object)
				),
			}
		: holder;

/** Rewrites the legacy participant fields of an encounter and its slots. */
export function migrateLegacyEncounter<T extends EncounterWithParticipants>(
	encounter: T
): T {
	return {
		...migrateParticipants(encounter),
		...(encounter.narrativeSlots && {
			narrativeSlots: encounter.narrativeSlots.map(migrateParticipants),
		}),
		...(encounter.variants && {
			variants: encounter.variants.map(migrateParticipants),
		}),
	};
}
