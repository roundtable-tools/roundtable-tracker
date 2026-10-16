import { Fragment, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Clock3, Skull } from 'lucide-react';
import {
	isEncounterRunning,
	usePlayerViewSnapshot,
} from '@/store/playerViewSync';
import {
	encounterToTrackerHeader,
	runtimeToInitiativeQueue,
	runtimeToPlayerInitiativeQueue,
	PLAYER_HP_SEGMENTS,
	type PlayerDisableProgress,
	type PlayerTrackerParticipant,
} from '@/store/trackerMappers';
import { getSideAccent } from './sideAccent';
import { NextRoundMarkerCard } from './NextRoundMarkerCard';
import { getRoundBoundaryIndex } from './roundBoundary';

const PLAYER_STATUS_OPTIONS = [
	{
		status: 'Delayed',
		Icon: Clock3,
		pressedClassName:
			'data-[state=on]:bg-amber-500/25 data-[state=on]:text-amber-200',
	},
	{
		status: 'Knocked Out',
		Icon: Skull,
		pressedClassName:
			'data-[state=on]:bg-red-600/30 data-[state=on]:text-red-200',
	},
] as const;

/**
 * Shows Delayed and Knocked Out as a group with at most one option pressed.
 * Ready is the default, so it has no option and leaves both unpressed. The
 * group only displays the status; players can't change it.
 */
function PlayerStatusGroup({
	status,
}: {
	status: PlayerTrackerParticipant['status'];
}) {
	return (
		<div
			role="group"
			aria-label="Status"
			className="inline-flex items-center overflow-hidden rounded-md border border-input"
		>
			{PLAYER_STATUS_OPTIONS.map(
				({ status: option, Icon, pressedClassName }) => (
					<Toggle
						key={option}
						size="sm"
						pressed={status === option}
						aria-label={option}
						title={option}
						tabIndex={-1}
						className={`pointer-events-none rounded-none text-muted-foreground/40 ${pressedClassName}`}
					>
						<Icon className="h-4 w-4" />
					</Toggle>
				)
			)}
		</div>
	);
}

// Colour of the filled HP segments by how many are filled: green when all
// are, one step closer to red for each segment lost.
const HP_SEGMENT_COLORS: Record<number, string> = {
	5: 'bg-green-500',
	4: 'bg-lime-500',
	3: 'bg-yellow-400',
	2: 'bg-orange-500',
	1: 'bg-red-500',
};

const STEEL_BLUE = [70, 130, 180] as const;
const BROWN = [139, 90, 43] as const;

// Colour of the filled disable-check segments: steel blue after the first
// check, turning brown as the share of checks made grows.
const getDisableSegmentColor = ({
	succeeded,
	required,
}: PlayerDisableProgress) => {
	const share = required > 1 ? (succeeded - 1) / (required - 1) : 1;
	const [red, green, blue] = STEEL_BLUE.map((from, index) =>
		Math.round(from + (BROWN[index] - from) * share)
	);

	return `rgb(${red} ${green} ${blue})`;
};

/**
 * A bar of equal segments with a label centred under it. `filled` segments
 * take the fill colour (a class or a CSS colour), counted from the left or,
 * with `fillFrom="right"`, from the right.
 */
function SegmentedBar({
	name,
	total,
	filled,
	fillClassName = '',
	fillColor,
	fillFrom = 'left',
	label,
}: {
	name: string;
	total: number;
	filled: number;
	fillClassName?: string;
	fillColor?: string;
	fillFrom?: 'left' | 'right';
	label: string;
}) {
	const isFilled = (index: number) =>
		fillFrom === 'left' ? index < filled : index >= total - filled;

	return (
		<div className="flex w-24 flex-col items-center gap-1">
			<div
				role="meter"
				aria-label={name}
				aria-valuemin={0}
				aria-valuemax={total}
				aria-valuenow={filled}
				aria-valuetext={label}
				className="flex w-full gap-0.5"
			>
				{Array.from({ length: total }, (_, index) => (
					<span
						key={index}
						className={`h-2 flex-1 rounded-sm ${isFilled(index) ? fillClassName : 'bg-muted'}`}
						style={
							isFilled(index) && fillColor
								? { backgroundColor: fillColor }
								: undefined
						}
					/>
				))}
			</div>
			<span className="text-xs text-muted-foreground">{label}</span>
		</div>
	);
}

/**
 * A hazard that needs disable checks shows one segment per check; anyone else
 * shows HP in tiers. Without HP data the HP bar stays empty.
 */
