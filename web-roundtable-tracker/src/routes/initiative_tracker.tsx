import { InitiativeTrackerPage } from '@/components/InitiativeTracker/InitiativeTrackerPage';
import { trackerMockData } from '@/components/InitiativeTracker/mockData';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/initiative_tracker')({
	component: RouteComponent,
	loader: () => ({
		crumb: 'Initiative Tracker',
		encounterHeader: {
			title: trackerMockData.encounterTitle,
			threatLevel: trackerMockData.threatLevel,
			turnTimers: trackerMockData.turnTimers,
		},
	}),
});

function RouteComponent() {
	return <InitiativeTrackerPage />;
}
