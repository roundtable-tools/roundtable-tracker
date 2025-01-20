import { Box, Grid } from 'grommet';
import { InitiativeElement } from './InitiativeElement';
import { useEncounterStore } from '../store';

export const InitiativeList = () => {
	const characters = useEncounterStore((state) => state.characters);

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
