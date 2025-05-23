import { Grommet } from 'grommet';
import { CommandHistoryProvider } from './CommandHistory/CommandHistoryProvider';
import { AppContainer } from './AppContainer';

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
	return (
		<CommandHistoryProvider>
			<Grommet theme={theme} full>
				<AppContainer />
			</Grommet>
		</CommandHistoryProvider>
	);
}

export default App;
