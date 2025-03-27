import { Accordion, AccordionPanel, Box, Grid } from 'grommet';
import { Character } from '@/store/data';
import { TypingEffect } from '@/components/TypingEffect';
import { useEncounterStore } from '@/store/instance';
import { HealthManagementForm } from './HealthManagementForm';
import { CharacterManagementForm } from './CharacterManagementForm';

export const InitiativeElement = (props: {
	character: Character;
	open: boolean;
	isInteractive?: boolean;
}) => {
	const charactersWithTurn = useEncounterStore(
		(state) => state.charactersWithTurn
	);

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
						<State state={props.character.turnState} />
					</Box>
				}
			>
				<Grid
					onMouseUp={(e) => e.stopPropagation()}
					columns={['1fr', '1fr']}
					gap="small"
					pad={{ horizontal: 'medium', vertical: 'small' }}
					justifyContent="between"
					alignContent="center"
				>
					<HealthManagementForm {...props.character} />
					<CharacterManagementForm
						{...props.character}
						hasTurn={charactersWithTurn.has(props.character.uuid)}
					/>
				</Grid>
			</AccordionPanel>
		</Accordion>
	);
};

const State = (props: { state: Character['turnState'] }) => {
	return (
		<Box as={'span'}>
			<TypingEffect text={props.state} />
		</Box>
	);
};
