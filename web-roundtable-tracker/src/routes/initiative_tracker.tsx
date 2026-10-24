import { InitiativeTrackerPage } from '@/components/InitiativeTracker/InitiativeTrackerPage';
import { getEncounterStore } from '@/store/encounterRuntimeInstance';
import { isEncounterRunning } from '@/store/playerViewSync';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/initiative_tracker')({
	component: RouteComponent,
	beforeLoad: () => {
		if (!isEncounterRunning(getEncounterStore().getState())) {
			throw redirect({ to: '/preview' });
		}
	},
});

function RouteComponent() {
	return <InitiativeTrackerPage />;
}
