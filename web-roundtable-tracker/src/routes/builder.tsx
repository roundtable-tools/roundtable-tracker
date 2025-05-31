import { AppHeader } from '@/AppHeader';
import { createFileRoute } from '@tanstack/react-router';
import { PageContent } from 'grommet/components/PageContent';

export const Route = createFileRoute('/builder')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<AppHeader setView={() => {}} />
			<PageContent fill />
		</>
	);
}
