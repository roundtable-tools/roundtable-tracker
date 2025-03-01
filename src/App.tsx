import { Button, Grommet, Page, PageContent, PageHeader, Text } from 'grommet';
import { Menu } from 'grommet-icons';
import { useState } from 'react';
import { AppBar } from './AppBar';
import { CommandHistoryProvider } from './CommandHistory/CommandHistoryProvider';
import { EncounterBar } from './EncounterBar';
import { EncounterDirectory } from './EncounterDirectory/EncounterDirectory';
import { InitiativeContainer } from './InitiativeList/InitiativeContainer';
import { useEncounterStore } from '@/store/instance';

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
	const [encounterInProgress, setEncounterInProgress] =
		useState<boolean>(false);
	return (
		<CommandHistoryProvider>
			<Grommet theme={theme} full>
				<Page fill="vertical" style={{ height: '100dvh' }}>
					<AppBar>
						<Button>
							<Menu onClick={() => setShow(true)} />
						</Button>
						{!encounterInProgress && (
							<Button
								primary
								label="Start Encounter"
								onClick={() => setEncounterInProgress(true)}
							/>
						)}
						<Text size="large">My App</Text>
					</AppBar>
					<PageContent style={{ overflowY: 'auto', flexGrow: 1 }}>
						<PageHeader title={encounterData?.name} />
						<InitiativeContainer />
					</PageContent>

					<EncounterBar endEncounter={() => setEncounterInProgress(false)} />
				</Page>
				{show && <EncounterDirectory setShow={setShow} />}
			</Grommet>
		</CommandHistoryProvider>
	);
}

export default App;
