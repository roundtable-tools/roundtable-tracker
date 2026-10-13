import { Progress } from '@/components/ui/progress';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { Threat } from '@/models/utility/threat/Threat.class';
import type {
	EncounterThreatSimulation,
	EncounterWaveInteraction,
} from './builderXp';
import { useEffect, useRef, useState } from 'react';

interface ThreatTrackerProps {
	budget?: ExperienceBudget;
	comparisonBudget?: ExperienceBudget;
	primaryBudgetLabel?: string;
	comparisonBudgetLabel?: string;
	partySize?: number;
	waveInteraction?: EncounterWaveInteraction;
	simulation?: EncounterThreatSimulation | null;
}

const ADDITIONAL_IMPOSSIBLE_UNITS = 3;

type ThresholdGroup = {
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

export function ThreatTracker({
	budget = ExperienceBudget.Moderate,
	comparisonBudget,
	primaryBudgetLabel = 'Effective XP',
	comparisonBudgetLabel = 'Raw XP',
	partySize = 4,
	waveInteraction,
	simulation,
}: ThreatTrackerProps) {
	const merged = getMergedThresholds(partySize);

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
	// Same function as the saved difficulty, so the bar and the saved encounter
	// always agree.
	const currentThreat = Threat.fromExperienceBudget(budget, partySize);
	const currentThresholdIdx = Math.max(
		0,
		merged.findIndex((group) => group.keys.includes(currentThreat.threat))
	);
	const currentDisplayLabel = currentThreat.toLabel();
	const comparisonDisplayLabel = comparisonBudget
		? Threat.fromExperienceBudget(comparisonBudget, partySize).toLabel()
		: undefined;

	const distance = isSmall ? 1 : 3;
	const start = Math.max(0, currentThresholdIdx - distance);
	const end = Math.min(merged.length - 1, currentThresholdIdx + distance);

	let visibleThresholds = merged.slice(start, end + 1);

	// If XP exceeds the Impossible threshold's max, show only Impossible
	const lastIdx = merged.length - 1;
	const impossibleThreshold = merged[lastIdx];

	if (impossibleThreshold && currentBudgetXp > impossibleThreshold.maxXp) {
		visibleThresholds = [impossibleThreshold];
	}

	const lastVisibleIdx = visibleThresholds.length - 1;
	const lastVisibleIsLast =
		merged.indexOf(visibleThresholds[lastVisibleIdx]) === lastIdx;
	const lastIsCurrent = currentThresholdIdx === lastIdx;

	const TRIMMED_SEGMENT_PCT = isSmall ? 75 : 15;

	const visibleMin = visibleThresholds[0].minXp;
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
	const simulationMaxStack = Math.max(
		1,
		...(simulation?.history.map((point) => point.totalDisplay) ?? [0])
	);

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<div
					ref={containerRef}
					className="relative h-10 w-full overflow-visible"
				>
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
					<Progress
						value={Math.max(0, Math.min(100, scaledValue))}
						className="h-4"
					/>
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
			</HoverCardTrigger>
			<HoverCardContent className="w-fit">
				<div className="space-y-2 text-xs">
					<div>
						<span className="font-semibold">{primaryBudgetLabel}:</span>{' '}
						{currentDisplayLabel} - {budget.valueOf()} XP
					</div>
					{comparisonBudget && comparisonDisplayLabel ? (
						<div>
							<span className="font-semibold">{comparisonBudgetLabel}:</span>{' '}
							{comparisonDisplayLabel} - {comparisonBudget.valueOf()} XP
						</div>
					) : null}
					{simulation && simulation.history.length > 0 ? (
						<div className="space-y-1 border-t border-gray-300 pt-1">
							<div className="font-semibold">Threat by Round</div>
							<div className="w-[min(78vw,28rem)]">
								<div className="flex h-28 items-end rounded border bg-muted/25 p-2">
									{simulation.history.map((point) => {
										const wave0Height =
											(point.wave0 / simulationMaxStack) * 100;
										const wave1Height =
											(point.wave1 / simulationMaxStack) * 100;
										const attritionHeight =
											(point.attrition / simulationMaxStack) * 100;

										return (
											<div
												key={point.round}
												className="flex min-w-0 flex-1 flex-col items-center"
											>
												<div className="relative flex h-full w-full items-end justify-center">
													<div className="flex h-20 w-full flex-col justify-end border-r border-border/40 last:border-r-0">
														<div
															className="bg-blue-500/80"
															style={{ height: `${wave0Height}%` }}
														/>
														<div
															className="bg-amber-400/90"
															style={{ height: `${wave1Height}%` }}
														/>
														<div
															className="bg-rose-500/85"
															style={{ height: `${attritionHeight}%` }}
														/>
													</div>
													<span className="absolute -top-5 text-[10px] text-muted-foreground">
														{point.totalDisplay}
													</span>
												</div>
												<span className="mt-1 text-[10px] text-muted-foreground">
													R{point.round}
												</span>
											</div>
										);
									})}
								</div>
								<div className="flex gap-3 text-[10px] text-muted-foreground">
									<span className="inline-flex items-center gap-1">
										<span className="h-2 w-2 rounded-sm bg-blue-500/80" />
										Main Forces
									</span>
									<span className="inline-flex items-center gap-1">
										<span className="h-2 w-2 rounded-sm bg-amber-400/90" />
										Reinforcements
									</span>
									<span className="inline-flex items-center gap-1">
										<span className="h-2 w-2 rounded-sm bg-rose-500/85" />
										Attrition
									</span>
								</div>
							</div>
						</div>
					) : null}
					{waveInteraction && waveInteraction.wave1 ? (
						<div className="border-t border-gray-300 pt-1 mt-1">
							<div className="font-semibold">Wave Threat Changes:</div>
							<div>
								Wave 0: {waveInteraction.wave0.adjustmentPercent > 0 ? '+' : ''}
								{waveInteraction.wave0.adjustmentPercent.toFixed(0)}%
							</div>
							<div>
								Wave 1: {waveInteraction.wave1.adjustmentPercent > 0 ? '+' : ''}
								{waveInteraction.wave1.adjustmentPercent.toFixed(0)}%
							</div>
						</div>
					) : null}
				</div>
			</HoverCardContent>
		</HoverCard>
	);
}
