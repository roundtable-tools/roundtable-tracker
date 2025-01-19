import { Button, Grommet, Page, PageContent, PageHeader, Text } from 'grommet';
import { Menu } from 'grommet-icons';
import { useState } from 'react';
import { AppBar } from './AppBar';
import { EncounterBar } from './EncounterBar';
import { EncounterDirectory } from './EncounterDirectory/EncounterDirectory';
import { InitiativeList } from './InitiativeList/InitiativeList';

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
};

function App() {
	const [show, setShow] = useState<boolean>(false);
	const [encounterInProgress, setEncounterInProgress] =
		useState<boolean>(false);
	return (
		<Grommet theme={theme} full>
			<Page fill="vertical" justify="between">
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
				<PageContent flex="grow">
					<PageHeader title="Ta lista potrzebuje integrated wykrywanie gestów swipe & tap" />
					<InitiativeList />
				</PageContent>
				{encounterInProgress && (
					<EncounterBar endEncounter={() => setEncounterInProgress(false)} />
				)}
			</Page>
			{show && <EncounterDirectory setShow={setShow} />}
		</Grommet>
	);
}

export default App;
