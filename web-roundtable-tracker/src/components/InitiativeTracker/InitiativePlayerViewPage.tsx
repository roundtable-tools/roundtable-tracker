import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import {
	encounterToTrackerHeader,
	runtimeToPlayerInitiativeQueue,
} from '@/store/trackerMappers';

export function InitiativePlayerViewPage() {
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);
	const delayedOrder = useEncounterStore((state) => state.delayedOrder);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const trackerMetaMap = useEncounterStore((state) => state.trackerMetaMap);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const round = useEncounterStore((state) => state.round);

	const initiativeParticipants = useMemo(
		() =>
			runtimeToPlayerInitiativeQueue({
				charactersOrder,
				delayedOrder,
				charactersMap,
				trackerMetaMap,
			}),
		[charactersOrder, delayedOrder, charactersMap, trackerMetaMap],
	);

	const trackerHeader = useMemo(
		() =>
			encounterData
				? encounterToTrackerHeader(encounterData, partyLevel, round)
				: null,
		[encounterData, partyLevel, round],
	);

	const encounterDescription = useMemo(() => {
		if (!encounterData) {
			return '';
		}

		return encounterData.description;
	}, [encounterData]);

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
								<p className="text-xs text-muted-foreground">{participant.status}</p>
							</div>
							<Badge variant="secondary">{participant.hpLabel}</Badge>
						</div>
					))}
					{initiativeParticipants.length === 0 ? (
						<p className="text-sm text-muted-foreground">No visible participants in initiative.</p>
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
