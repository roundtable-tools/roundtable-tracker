import { Progress } from '@/components/ui/progress';
import {
	HoverCard,
	HoverCardContent,
	HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { THREAT_TYPE, Threat } from '@/models/utility/threat/Threat.class';
import type {
	EncounterThreatSimulation,
	EncounterWaveInteraction,
} from './builderXp';
import { useEffect, useRef, useState } from 'react';

interface ThreatTrackerProps {
	budget?: ExperienceBudget | number;
	rawXpBudget?: ExperienceBudget | number;
	comparisonBudget?: ExperienceBudget | number;
	primaryBudgetLabel?: string;
	comparisonBudgetLabel?: string;
	partySize?: number;
	partyLevels?: number[];
	partyRelativeLevels?: number[];
	waveInteraction?: EncounterWaveInteraction;
	simulation?: EncounterThreatSimulation | null;
	xpBasisLevel?: number;
	challengePointBasisLevel?: number;
	challengePointTierLabel?: string;
	challengePointPerCharacter?: number[];
	inferredChallengePointPartySize?: number;
	chpDisplayMultiplier?: number;
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

type ThreatDisplayMode = 'xp' | 'chp';

function normalizeChpDisplayMultiplier(value: number): number {
	return Number.isFinite(value) && value > 0 ? value : 1;
}

function toChallengePointsFromRelativeLevel(relativeLevel: number): number {
	const normalizedDelta = Math.max(0, Math.trunc(relativeLevel));

	if (normalizedDelta === 0) {
		return 2;
	}

	if (normalizedDelta === 1) {
		return 3;
	}

	if (normalizedDelta === 2) {
		return 4;
	}

	return 6;
}

// eslint-disable-next-line react-refresh/only-export-components
export function toChpDisplayMultiplierFromRelativeLevels(
	relativeLevels: number[]
): number {
	if (relativeLevels.length === 0) {
		return 1;
	}

	const totalChallengePoints = relativeLevels.reduce(
		(sum, relativeLevel) =>
			sum + toChallengePointsFromRelativeLevel(relativeLevel),
		0
	);

	return totalChallengePoints / (relativeLevels.length * 2);
}

// eslint-disable-next-line react-refresh/only-export-components
export function toModeScaledThresholdXp(
	xpValue: number,
	displayMode: ThreatDisplayMode,
	chpDisplayMultiplier: number
): number {
	if (displayMode === 'xp') {
		return xpValue;
	}

	const normalizedMultiplier =
		normalizeChpDisplayMultiplier(chpDisplayMultiplier);

	return Math.round(xpValue * normalizedMultiplier * 10) / 10;
}

const CHARACTER_ADJUSTMENT_BY_THREAT: Record<string, number> = {
	Trivial: 15,
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
	const adjustedValue = adjustment * (partySize - 4);
	const roundedAdjustment = Math.floor(adjustedValue / 10) * 10;

	return Math.max(0, baseXp + roundedAdjustment);
}

function toRoundedChp(xpValue: number): number {
	return Math.ceil(xpValue / 5) / 4;
}

function resolveBudgetValue(budget?: ExperienceBudget | number): number {
	if (typeof budget === 'number') {
		return Number.isFinite(budget) ? budget : 0;
	}

	return budget?.valueOf() ?? 0;
}

// eslint-disable-next-line react-refresh/only-export-components
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
			...group.keys.map((key) =>
				getAdjustedXpForThreat(key, group.baseLabel, partySize)
			)
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
		const firstAdjustment = getCharacterAdjustmentForThreat(
			firstThreshold.baseLabel
		);
		const lastAdjustment = getCharacterAdjustmentForThreat(
			lastThreshold.baseLabel
		);

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
	rawXpBudget,
	comparisonBudget,
	primaryBudgetLabel = 'Effective XP',
	comparisonBudgetLabel = 'Raw XP',
	partySize = 4,
	partyLevels = [],
	partyRelativeLevels = [],
	waveInteraction,
	simulation,
	xpBasisLevel,
	challengePointBasisLevel,
	challengePointTierLabel,
	challengePointPerCharacter = [],
	inferredChallengePointPartySize,
	chpDisplayMultiplier = 1,
}: ThreatTrackerProps) {
	const resolvedChpDisplayMultiplier =
		partyRelativeLevels.length > 0
			? toChpDisplayMultiplierFromRelativeLevels(partyRelativeLevels)
			: chpDisplayMultiplier;
	const [displayMode, setDisplayMode] = useState<ThreatDisplayMode>('xp');
	const stripThreatSuffix = (label: string): string =>
		label.replace(/(\+|-)+$/g, '').trim();
	const toModeThresholdXp = (xpValue: number): number =>
		toModeScaledThresholdXp(xpValue, displayMode, resolvedChpDisplayMultiplier);
	const toDisplayChp = (xpValue: number): number => toRoundedChp(xpValue);
	const formatThresholdTick = (value: number): string => {
		if (displayMode === 'xp') {
			return `${Math.round(value)}`;
		}

		return Number.isInteger(value) ? `${value}` : value.toFixed(1);
	};
	const formatDisplayBudget = (xpValue: number) =>
		displayMode === 'xp' ? `${xpValue} XP` : `${toDisplayChp(xpValue)} ChP`;

	const getDisplayLabelForBudget = (
		targetBudget: ExperienceBudget | number
	): string => {
		const rawBudget = resolveBudgetValue(targetBudget);
		const targetBudgetXp =
			displayMode === 'xp' ? rawBudget : toDisplayChp(rawBudget);
		const thresholdIdx = Math.max(
			0,
			merged.findIndex((group, index) => {
				const isLast = index === merged.length - 1;

				if (isLast) {
					return targetBudgetXp >= group.minXp;
				}

				return targetBudgetXp >= group.minXp && targetBudgetXp < group.maxXp;
			})
		);

		const thresholdLabel = merged[thresholdIdx]?.baseLabel ?? 'Trivial';
		const exactLabel = threatEntries
			.map(([key, label]) => ({
				label,
				xp:
					displayMode === 'xp'
						? toModeThresholdXp(
								new Threat({ threat: key as keyof typeof THREAT_TYPE })
									.toExpBudget(partySize)
									.valueOf()
							)
						: toDisplayChp(
								toModeThresholdXp(
									new Threat({ threat: key as keyof typeof THREAT_TYPE })
										.toExpBudget(partySize)
										.valueOf()
								)
							),
			}))
			.sort((a, b) => a.xp - b.xp)
			.reduce<string>((activeLabel, threat) => {
				if (targetBudgetXp >= threat.xp) {
					return threat.label;
				}

				return activeLabel;
			}, THREAT_TYPE[0]);

		const exactBaseLabel = stripThreatSuffix(exactLabel);

		return exactBaseLabel === thresholdLabel ? exactLabel : thresholdLabel;
	};

	const threatEntries = Object.entries(THREAT_TYPE).map(([key, label]) => [
		parseInt(key),
		label,
	]) as [number, string][];
	const mergedXpThresholds = getMergedThresholds(threatEntries, partySize).map(
		(threshold) => ({
			...threshold,
			minXp: toModeThresholdXp(threshold.minXp),
			maxXp: toModeThresholdXp(threshold.maxXp),
		})
	);
	const merged =
		displayMode === 'xp'
			? mergedXpThresholds
			: mergedXpThresholds.map((threshold, index) => {
					const challengeColors = [
						'bg-sky-300',
						'bg-sky-400',
						'bg-indigo-400',
						'bg-violet-500',
						'bg-fuchsia-600',
						'bg-purple-800',
					];

					return {
						...threshold,
						minXp: toDisplayChp(threshold.minXp),
						maxXp: toDisplayChp(threshold.maxXp),
						color: challengeColors[index % challengeColors.length],
					};
				});

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

	const currentBudgetXpRaw = resolveBudgetValue(budget);
	const currentBudgetXp =
		displayMode === 'xp'
			? currentBudgetXpRaw
			: toDisplayChp(currentBudgetXpRaw);
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
	const currentThresholdLabel =
		merged[currentThresholdIdx]?.baseLabel ?? 'Trivial';

	const exactThreatLabel = threatEntries
		.map(([key, label]) => ({
			label,
			xp:
				displayMode === 'xp'
					? toModeThresholdXp(
							new Threat({ threat: key as keyof typeof THREAT_TYPE })
								.toExpBudget(partySize)
								.valueOf()
						)
					: toDisplayChp(
							toModeThresholdXp(
								new Threat({ threat: key as keyof typeof THREAT_TYPE })
									.toExpBudget(partySize)
									.valueOf()
							)
						),
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
	const comparisonDisplayLabel = comparisonBudget
		? getDisplayLabelForBudget(comparisonBudget)
		: undefined;
	const currentBudgetChp = toDisplayChp(currentBudgetXpRaw);
	const rawBudgetXp = resolveBudgetValue(rawXpBudget ?? comparisonBudget);
	const comparisonBudgetRawXp = resolveBudgetValue(comparisonBudget);
	const comparisonBudgetChp = toDisplayChp(comparisonBudgetRawXp);

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
		...(simulation?.history.map((point) =>
			displayMode === 'xp'
				? point.totalDisplay
				: toDisplayChp(point.totalDisplay)
		) ?? [0])
	);

	return (
		<HoverCard>
			<HoverCardTrigger asChild>
				<div
					ref={containerRef}
					className="relative h-10 w-full overflow-visible"
				>
					<div className="absolute -top-9 right-0 z-10 flex items-center gap-1 rounded-md border bg-background p-1">
						<button
							type="button"
							onClick={() => setDisplayMode('xp')}
							className={`rounded px-2 py-1 text-[11px] font-medium ${displayMode === 'xp' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
						>
							XP
						</button>
						<button
							type="button"
							onClick={() => setDisplayMode('chp')}
							className={`rounded px-2 py-1 text-[11px] font-medium ${displayMode === 'chp' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
						>
							ChP
						</button>
					</div>
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
									{formatThresholdTick(t.minXp)}
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
						{currentDisplayLabel} - {formatDisplayBudget(currentBudgetXpRaw)}
					</div>
					<div>
						<span className="font-semibold">Converted:</span> {rawBudgetXp} XP /{' '}
						{currentBudgetChp} ChP
					</div>
					{comparisonBudget && comparisonDisplayLabel ? (
						<div>
							<span className="font-semibold">{comparisonBudgetLabel}:</span>{' '}
							{comparisonDisplayLabel} -{' '}
							{displayMode === 'xp'
								? `${comparisonBudgetRawXp} XP`
								: `${comparisonBudgetChp} ChP`}
						</div>
					) : null}
					<div className="text-muted-foreground">
						XP basis: level {xpBasisLevel ?? 'n/a'} • ChP tier:{' '}
						{challengePointTierLabel ?? 'n/a'} (basis level{' '}
						{challengePointBasisLevel ?? 'n/a'})
					</div>
					{partyLevels.length > 0 ? (
						<div className="text-muted-foreground">
							Party levels: {partyLevels.join(', ')}
							{partyRelativeLevels.length > 0
								? ` • relative: ${partyRelativeLevels.map((relativeLevel) => `${relativeLevel >= 0 ? '+' : ''}${relativeLevel}`).join(', ')}`
								: ''}
						</div>
					) : null}
					{challengePointPerCharacter.length > 0 ? (
						<div className="text-muted-foreground">
							Assumed ChP per character: {challengePointPerCharacter.join(', ')}
							{typeof inferredChallengePointPartySize === 'number'
								? ` • inferred party size: ${inferredChallengePointPartySize}`
								: ''}
						</div>
					) : null}
					{simulation && simulation.history.length > 0 ? (
						<div className="space-y-1 border-t border-gray-300 pt-1">
							<div className="font-semibold">Threat by Round</div>
							<div className="w-[min(78vw,28rem)]">
								<div className="flex h-28 items-end rounded border bg-muted/25 p-2">
									{simulation.history.map((point) => {
										const wave0Display =
											displayMode === 'xp'
												? point.wave0
												: toDisplayChp(point.wave0);
										const wave1Display =
											displayMode === 'xp'
												? point.wave1
												: toDisplayChp(point.wave1);
										const attritionDisplay =
											displayMode === 'xp'
												? point.attrition
												: toDisplayChp(point.attrition);
										const wave0Height =
											(wave0Display / simulationMaxStack) * 100;
										const wave1Height =
											(wave1Display / simulationMaxStack) * 100;
										const attritionHeight =
											(attritionDisplay / simulationMaxStack) * 100;

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
														{displayMode === 'xp'
															? point.totalDisplay
															: toDisplayChp(point.totalDisplay)}
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
