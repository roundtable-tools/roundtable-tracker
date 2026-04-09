import { Progress } from '@/components/ui/progress';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { THREAT_TYPE, Threat } from '@/models/utility/threat/Threat.class';
import { useEffect, useRef, useState } from 'react';

interface ThreatTrackerProps {
	budget?: ExperienceBudget;
	partySize?: number;
}

const ADDITIONAL_IMPOSSIBLE_UNITS = 3;
const ADDITIONAL_TRIVIAL_UNITS = 1;

type ThresholdGroup = {
	keys: number[];
	baseLabel: string;
	minXp: number;
	maxXp: number;
	color: string;
};

const CHARACTER_ADJUSTMENT_BY_THREAT: Record<string, number> = {
	Trivial: 10,
	Low: 20,
	Moderate: 20,
	Severe: 30,
	Extreme: 40,
	Impossible: 40,
};

function getBaseXpFromThreatKey(key: number): number {
	return 60 + key * 20;
}

function getCharacterAdjustmentForThreat(baseLabel: string): number {
	return CHARACTER_ADJUSTMENT_BY_THREAT[baseLabel] ?? 40;
}

function getAdjustedXpForThreat(
	threatKey: number,
	baseLabel: string,
	partySize: number
): number {
	const baseXp = getBaseXpFromThreatKey(threatKey);
	const adjustment = getCharacterAdjustmentForThreat(baseLabel);

	return Math.max(0, baseXp + adjustment * (partySize - 4));
}

export function getMergedThresholds(
	threatEntries: [number, string][],
	partySize: number
): ThresholdGroup[] {
	const colors = [
		'bg-green-400',
		'bg-lime-400',
		'bg-yellow-400',
		'bg-orange-400',
		'bg-red-400',
		'bg-gray-700',
	];

	type Group = { keys: number[]; baseLabel: string };
	const groups: Group[] = [];

	threatEntries.forEach(([key, label]) => {
		const base = label.replace(/(\+|-)+$/g, '').trim();
		let group = groups.find((g) => g.baseLabel === base);

		if (!group) {
			group = { keys: [], baseLabel: base };
			groups.push(group);
		}

		group.keys.push(key);
	});

	let previousMaxXp = 0;
	const merged = groups.map((group, i) => {
		const computedMaxXp = Math.max(
			...group.keys.map((key) => getAdjustedXpForThreat(key, group.baseLabel, partySize))
		);
		const maxXp = Math.max(computedMaxXp, previousMaxXp);
		const threshold: ThresholdGroup = {
			...group,
			minXp: previousMaxXp,
			maxXp: maxXp,
			color: colors[i % colors.length],
		};

		previousMaxXp = maxXp;

		return threshold;
	});

	if (merged.length > 0) {
		const firstThreshold = merged[0];
		const lastThreshold = merged[merged.length - 1];
		const firstAdjustment = getCharacterAdjustmentForThreat(firstThreshold.baseLabel);
		const lastAdjustment = getCharacterAdjustmentForThreat(lastThreshold.baseLabel);

		firstThreshold.minXp = Math.max(
			0,
			firstThreshold.minXp - firstAdjustment * ADDITIONAL_TRIVIAL_UNITS
		);
		lastThreshold.maxXp += lastAdjustment * ADDITIONAL_IMPOSSIBLE_UNITS;
	}

	return merged;
}

