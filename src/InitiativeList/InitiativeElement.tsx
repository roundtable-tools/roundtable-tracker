import { Accordion, AccordionPanel, Box } from 'grommet';

export const InitiativeElement = () => {
	return (
		<Accordion>
			<AccordionPanel label="Panel 1">
				<Box pad="medium" title="One"></Box>
			</AccordionPanel>
		</Accordion>
	);
};
