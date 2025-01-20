import { Accordion, AccordionPanel, Box } from 'grommet';

export const InitiativeElement = (props: {
	name: string;
	initiative: number;
}) => {
	return (
		<Accordion>
			<AccordionPanel label={`[${props.initiative}] ${props.name}`}>
				<Box pad="medium" title="One">
					[{props.initiative}] {props.name}
				</Box>
			</AccordionPanel>
		</Accordion>
	);
};