export function ThreatTracker({
	budget = ExperienceBudget.Moderate,
	partySize = 4,
}: ThreatTrackerProps) {
	const stripThreatSuffix = (label: string): string =>
		label.replace(/(\+|-)+$/g, '').trim();

	const threatEntries = Object.entries(THREAT_TYPE).map(([key, label]) => [
		parseInt(key),
		label,
	]) as [number, string][];
	const merged = getMergedThresholds(threatEntries, partySize);

	const containerRef = useRef<HTMLDivElement>(null);
	const [isSmall, setIsSmall] = useState(false);

	useEffect(() => {
		function handleResize() {
			if (containerRef.current) {
				setIsSmall(containerRef.current.offsetWidth < 800);
			}
		}

		handleResize();
		window.addEventListener('resize', handleResize);

		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const currentBudgetXp = budget.valueOf() ?? 0;
	const currentThresholdIdx = Math.max(
		0,
		merged.findIndex((group, index) => {
			const isLast = index === merged.length - 1;

			if (isLast) {
				return currentBudgetXp >= group.minXp;
			}

			return currentBudgetXp >= group.minXp && currentBudgetXp < group.maxXp;
		})
	);
	const currentThresholdLabel = merged[currentThresholdIdx]?.baseLabel ?? 'Trivial';

	const exactThreatLabel =
		threatEntries
			.map(([key, label]) => ({
				label,
				xp: new Threat({ threat: key as keyof typeof THREAT_TYPE }).toExpBudget(
					partySize
				).valueOf(),
			}))
			.sort((a, b) => a.xp - b.xp)
			.reduce<string>((activeLabel, threat) => {
				if (currentBudgetXp >= threat.xp) {
					return threat.label;
				}

				return activeLabel;
			}, THREAT_TYPE[0]);

	const exactThreatBaseLabel = stripThreatSuffix(exactThreatLabel);
	const currentDisplayLabel =
		exactThreatBaseLabel === currentThresholdLabel
			? exactThreatLabel
			: currentThresholdLabel;

	const distance = isSmall ? 1 : 1;
	const start = Math.max(0, currentThresholdIdx - distance);
	const end = Math.min(merged.length - 1, currentThresholdIdx + distance);

	let visibleThresholds = merged.slice(start, end + 1);

	const lastIdx = merged.length - 1;
	const lastVisibleIdx = visibleThresholds.length - 1;
	const lastVisibleIsLast =
		merged.indexOf(visibleThresholds[lastVisibleIdx]) === lastIdx;
	const lastIsCurrent = currentThresholdIdx === lastIdx;

	const TRIMMED_SEGMENT_PCT = isSmall ? 75 : 15;

	let visibleMin = visibleThresholds[0].minXp;
	let visibleMax = visibleThresholds[visibleThresholds.length - 1].maxXp;

	if (lastVisibleIsLast && !lastIsCurrent) {
		const prev = visibleThresholds[lastVisibleIdx - 1];
		visibleMax =
			prev.maxXp +
			(visibleThresholds[lastVisibleIdx].maxXp - prev.maxXp) *
				(TRIMMED_SEGMENT_PCT / 100);
		visibleThresholds = [
			...visibleThresholds.slice(0, -1),
			{
				...visibleThresholds[lastVisibleIdx],
				minXp: prev.maxXp,
				maxXp: visibleMax,
			},
		];
	}

	const scaledValue =
		((currentBudgetXp - visibleMin) / (visibleMax - visibleMin)) * 100;

	return (
		<div ref={containerRef} className="relative h-10 w-full overflow-visible" title={`${currentDisplayLabel} — ${budget.valueOf()} XP`}>
			<div className="absolute left-0 w-full pointer-events-none h-4">
				{visibleThresholds.map((t, i) => {
					const left =
						((t.minXp - visibleMin) / (visibleMax - visibleMin)) * 100;
					const width =
						((t.maxXp - t.minXp) / (visibleMax - visibleMin)) * 100;

					return (
						<div
							key={i}
							className="absolute text-xs text-gray-300 font-semibold px-1 truncate pointer-events-none"
							style={{
								left: `${left}%`,
								width: `${width}%`,
								minWidth: 0,
								top: 0,
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{Math.round(t.minXp)}
						</div>
					);
				})}
			</div>
			<Progress value={Math.max(0, Math.min(100, scaledValue))} className="h-4" />
			<div className="absolute inset-0 flex h-4 w-full pointer-events-none">
				{visibleThresholds.map((t, i) => {
					const left =
						((t.minXp - visibleMin) / (visibleMax - visibleMin)) * 100;
					const width =
						((t.maxXp - t.minXp) / (visibleMax - visibleMin)) * 100;

					return (
						<div
							key={i}
							className={`${t.color} mix-blend-multiply h-full absolute border-r border`}
							style={{
								left: `${left}%`,
								width: `${width}%`,
								opacity: 0.4,
								zIndex: 2,
								borderRight:
									i === visibleThresholds.length - 1 ? 'none' : undefined,
							}}
						/>
					);
				})}
			</div>
			<div className="absolute left-0 top-4 w-full h-6 pointer-events-none">
				{visibleThresholds.map((t, i) => {
					const left =
						((t.minXp - visibleMin) / (visibleMax - visibleMin)) * 100;
					const width =
						((t.maxXp - t.minXp) / (visibleMax - visibleMin)) * 100;
					const isCurrent = merged.indexOf(t) === currentThresholdIdx;
					const label = isCurrent ? currentDisplayLabel : t.baseLabel;

					return (
						<span
							key={i}
							className={
								'absolute px-1 truncate ' +
								(isCurrent ? 'font-bold drop-shadow-sm' : 'text-gray-700')
							}
							style={{
								left: `${left}%`,
								width: `${width}%`,
								minWidth: 0,
								textAlign: 'left',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{label}
						</span>
					);
				})}
			</div>
		</div>
	);
}
