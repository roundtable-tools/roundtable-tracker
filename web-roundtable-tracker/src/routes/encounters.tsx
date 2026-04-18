import { EncounterDirectory } from '@/components/EncounterDirectory/EncounterDirectory';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/encounters')({
	component: RouteComponent,
});

function RouteComponent() {
	return <EncounterDirectory setView={() => {}} />;
}
