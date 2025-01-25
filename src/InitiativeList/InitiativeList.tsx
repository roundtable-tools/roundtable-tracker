import { Box, Grid } from 'grommet';
import { InitiativeElement } from './InitiativeElement';
import { useEncounterStore } from '../store';
import React from 'react';

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
		<Grid rows={['xsmall', '...']} columns={['50px', '1fr', '50px']} gap="none">
			{characters.map((character, index) => (
				<React.Fragment key={character.name}>
					<Box background={'status-critical'} border={'all'}>
						Delay
					</Box>
					<Box background={'status-unknown'}>
						<Box background={getBackgroundColor(index)}>
							<InitiativeElement character={character} />
						</Box>
					</Box>
					<Box background={'status-warning'} border={'all'}>
						Knock out
					</Box>
				</React.Fragment>
			))}
		</Grid>
	);
};
