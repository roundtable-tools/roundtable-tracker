import { useState } from 'react';
import { InitiativeList } from '@/components/InitiativeList/InitiativeList';
import { useEncounterStore } from '@/store/instance';
import { RoundBar } from '@/components/InitiativeList/RoundBar';
import { PreviewDisplay } from '@/components/PreviewDisplay/PreviewDisplay';
import { Box, Main, Page, PageContent, PageHeader } from 'grommet';
import { HistoryFooter } from './components/HistoryFooter';
import { EncounterDirectory } from './components/EncounterDirectory/EncounterDirectory';
import { AppHeader } from './AppHeader';
import { LandingPage } from './components/LandingPage/LandingPage';
export const AppContainer = () => {
	const encounterData = useEncounterStore((state) => state.encounterData);
	const [view, setView] = useState<string>('landingPage');
	
	return (
		<Main>
			<Page fill flex>
				{view === 'landingPage' ? (
					<LandingPage setView={setView} />
				) : view === 'directory' ? (
					<EncounterDirectory setView={setView} />
				) : view === 'builder' ? (
					<>
						<AppHeader setView={setView} />
						<PageContent fill />
					</>
				) : view === 'initiative' ? (
					<>
						{/*Move page content and app header to separate component*/}
						<AppHeader setView={setView} />
						<PageContent fill>
							<PageHeader title={encounterData?.name} />
							<RoundBar />
							<Box overflow={{ vertical: 'auto', horizontal: 'visible' }} fill>
								<InitiativeList />
							</Box>
						</PageContent>
						<HistoryFooter endEncounter={() => setView('preview')} />
					</>
				) : view === 'preview' ? (
					<PreviewDisplay setView={setView} />
				) : (
					<></>
				)}
			</Page>
		</Main>
	);
};
