import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
	isEncounterRunning,
	usePlayerViewSnapshot,
} from '@/store/playerViewSync';
import {
	encounterToTrackerHeader,
	runtimeToPlayerInitiativeQueue,
} from '@/store/trackerMappers';

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
							className="flex items-center justify-between rounded-md border px-3 py-2"
						>
							<div>
								<p className="text-sm font-medium">
									{index + 1}. {participant.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{participant.status}
								</p>
							</div>
							<Badge variant="secondary">{participant.hpLabel}</Badge>
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
