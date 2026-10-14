import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { Threat } from '@/models/utility/threat/Threat.class';

const ADDITIONAL_IMPOSSIBLE_UNITS = 3;

export type ThresholdGroup = {
	keys: number[];
	baseLabel: string;
	minXp: number;
	maxXp: number;
	color: string;
};

function stripThreatSuffix(label: string): string {
	return label.replace(/(\+|-)+$/g, '').trim();
}

/**
 * Groups the threat bands by base threat (Moderate and Moderate+ share one
 * segment). Band edges come from `Threat.thresholds`, the same "at or above"
 * rule the saved difficulty uses.
 */
export function getMergedThresholds(partySize: number): ThresholdGroup[] {
	const colors = [
		'bg-green-400',
		'bg-lime-400',
		'bg-yellow-400',
		'bg-orange-400',
		'bg-red-400',
		'bg-gray-700',
	];

	type Group = { keys: number[]; baseLabel: string; minXp: number };
	const groups: Group[] = [];

	Threat.thresholds(partySize).forEach(({ threat, minXp }) => {
		const base = stripThreatSuffix(threat.toLabel());
		let group = groups.find((g) => g.baseLabel === base);

		if (!group) {
			group = { keys: [], baseLabel: base, minXp: Math.max(0, minXp) };
			groups.push(group);
		}

		group.keys.push(threat.threat);
	});

	return groups.map((group, i) => {
		const next = groups[i + 1];
		const maxXp = next
			? next.minXp
			: group.minXp +
				ExperienceBudget.budgetToCharacterAdjustment(
					ExperienceBudget.Impossible
				).valueOf() *
					ADDITIONAL_IMPOSSIBLE_UNITS;

		return {
			...group,
			maxXp,
			color: colors[i % colors.length],
		};
	});
}
