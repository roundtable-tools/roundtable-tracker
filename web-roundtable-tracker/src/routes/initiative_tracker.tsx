import { InitiativeTrackerPage } from '@/components/InitiativeTracker/InitiativeTrackerPage';
import { getEncounterStore } from '@/store/encounterRuntimeInstance';
import { createFileRoute, redirect } from '@tanstack/react-router';

const hasHydratedEncounterRuntime = () => {
	const state = getEncounterStore().getState();

	return (
		Boolean(state.encounterData) &&
		(state.charactersOrder.length > 0 || state.delayedOrder.length > 0)
	);
};

export const Route = createFileRoute('/initiative_tracker')({
	component: RouteComponent,
	beforeLoad: () => {
		if (!hasHydratedEncounterRuntime()) {
			throw redirect({ to: '/preview' });
		}
	},
	loader: () => ({
		crumb: 'Initiative Tracker',
	}),
});

function RouteComponent() {
	return <InitiativeTrackerPage />;
}
