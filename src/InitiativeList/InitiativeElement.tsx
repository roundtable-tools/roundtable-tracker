import { Accordion, AccordionPanel, Box } from 'grommet';
import { Character } from '../store/data';
import { TypingEffect } from '@/components/TypingEffect';

export const InitiativeElement = (props: {
	character: Character;
	open: boolean;
	isInteractive?: boolean;
}) => {
	return (
		<Accordion activeIndex={props.open ? 0 : []}>
			<AccordionPanel
				style={{
					cursor: props.isInteractive ? 'pointer' : 'default',
					pointerEvents: props.isInteractive ? 'auto' : 'none',
					opacity: props.isInteractive ? 1 : 0.8,
				}}
				label={
					<Box pad="medium" direction="row" gap="small">
						{`[${props.character.initiative}] ${props.character.name}`}{' '}
						<State state={props.character.state} />
					</Box>
				}
			>
				<Box pad="medium" title="One">
					[{props.character.initiative}] {props.character.name}
				</Box>
			</AccordionPanel>
		</Accordion>
	);
};

const State = (props: { state: Character['state'] }) => {
	return (
		<Box as={'span'}>
			<TypingEffect text={props.state} />
		</Box>
	);
};
