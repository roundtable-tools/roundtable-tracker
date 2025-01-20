import { Box, Grid } from 'grommet';
import { InitiativeElement } from './InitiativeElement';

export const InitiativeList = () => {
	const characters = new Array(10)
		.fill(0)
		.map((_, index) => ({
			name: `Character ${index + 1}`,
			initiative: Math.floor(Math.random() * 20) + 1,
		}))
		.sort((a, b) => b.initiative - a.initiative);

	const getBackgroundColor = (index: number) => {
		switch (index) {
			case 0:
				return 'brand';
			case 1:
				return 'light-4';
			case 2:
				return 'light-3';
			default:
				return 'light-2';
		}
	};

	return (
		<Grid rows={['xsmall', '...']} gap="none">
			{characters.map((character, index) => (
				<Box key={character.name} background={getBackgroundColor(index)}>
					<InitiativeElement
						name={character.name}
						initiative={character.initiative}
					/>
				</Box>
			))}
		</Grid>
	);
};
