import { useMemo } from 'react';
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
	runtimeToPlayerInitiativeQueue,
	type PlayerTrackerParticipant,
} from '@/store/trackerMappers';
import { getSideAccent } from './sideAccent';

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
			<header className="rounded-xl border bg-card p-4">
				<h1 className="text-2xl font-semibold tracking-tight">
					{trackerHeader?.encounterTitle ?? 'Initiative Tracker'}
				</h1>
				<p className="text-sm text-muted-foreground">Player Initiative View</p>
			</header>

			<Card className="p-4">
				<h2 className="mb-3 text-base font-semibold">Initiative Order</h2>
				<div className="space-y-2">
					{initiativeParticipants.map((participant, index) => (
						<div
							key={participant.id}
							className={`flex items-center justify-between rounded-md border px-3 py-2 ${getSideAccent(participant.sideTheme).inactiveMarker}`}
						>
							<p
								className={`text-sm font-medium ${getSideAccent(participant.sideTheme).name}`}
							>
								{participant.status === 'Delayed'
									? participant.name
									: `${index + 1}. ${participant.name}`}
							</p>
							<div className="flex items-center gap-2">
								<PlayerStatusGroup status={participant.status} />
								<Badge variant="secondary" className="min-w-20 justify-center">
									{participant.hpLabel}
								</Badge>
							</div>
						</div>
					))}
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
