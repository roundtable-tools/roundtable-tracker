import { Accordion, AccordionPanel, Box, Button } from 'grommet';
import { Character } from '@/store/data';
import { TypingEffect } from '@/components/TypingEffect';
import { useEncounterStore } from '@/store/instance';
import { Close } from 'grommet-icons';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { useContext } from 'react';
import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';

export const InitiativeElement = (props: {
	character: Character;
	open: boolean;
	isInteractive?: boolean;
}) => {
	const { executeCommand } = useContext(CommandHistoryContext);
	const charactersWithTurn = useEncounterStore(
		(state) => state.charactersWithTurn
	);

	const slayCharacter = () => {
		executeCommand(new RemoveCharacterCommand({ uuid: props.character.uuid }));
	};

	return (
		<Accordion activeIndex={props.open ? 0 : []}>
			<AccordionPanel
				style={{
					cursor: props.isInteractive ? 'pointer' : 'default',
					pointerEvents: props.isInteractive ? 'auto' : 'none',
					opacity: props.isInteractive ? 1 : 0.8,
				}}
				label={
					<Box pad="medium" direction="row" gap="small" align="center">
						<Box
							round="full"
							background={
								charactersWithTurn.has(props.character.uuid)
									? 'accent-1'
									: 'accent-2'
							}
							width="12px"
							height="12px"
						/>
						{`[${props.character.initiative}] ${props.character.name}`}{' '}
						<State state={props.character.state} />
					</Box>
				}
			>
				<Button
					primary
					icon={<Close />}
					label="Slay"
					color={'status-critical'}
					onClick={slayCharacter}
				/>
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
