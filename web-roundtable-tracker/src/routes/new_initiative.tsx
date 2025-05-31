import { NewInitiative } from '@/components/InitiativeList/NewInitative';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/new_initiative')({
	component: RouteComponent,
});

function RouteComponent() {
	return <NewInitiative />;
}
