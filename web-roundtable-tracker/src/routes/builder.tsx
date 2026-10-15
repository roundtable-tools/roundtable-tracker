import { AppHeader } from '@/AppHeader';
import { createFileRoute } from '@tanstack/react-router';
import { BuilderPage } from '@/components/BuilderPage/BuilderPage';
import { validateBuilderSearch } from '@/components/BuilderPage/builderSearch';

export const Route = createFileRoute('/builder')({
	validateSearch: validateBuilderSearch,
	component: BuilderRouteComponent,
});

function BuilderRouteComponent() {
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
			<AppHeader />
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
