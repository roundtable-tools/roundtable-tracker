import { BuilderForm } from '@/components/BuilderForm/BuilderForm';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/builder')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<BuilderForm />
		</>
	);
}
