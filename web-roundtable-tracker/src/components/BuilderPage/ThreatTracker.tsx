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
	min: number;
	max: number;
	width: number;
	color: string;
};

function getMergedThresholds(
	threatEntries: [number, string][]
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

	if (groups.length > 0) {
		const lastGroup = groups[groups.length - 1];
		const lastKey = lastGroup.keys[lastGroup.keys.length - 1];
		lastGroup.keys.push(
			...Array.from({ length: ADDITIONAL_IMPOSSIBLE_UNITS }, () => lastKey)
		);
		const firstGroup = groups[0];
		firstGroup.keys.unshift(
			...Array.from({ length: ADDITIONAL_TRIVIAL_UNITS }, () => firstGroup.keys[0])
		);
	}

	const units = groups.map((g) => g.keys.length);
	const totalUnits = units.reduce((a, b) => a + b, 0);
	const percentages = units.map((u) => (u / totalUnits) * 100);

	let acc = 0;

	return groups.map((group, i) => {
		const min = acc;
		const width = percentages[i];
		let max = min + width;

		if (i === groups.length - 1) max = 100;

		acc = max;

		return {
			...group,
			min,
			max,
			width: max - min,
			color: colors[i % colors.length],
		};
	});
}

export function ThreatTracker({
	budget = ExperienceBudget.Moderate,
	partySize = 4,
}: ThreatTrackerProps) {
	const threatEntries = Object.entries(THREAT_TYPE).map(([key, label]) => [
		parseInt(key),
		label,
	]) as [number, string][];
	const merged = getMergedThresholds(threatEntries);

	const normalizedValue = Math.max(
		0,
		Math.min(
			100,
			((budget.valueOf() ?? 0) /
				((12 + ADDITIONAL_IMPOSSIBLE_UNITS + ADDITIONAL_TRIVIAL_UNITS) * 20)) *
				100
		)
	);

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

	const achievedThreat = Threat.fromExperienceBudget(budget, partySize);
	const currentThresholdIdx = merged.findIndex((group) =>
		group.keys.includes(Number(achievedThreat.threat))
	);

	const distance = isSmall ? 1 : 2;
	const start = Math.max(0, currentThresholdIdx - distance);
	const end = Math.min(merged.length - 1, currentThresholdIdx + distance);

	let visibleThresholds = merged.slice(start, end + 1);

	const lastIdx = merged.length - 1;
	const lastVisibleIdx = visibleThresholds.length - 1;
	const lastVisibleIsLast =
		merged.indexOf(visibleThresholds[lastVisibleIdx]) === lastIdx;
	const lastIsCurrent = currentThresholdIdx === lastIdx;

	const TRIMMED_SEGMENT_PCT = isSmall ? 75 : 15;

	let visibleMin = visibleThresholds[0].min;
	let visibleMax = visibleThresholds[visibleThresholds.length - 1].max;

	if (lastVisibleIsLast && !lastIsCurrent) {
		const prev = visibleThresholds[lastVisibleIdx - 1];
		visibleMax =
			prev.max +
			(visibleThresholds[lastVisibleIdx].max - prev.max) *
				(TRIMMED_SEGMENT_PCT / 100);
		visibleThresholds = [
			...visibleThresholds.slice(0, -1),
			{
				...visibleThresholds[lastVisibleIdx],
				min: prev.max,
				max: visibleMax,
				width: visibleMax - prev.max,
			},
		];
	}

	const scaledValue =
		((normalizedValue - visibleMin) / (visibleMax - visibleMin)) * 100;

	return (
		<div ref={containerRef} className="relative h-8 w-full overflow-visible" title={`${achievedThreat.toLabel()} — ${budget.valueOf()} XP`}>
			<Progress value={scaledValue} className="h-3" />
			<div className="absolute inset-0 flex h-3 w-full pointer-events-none">
				{visibleThresholds.map((t, i) => {
					const left =
						((t.min - visibleMin) / (visibleMax - visibleMin)) * 100;
					const width =
						((t.max - t.min) / (visibleMax - visibleMin)) * 100;

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
			<div className="absolute left-0 w-full h-5 pointer-events-none">
				{visibleThresholds.map((t, i) => {
					const left =
						((t.min - visibleMin) / (visibleMax - visibleMin)) * 100;
					const width =
						((t.max - t.min) / (visibleMax - visibleMin)) * 100;
					const isCurrent = merged.indexOf(t) === currentThresholdIdx;
					const label = isCurrent ? achievedThreat.toLabel() : t.baseLabel;

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
