import { Character } from './data';
import { TrackerParticipantMeta } from './encounterRuntimeStore';
import { UUID } from '@/utils/uuid';

/**
 * Initiative values that follow the current order. A reorder or a return from
 * Delay changes positions but not the stored numbers, so the stored numbers
 * can contradict the order. The longest run of participants whose stored
 * numbers still fall in order keep them; everyone else takes the value of the
 * nearest such participant above them (below, if there is none above). When
 * a change reads two ways (two neighbours swapped: one moved up, or the other
 * moved down), the participant now higher keeps its number.
 *
 * `roundOrder` is the order of one round, from its first turn to its last.
 */
export function effectiveInitiatives(
	roundOrder: UUID[],
	charactersMap: Record<UUID, Character>
): Map<UUID, number> {
	const stored = roundOrder.map((uuid) => charactersMap[uuid]?.initiative ?? 0);
	// Longest non-increasing subsequence, O(n²): rosters are small.
	const runLength = stored.map(() => 1);
	const previous = stored.map(() => -1);

	for (let i = 0; i < stored.length; i += 1) {
		for (let j = 0; j < i; j += 1) {
			if (stored[j] >= stored[i] && runLength[j] + 1 > runLength[i]) {
				runLength[i] = runLength[j] + 1;
				previous[i] = j;
			}
		}
	}

	const anchors = new Set<number>();
	let last = runLength.indexOf(Math.max(0, ...runLength));

	while (last !== -1) {
		anchors.add(last);
		last = previous[last];
	}

	const effective = new Map<UUID, number>();
	let valueAbove: number | undefined;

	roundOrder.forEach((uuid, index) => {
		if (anchors.has(index)) {
			valueAbove = stored[index];
		}

		if (valueAbove !== undefined) {
			effective.set(uuid, valueAbove);
		}
	});

	const firstAnchorValue = anchors.size > 0 ? stored[Math.min(...anchors)] : 0;

	for (const uuid of roundOrder) {
		if (!effective.has(uuid)) {
			effective.set(uuid, firstAnchorValue);
		}
	}

	return effective;
}

/**
 * Whether an arrival acts before a participant already in the order, given
 * that participant's initiative. Higher initiative goes first. On a tie with a
 * PC, an opposing arrival goes first ("If your result is tied with an enemy's
 * result, the enemy goes first"); other ties go after the participant already
 * there.
 */
export function arrivalActsBefore(
	arrival: Pick<Character, 'initiative'>,
	arrivalMeta: Pick<TrackerParticipantMeta, 'sideTheme'> | undefined,
	participant: Pick<Character, 'group'> | undefined,
	participantInitiative: number
): boolean {
	if (arrival.initiative !== participantInitiative) {
		return arrival.initiative > participantInitiative;
	}

	return (
		arrivalMeta?.sideTheme === 'opponent' && participant?.group === 'players'
	);
}
