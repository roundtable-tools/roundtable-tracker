import { AppHeader } from '@/AppHeader';
import { HistoryFooter } from '@/components/HistoryFooter';
import { InitiativeList } from '@/components/InitiativeList/InitiativeList';
import { RoundBar } from '@/components/InitiativeList/RoundBar';
import { createFileRoute } from '@tanstack/react-router';
import { PageContent, PageHeader, Box } from 'grommet';

export const Route = createFileRoute('/initiative')({
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<>
			<AppHeader setView={() => {}} />
			<PageContent fill>
				<PageHeader title={'Preview'} />
				<RoundBar />
				<Box overflow={{ vertical: 'auto', horizontal: 'visible' }} fill>
					<InitiativeList />
				</Box>
			</PageContent>
			<HistoryFooter endEncounter={() => {}} />
		</>
	);
}
