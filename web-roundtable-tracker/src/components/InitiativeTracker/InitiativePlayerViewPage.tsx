import { Fragment, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';
import { Clock3, PowerOff, Skull } from 'lucide-react';
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
import { getHazardStripe, getSideAccent } from './sideAccent';
import { type EncounterTimer, formatDuration } from '@/store/encounterTimer';
import { TurnTimeChip } from './TurnTimeChip';
import { useTimerElapsed } from './useTimerElapsed';
import { NextRoundMarkerCard } from './NextRoundMarkerCard';
import { getRoundBoundaryIndex } from './roundBoundary';

const DELAYED_OPTION = {
	status: 'Delayed',
	Icon: Clock3,
	pressedClassName:
		'data-[state=on]:bg-amber-500/25 data-[state=on]:text-amber-200',
} as const;

const OUT_OF_FIGHT_PRESSED_CLASS =
	'data-[state=on]:bg-red-600/30 data-[state=on]:text-red-200';

// Creatures are knocked out, hazards disabled.
const PLAYER_STATUS_OPTIONS = {
	creature: [
		DELAYED_OPTION,
		{
			status: 'Knocked Out',
			Icon: Skull,
			pressedClassName: OUT_OF_FIGHT_PRESSED_CLASS,
		},
	],
	hazard: [
		DELAYED_OPTION,
		{
			status: 'Disabled',
			Icon: PowerOff,
			pressedClassName: OUT_OF_FIGHT_PRESSED_CLASS,
		},
	],
} as const;

/**
 * What a row's status group and bar sit on: the current participant's
 * coloured card, a hazard's stripes, or a plain row. On the coloured card
 * they get a see-through dark backing, so segment colours stay readable on
 * any side colour; on stripes a solid one.
 */
type RowSurface = 'current' | 'current-striped' | 'striped' | 'plain';

const SURFACE_STYLES: Record<
	RowSurface,
	{ box: string; idle: string; empty: string; label: string }
> = {
	current: {
		box: 'border-white/25 bg-black/50',
		idle: 'text-white/60',
		empty: 'bg-neutral-700',
		label: 'text-white',
	},
	'current-striped': {
		box: 'border-white/25 bg-black/60',
		idle: 'text-white/60',
		empty: 'bg-neutral-700',
		label: 'text-white',
	},
	striped: {
		box: 'border-input bg-card',
		idle: 'text-muted-foreground/40',
		empty: 'bg-muted',
		label: 'text-muted-foreground',
	},
	plain: {
		box: 'border-input',
		idle: 'text-muted-foreground/40',
		empty: 'bg-muted',
		label: 'text-muted-foreground',
	},
};

/**
 * Shows Delayed and Knocked Out (Disabled for a hazard) as a group with at
 * most one option pressed.
 * Ready is the default, so it has no option and leaves both unpressed. The
 * group only displays the status; players can't change it.
 */
function PlayerStatusGroup({
	status,
	isHazard,
	surface,
}: {
	status: PlayerTrackerParticipant['status'];
	isHazard: boolean;
	surface: RowSurface;
}) {
	const styles = SURFACE_STYLES[surface];

	return (
		<div
			role="group"
			aria-label="Status"
			className={`inline-flex items-center overflow-hidden rounded-md border ${styles.box}`}
		>
			{PLAYER_STATUS_OPTIONS[isHazard ? 'hazard' : 'creature'].map(
				({ status: option, Icon, pressedClassName }) => (
					<Toggle
						key={option}
						size="sm"
						pressed={status === option}
						aria-label={option}
						title={option}
						tabIndex={-1}
						className={`pointer-events-none rounded-none ${styles.idle} ${pressedClassName}`}
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
	surface,
}: {
	name: string;
	total: number;
	filled: number;
	fillClassName?: string;
	fillColor?: string;
	fillFrom?: 'left' | 'right';
	label: string;
	surface: RowSurface;
}) {
	const styles = SURFACE_STYLES[surface];
	const isFilled = (index: number) =>
		fillFrom === 'left' ? index < filled : index >= total - filled;

	return (
		<div
			className={`flex w-28 flex-col items-center gap-1 rounded-md px-2 py-1 ${surface === 'plain' ? '' : styles.box}`}
		>
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
						className={`h-2 flex-1 rounded-sm ${isFilled(index) ? fillClassName : styles.empty}`}
						style={
							isFilled(index) && fillColor
								? { backgroundColor: fillColor }
								: undefined
						}
					/>
				))}
			</div>
			<span className={`text-xs ${styles.label}`}>{label}</span>
		</div>
	);
}

/**
 * A hazard that needs disable checks shows one segment per check; anyone else
 * shows HP in tiers. Without HP data the HP bar stays empty.
 */
function PlayerProgressBar({
	participant,
	surface,
}: {
	participant: PlayerTrackerParticipant;
	surface: RowSurface;
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
				surface={surface}
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
			surface={surface}
		/>
	);
}

/** The round time, counting up; ticks on its own, not the page. */
function RoundTime({ timer }: { timer: EncounterTimer | null }) {
	const elapsed = useTimerElapsed(timer);

	return <>{elapsed ? formatDuration(elapsed.roundMs) : '--:--'}</>;
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
	// GM and monster notes stay with the GM; only player notes are shown.
	const playerNotes = encounter.encounterData?.notes?.player?.trim() ?? '';

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
					<div>
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">
							{encounter.timer?.pausedAt != null ? 'Paused' : 'Round Time'}
						</dt>
						<dd
							data-slot="player-round-time"
							className={`text-2xl font-semibold tabular-nums ${encounter.timer?.pausedAt != null ? 'text-muted-foreground' : ''}`}
						>
							<RoundTime timer={encounter.timer} />
						</dd>
					</div>
				</dl>
			</header>

			<Card className="p-4">
				<h2 className="mb-3 text-base font-semibold">Initiative Order</h2>
				<div className="space-y-2">
					{initiativeParticipants.map((participant, index) => {
						const accent = getSideAccent(participant.sideTheme);
						// The tracker's current participant is the first in the order.
						const isCurrent = participant.id === encounter.charactersOrder[0];
						const surface: RowSurface = isCurrent
							? participant.isHazard
								? 'current-striped'
								: 'current'
							: participant.isHazard
								? 'striped'
								: 'plain';

						return (
							<Fragment key={participant.id}>
								{index === roundBoundaryIndex && (
									<NextRoundMarkerCard nextRound={encounter.round + 1} />
								)}
								<div
									data-slot="player-participant"
									aria-current={isCurrent ? 'step' : undefined}
									className={[
										'flex items-center justify-between rounded-md border',
										isCurrent
											? `px-4 py-4 ${accent.activeCard}`
											: `mx-4 px-3 py-2 ${accent.inactiveMarker}`,
										participant.isHazard
											? getHazardStripe(participant.sideTheme)
											: '',
									].join(' ')}
								>
									<div className="min-w-0 flex-1 pr-3">
										<p
											data-slot="player-participant-name"
											className={`truncate ${
												isCurrent
													? 'text-lg font-semibold'
													: `text-sm font-medium ${accent.name}`
											}`}
										>
											{participant.name}
										</p>
										{isCurrent && (
											<TurnTimeChip
												timer={encounter.timer}
												className="text-sm text-current/85"
											/>
										)}
									</div>
									<div className="flex shrink-0 items-center gap-2">
										<PlayerStatusGroup
											status={participant.status}
											isHazard={participant.isHazard}
											surface={surface}
										/>
										<PlayerProgressBar
											participant={participant}
											surface={surface}
										/>
									</div>
								</div>
							</Fragment>
						);
					})}
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
				<p className="whitespace-pre-line text-sm text-muted-foreground">
					{encounterDescription || 'No encounter description available.'}
				</p>
			</Card>

			{playerNotes && (
				<Card className="p-4">
					<h2 className="mb-2 text-base font-semibold">Player Notes</h2>
					<p className="whitespace-pre-line text-sm text-muted-foreground">
						{playerNotes}
					</p>
				</Card>
			)}
		</main>
	);
}
