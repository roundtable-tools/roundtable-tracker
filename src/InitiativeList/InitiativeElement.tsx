import { Accordion, AccordionPanel, Box } from 'grommet';
import { Character } from '../store/data';
import { useRef } from 'react';
import { motion, useInView } from 'motion/react';

export const InitiativeElement = (props: {
	character: Character;
	open: boolean;
}) => {
	return (
		<Accordion activeIndex={props.open ? 0 : []}>
			<AccordionPanel
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

export function TypingEffect({ text = 'Typing Effect' }: { text: string }) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once: false });

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			{text.split('').map((letter, index) => (
				<motion.span
					key={`${text}-${index}`}
					initial={{ opacity: 0 }}
					animate={isInView ? { opacity: 1 } : {}}
					transition={{ duration: 0.1, delay: index * 0.05 }}
				>
					{letter}
				</motion.span>
			))}
		</div>
	);
}
