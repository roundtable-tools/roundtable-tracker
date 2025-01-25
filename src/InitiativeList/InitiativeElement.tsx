import { Accordion, AccordionPanel, Box } from 'grommet';
import { Character } from '../store/data';

export const InitiativeElement = (props: {
	character: Character;
	open: boolean;
}) => {
	return (
		<Accordion activeIndex={props.open ? 0 : []}>
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
