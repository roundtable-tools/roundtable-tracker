import { AlternativeList } from '@/components/InitiativeList/AlternativeList';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/initaitive2')({
	component: RouteComponent,
});

function RouteComponent() {
	return <AlternativeList />;
}
