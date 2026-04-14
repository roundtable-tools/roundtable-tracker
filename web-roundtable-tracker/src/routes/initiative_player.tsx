import { InitiativePlayerViewPage } from '@/components/InitiativeTracker/InitiativePlayerViewPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/initiative_player')({
	component: RouteComponent,
	loader: () => ({
		crumb: 'Initiative Player',
	}),
});

function RouteComponent() {
	return <InitiativePlayerViewPage />;
}
