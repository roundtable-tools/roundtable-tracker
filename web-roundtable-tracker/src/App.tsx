import { Grommet } from 'grommet';
import { CommandHistoryProvider } from './CommandHistory/CommandHistoryProvider';
import { AppContainer } from './AppContainer';
import { initializeAuthentication } from './store/supbase';
import { useEffectOnce } from './hooks/useEffectOnce';

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
	useEffectOnce(() => {
		console.log('Initializing authentication...');
		initializeAuthentication()
			.then(() => {
				console.log('Authentication initialized successfully.');
			})
			.catch((error) => {
				console.error('Error initializing authentication:', error);
			});
	});

	return (
		<CommandHistoryProvider>
			<Grommet theme={theme} full>
				<AppContainer />
			</Grommet>
		</CommandHistoryProvider>
	);
}

export default App;
