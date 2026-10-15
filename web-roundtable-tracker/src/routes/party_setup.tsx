import { createFileRoute } from '@tanstack/react-router';
import { PartyDirectory } from '@/components/PartyDirectory/PartyDirectory';

export const Route = createFileRoute('/party_setup')({
	component: RouteComponent,
});

function RouteComponent() {
	return <PartyDirectory />;
}
