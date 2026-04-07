import { AppHeader } from '@/AppHeader';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { BuilderPage } from '@/components/BuilderPage/BuilderPage';

export const builderSearchSchema = z.object({
	templateId: z.string().optional(),
	encounterId: z.string().optional(),
});

export type BuilderSearch = z.infer<typeof builderSearchSchema>;

export const validateBuilderSearch = (search: unknown): BuilderSearch =>
	builderSearchSchema.parse(search);

export const Route = createFileRoute('/builder')({
	validateSearch: validateBuilderSearch,
	component: BuilderRouteComponent,
});

export function BuilderRouteComponent() {
	const { encounterId } = Route.useSearch();
	return (
		<>
			<AppHeader setView={() => {}} />
			<BuilderPage encounterId={encounterId} />
		</>
	);
}
