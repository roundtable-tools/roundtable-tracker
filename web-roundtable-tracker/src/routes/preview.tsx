import { PreviewDisplay } from '@/components/PreviewDisplay/PreviewDisplay';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/preview')({
	component: RouteComponent,
});

function RouteComponent() {
	return <PreviewDisplay setView={() => {}} />;
}
