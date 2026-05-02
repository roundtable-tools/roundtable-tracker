import { AppHeader } from '@/AppHeader';
import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { BuilderPage } from '@/components/BuilderPage/BuilderPage';

export const builderSearchSchema = z.object({
	templateId: z.string().optional(),
	templateVariantId: z.string().optional(),
	encounterId: z.string().optional(),
	importDraftId: z.string().optional(),
	templateLevel: z.coerce.number().int().optional(),
	templatePartySize: z.coerce.number().int().positive().optional(),
});

export type BuilderSearch = z.infer<typeof builderSearchSchema>;

export const validateBuilderSearch = (search: unknown): BuilderSearch =>
	builderSearchSchema.parse(search);

export const Route = createFileRoute('/builder')({
	validateSearch: validateBuilderSearch,
	component: BuilderRouteComponent,
});

export function BuilderRouteComponent() {
	const {
		encounterId,
		importDraftId,
		templateId,
		templateVariantId,
		templateLevel,
		templatePartySize,
	} = Route.useSearch();

	return (
		<>
			<AppHeader setView={() => {}} />
			<BuilderPage
				encounterId={encounterId}
				importDraftId={importDraftId}
				templateId={templateId}
				templateVariantId={templateVariantId}
				templateLevel={templateLevel}
				templatePartySize={templatePartySize}
			/>
		</>
	);
}
