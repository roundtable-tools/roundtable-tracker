import { InitiativeTrackerPage } from '@/components/InitiativeTracker/InitiativeTrackerPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/initiative_tracker')({
	component: RouteComponent,
	loader: () => ({
		crumb: 'Initiative Tracker',
	}),
});

function RouteComponent() {
	return <InitiativeTrackerPage />;
}
