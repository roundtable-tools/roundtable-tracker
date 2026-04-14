import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { trackerMockData } from './mockData';

export function InitiativePlayerViewPage() {
	return (
		<main className="mx-auto w-full max-w-4xl space-y-4 p-4 lg:p-6">
			<header className="rounded-xl border bg-card p-4">
				<h1 className="text-2xl font-semibold tracking-tight">
					{trackerMockData.encounterTitle}
				</h1>
				<p className="text-sm text-muted-foreground">Player Initiative View</p>
			</header>

			<Card className="p-4">
				<h2 className="mb-3 text-base font-semibold">Initiative Order</h2>
				<div className="space-y-2">
					{trackerMockData.initiativeParticipants.map((participant, index) => (
						<div
							key={participant.id}
							className="flex items-center justify-between rounded-md border px-3 py-2"
						>
							<div>
								<p className="text-sm font-medium">
									{index + 1}. {participant.name}
								</p>
								<p className="text-xs text-muted-foreground">
									{participant.state === 'delayed' ? 'Delayed' : 'Ready'}
								</p>
							</div>
							<Badge variant="secondary">{participant.hpLabel}</Badge>
						</div>
					))}
				</div>
			</Card>

			<Card className="p-4">
				<h2 className="mb-2 text-base font-semibold">Encounter Description</h2>
				<p className="text-sm text-muted-foreground">{trackerMockData.description}</p>
			</Card>
		</main>
	);
}
