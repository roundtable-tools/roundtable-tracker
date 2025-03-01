import { Button, Grommet, Page, PageContent, PageHeader, Text } from 'grommet';
import { Menu } from 'grommet-icons';
import { useState } from 'react';
import { AppNav } from './AppNav';
import { CommandHistoryProvider } from './CommandHistory/CommandHistoryProvider';
import { AppFooter } from './AppFooter';
import { EncounterDirectory } from './components/EncounterDirectory/EncounterDirectory';
import { AppView } from './AppView';
import { useEncounterStore } from '@/store/instance';
import { APP_MODE } from './store/data';

const theme = {
	global: {
		colors: {
			brand: '#228BE6',
		},
		font: {
			family: 'Roboto',
			size: '18px',
			height: '20px',
		},
	},
	dataTable: {
		body: {
			selected: {
				background: 'active',
				color: 'text',
			},
		},
	},
};

function App() {
	const [show, setShow] = useState<boolean>(false);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const appMode = useEncounterStore((state) => state.appMode);
	const setAppMode = useEncounterStore((state) => state.setAppMode);
	return (
		<CommandHistoryProvider>
			<Grommet theme={theme} full>
				<Page fill="vertical" style={{ height: '100dvh' }}>
					<AppNav>
						<Button>
							<Menu onClick={() => setShow(true)} />
						</Button>
						{!appMode && (
							<Button
								primary
								label="Start Encounter"
								onClick={() => setAppMode(APP_MODE.Initiative)}
							/>
						)}
						<Text size="large">My App</Text>
					</AppNav>
					<PageContent style={{ overflowY: 'auto', flexGrow: 1 }}>
						<PageHeader title={encounterData?.name} />
						<AppView />
					</PageContent>

					<AppFooter endEncounter={() => setAppMode(APP_MODE.Empty)} />
				</Page>
				{show && <EncounterDirectory setShow={setShow} />}
			</Grommet>
		</CommandHistoryProvider>
	);
}

export default App;
