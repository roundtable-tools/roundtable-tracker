import type { BuilderSlot, SlotType } from './builderXp';

const ACCOMPLISHMENT_LABELS = {
	story: 'story',
	minor: 'minor',
	moderate: 'moderate',
	major: 'major',
} as const;

const PARTICIPANT_TYPES: SlotType[] = ['creature', 'hazard'];
const EVENT_TYPES: SlotType[] = ['narrative', 'reinforcement'];

const PARTICIPANT_TYPE_LABELS: Record<SlotType, string> = {
	creature: 'creatures',
	hazard: 'hazards',
	reinforcement: 'reinforcement events',
	narrative: 'narrative events',
};

const EVENT_TYPE_LABELS: Record<SlotType, string> = {
	creature: 'creatures',
	hazard: 'hazards',
	reinforcement: 'reinforcement events',
	narrative: 'narrative events',
};

type SlotSectionKind = 'participants' | 'events';

function formatCountSummary(summary: Partial<Record<SlotType, number>>) {
	const parts = Object.entries(summary)
		.filter(([, count]) => (count ?? 0) > 0)
		.map(([type, count]) => `${count} ${PARTICIPANT_TYPE_LABELS[type as SlotType]}`);

	return parts.length > 0 ? parts.join(', ') : 'none yet';
}

function formatValueSummary(values: number[], label: 'L') {
	if (values.length === 0) {
		return 'none set';
	}

	const uniqueValues = [...new Set(values)].sort((left, right) => left - right);

	return uniqueValues.map((value) => `${label}${value}`).join(', ');
}

function formatTierSummary(values: Array<keyof typeof ACCOMPLISHMENT_LABELS | undefined>) {
	const tiers = [...new Set(values.filter(Boolean))] as Array<
		keyof typeof ACCOMPLISHMENT_LABELS
	>;

	if (tiers.length === 0) {
		return 'none set';
	}

	return tiers.map((tier) => ACCOMPLISHMENT_LABELS[tier]).join(', ');
}

export function isParticipantSlot(slot: BuilderSlot) {
	return PARTICIPANT_TYPES.includes(slot.type);
}

export function isEventSlot(slot: BuilderSlot) {
	return EVENT_TYPES.includes(slot.type);
}

export function getSlotSectionIndices(
	slots: BuilderSlot[],
	kind: SlotSectionKind
) {
	return slots.reduce<number[]>((indices, slot, index) => {
		if (kind === 'participants' ? isParticipantSlot(slot) : isEventSlot(slot)) {
			indices.push(index);
		}

		return indices;
	}, []);
}

export function getParticipantSectionSummary(slots: BuilderSlot[]) {
	const typeCounts = slots.reduce<Partial<Record<SlotType, number>>>((summary, slot) => {
		if (!isParticipantSlot(slot)) {
			return summary;
		}

		summary[slot.type] = (summary[slot.type] ?? 0) + 1;
		return summary;
	}, {});
	const levels = slots.filter(isParticipantSlot).map((slot) => slot.level);

	return {
		count: levels.length,
		breakdown: formatCountSummary(typeCounts),
		values: formatValueSummary(levels, 'L'),
	};
}

export function getEventSectionSummary(slots: BuilderSlot[]) {
	const typeCounts = slots.reduce<Partial<Record<SlotType, number>>>((summary, slot) => {
		if (!isEventSlot(slot)) {
			return summary;
		}

		summary[slot.type] = (summary[slot.type] ?? 0) + 1;
		return summary;
	}, {});
	const tiers = slots.filter(isEventSlot).map((slot) => slot.accomplishmentLevel);

	return {
		count: tiers.length,
		breakdown: Object.entries(typeCounts)
			.filter(([, count]) => (count ?? 0) > 0)
			.map(([type, count]) => `${count} ${EVENT_TYPE_LABELS[type as SlotType]}`)
			.join(', ') || 'none yet',
		values: formatTierSummary(tiers),
	};
}