function PlayerProgressBar({
	participant,
}: {
	participant: PlayerTrackerParticipant;
}) {
	const { disableProgress, hpSegments, hpLabel } = participant;

	if (disableProgress) {
		return (
			<SegmentedBar
				name="Disable checks"
				total={disableProgress.required}
				filled={disableProgress.succeeded}
				fillColor={getDisableSegmentColor(disableProgress)}
				fillFrom="right"
				label={disableProgress.label}
			/>
		);
	}

	const filled = hpSegments ?? 0;

	return (
		<SegmentedBar
			name="Health"
			total={PLAYER_HP_SEGMENTS}
			filled={filled}
			fillClassName={HP_SEGMENT_COLORS[filled] ?? ''}
			label={hpLabel}
		/>
	);
}

// Reads the encounter only through the player view channel, so this page
// never writes to the GM's encounter store.
export function InitiativePlayerViewPage() {
	const snapshot = usePlayerViewSnapshot();
	const encounter = isEncounterRunning(snapshot) ? snapshot : null;

	const initiativeParticipants = useMemo(
		() => (encounter ? runtimeToPlayerInitiativeQueue(encounter) : []),
		[encounter]
	);

	// The player queue keeps the tracker's order, so the tracker's round
	// boundary applies to it unchanged.
	const roundBoundaryIndex = useMemo(
		() =>
			encounter
				? getRoundBoundaryIndex(
						runtimeToInitiativeQueue(encounter),
						encounter.charactersWithTurn
					)
				: 0,
		[encounter]
	);

	const trackerHeader = useMemo(
		() =>
			encounter?.encounterData
				? encounterToTrackerHeader(
						encounter.encounterData,
						encounter.partyLevel,
						encounter.round
					)
				: null,
		[encounter]
	);

	if (!encounter) {
		return (
			<main className="mx-auto w-full max-w-4xl p-4 lg:p-6">
				<Card className="p-8 text-center">
					<p className="text-lg text-muted-foreground">
						Waiting for the GM to start an encounter
					</p>
				</Card>
			</main>
		);
	}

	const encounterDescription = encounter.encounterData?.description ?? '';

	return (
		<main className="mx-auto w-full max-w-4xl space-y-4 p-4 lg:p-6">
			<header className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4">
				<div className="min-w-0">
					<h1 className="truncate text-2xl font-semibold tracking-tight">
						{trackerHeader?.encounterTitle ?? 'Initiative Tracker'}
					</h1>
					<p className="text-sm text-muted-foreground">
						Player Initiative View
					</p>
				</div>
				<dl className="flex shrink-0 gap-4 text-center">
					<div>
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">
							Round
						</dt>
						<dd className="text-2xl font-semibold tabular-nums">
							{encounter.round}
						</dd>
					</div>
					{/* Placeholder until the timer exists; it shows no time yet. */}
					<div>
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">
							Timer
						</dt>
						<dd className="text-2xl font-semibold tabular-nums text-muted-foreground">
							--:--
						</dd>
					</div>
				</dl>
			</header>

			<Card className="p-4">
				<h2 className="mb-3 text-base font-semibold">Initiative Order</h2>
				<div className="space-y-2">
					{initiativeParticipants.map((participant, index) => (
						<Fragment key={participant.id}>
							{index === roundBoundaryIndex && (
								<NextRoundMarkerCard nextRound={encounter.round + 1} />
							)}
							<div
								className={`flex items-center justify-between rounded-md border px-3 py-2 ${getSideAccent(participant.sideTheme).inactiveMarker}`}
							>
								<p
									className={`text-sm font-medium ${getSideAccent(participant.sideTheme).name}`}
								>
									{participant.name}
								</p>
								<div className="flex items-center gap-2">
									<PlayerStatusGroup status={participant.status} />
									<PlayerProgressBar participant={participant} />
								</div>
							</div>
						</Fragment>
					))}
					{initiativeParticipants.length > 0 &&
						roundBoundaryIndex === initiativeParticipants.length && (
							<NextRoundMarkerCard nextRound={encounter.round + 1} />
						)}
					{initiativeParticipants.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No visible participants in initiative.
						</p>
					) : null}
				</div>
			</Card>

			<Card className="p-4">
				<h2 className="mb-2 text-base font-semibold">Encounter Description</h2>
				<p className="text-sm text-muted-foreground">
					{encounterDescription || 'No encounter description available.'}
				</p>
			</Card>
		</main>
	);
}
