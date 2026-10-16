import { Fragment, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
									<Badge
										variant="secondary"
										className="min-w-20 justify-center"
									>
										{participant.hpLabel}
									</Badge>
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
