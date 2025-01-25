import { Accordion, AccordionPanel, Box } from 'grommet';
import { Character } from '../store';

export const InitiativeElement = (props: { character: Character }) => {
	return (
		<Accordion>
			<AccordionPanel
				label={`[${props.character.initiative}] ${props.character.name} - ${props.character.state}`}
			>
				<Box pad="medium" title="One">
					[{props.character.initiative}] {props.character.name}
				</Box>
			</AccordionPanel>
		</Accordion>
	);
};
