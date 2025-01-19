import { Box, Grid } from 'grommet';
import { InitiativeElement } from './InitiativeElement';

export const InitiativeList = () => {
	return (
		<Grid rows={['xsmall', '...']} gap="none">
			<Box background="brand">
				<InitiativeElement />
			</Box>
			<Box background="light-5">
				<InitiativeElement />
			</Box>
			<Box background="light-2">
				<InitiativeElement />
			</Box>
		</Grid>
	);
};
