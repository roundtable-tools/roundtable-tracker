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

// Colour of the filled segments by how many are filled: green when all are,
// one step closer to red for each segment lost.
const HP_SEGMENT_COLORS: Record<number, string> = {
	5: 'bg-green-500',
	4: 'bg-lime-500',
	3: 'bg-yellow-400',
	2: 'bg-orange-500',
	1: 'bg-red-500',
};

/**
 * HP as a bar of equal segments with the coarse label centred under it.
 * Without HP data the bar stays empty.
 */
function PlayerHealthBar({
	segments,
	label,
}: {
	segments: number | null;
	label: string;
}) {
	const filled = segments ?? 0;
	const fillColor = HP_SEGMENT_COLORS[filled] ?? '';

	return (
		<div className="flex w-24 flex-col items-center gap-1">
			<div
				role="meter"
				aria-label="Health"
				aria-valuemin={0}
				aria-valuemax={PLAYER_HP_SEGMENTS}
				aria-valuenow={filled}
				aria-valuetext={label}
				className="flex w-full gap-0.5"
			>
				{Array.from({ length: PLAYER_HP_SEGMENTS }, (_, index) => (
					<span
						key={index}
						className={`h-2 flex-1 rounded-sm ${index < filled ? fillColor : 'bg-muted'}`}
					/>
				))}
			</div>
			<span className="text-xs text-muted-foreground">{label}</span>
		</div>
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
									<PlayerHealthBar
										segments={participant.hpSegments}
										label={participant.hpLabel}
									/>
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
