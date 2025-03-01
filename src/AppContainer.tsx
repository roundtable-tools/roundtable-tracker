import { useState } from 'react';
import { InitiativeList } from '@/components/InitiativeList/InitiativeList';
import { useEncounterStore } from '@/store/instance';
import { RoundBar } from '@/components/InitiativeList/RoundBar';
import { PreviewDisplay } from '@/components/PreviewDisplay/PreviewDisplay';
import {
	Main,
	Page,
	Text,
	PageContent,
	PageHeader,
	Card,
	Box,
	CardHeader,
	Grid,
} from 'grommet';
import { AppFooter } from './AppFooter';
import { EncounterDirectory } from './components/EncounterDirectory/EncounterDirectory';
import { AppHeader } from './AppHeader';
export const AppContainer = () => {
	const encounterData = useEncounterStore((state) => state.encounterData);
	const [view, setView] = useState<string>('landingPage');

	return (
		<Main>
			{view === 'landingPage' ? (
				<Page fill>
					<PageContent>
						<PageHeader title="Roudtable Tools" />
						<Grid
							areas={[
								['directory', 'builder'],
								['directory', 'initiative'],
							]}
							fill
							gap="small"
						>
							{[
								['directory', 'Select Encounter ', 'light-3'],
								['builder', 'Create New', 'brand'],
								['initiative', 'Continue', 'graph-0'],
							].map(([area, title, color]) => (
								<Box
									gridArea={area}
									fill
									key={area}
									onClick={() => setView(area)}
								>
									<Card fill pad="small" background={color}>
										<CardHeader pad="small" fill justify="center">
											<Text size="large">{title}</Text>
										</CardHeader>
									</Card>
								</Box>
							))}
						</Grid>
					</PageContent>
				</Page>
			) : (
				<>
					<AppHeader view={view} setView={setView} />
					<Page fill>
						<PageContent>
							{view === 'directory' && <EncounterDirectory setView={setView} />}
							{view === 'builder' && <></>}
							{view === 'initiative' && (
								<>
									<PageHeader title={encounterData?.name} />
									<RoundBar />
									<InitiativeList />
								</>
							)}
							{view === 'preview' && (
								<>
									<PageHeader title={encounterData?.name} />
									<PreviewDisplay setView={setView} />
								</>
							)}
						</PageContent>
					</Page>
				</>
			)}
            {view === 'initiative' && <AppFooter endEncounter={() => setView('preview')} />}
		</Main>
	);
};
