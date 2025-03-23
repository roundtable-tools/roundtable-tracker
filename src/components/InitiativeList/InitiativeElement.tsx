import { Accordion, AccordionPanel, Box, Button, Grid, MaskedInput, Text } from 'grommet';
import { Character } from '@/store/data';
import { TypingEffect } from '@/components/TypingEffect';
import { useEncounterStore } from '@/store/instance';
import { Close } from 'grommet-icons';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { useContext, useState } from 'react';
import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { UpdateCharacterDataCommand } from '@/CommandHistory/Commands/UpdateCharacterDataCommand';

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

	const [healthChange, setHealthChange] = useState<number | undefined>(undefined);
	const [tempHealthChange, setTempHealthChange] = useState<number | undefined>(undefined);
	const handleTempHealthChange = () => {
		const newTempHealth = props.character.tempHealth ?? 0 + (tempHealthChange ?? 0);
		console.log('New temp health:', newTempHealth);
		executeCommand(new UpdateCharacterDataCommand({
			uuid: props.character.uuid,
			tempHealth: newTempHealth,
		}));
		setTempHealthChange(undefined);
	};

	const handleHealthChange = () => {
		const newTempHealth = (healthChange && healthChange < 0) ? (props.character.tempHealth ?? 0) - (healthChange ?? 0) : (props.character.tempHealth ?? 0);
		const newHealth = (healthChange && healthChange >= 0) ? (props.character.health ?? 0) + (healthChange ?? 0) : (newTempHealth >= 0) ? (props.character.health ?? 0) : (props.character.health ?? 0) + (healthChange ?? 0);
		console.log('New health:', newHealth);
		console.log('New temp health:', newTempHealth);
		executeCommand(new UpdateCharacterDataCommand({
			uuid: props.character.uuid,
			health: newHealth,
			tempHealth: newTempHealth,
		}));
		setHealthChange(undefined);
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
					<Box>
						<Text size='xxlarge' gridArea="value" alignSelf='center'>{(props.character.health ?? 0) + (props.character.tempHealth ?? 0)}/{props.character.maxHealth ?? 0}</Text>
						<Grid columns={['3fr', '1fr']} gap="small">
							<MaskedInput
								mask={[
									{
										length: [1, 6],
										regexp: /^[+-]?\d*$/,
										placeholder: '+gain/-loss',
									},
								]}
								value={`${healthChange ?? ''}`}
								onChange={(e) => {
									const value = e.target.value;
									if (value === '') {
										setHealthChange(undefined);
									} else {
										setHealthChange(parseInt(value));
									}
								}}
							/>
							<Button
								label="Set"
								onClick={handleHealthChange}
								primary
								color={'status-ok'}
								style={{ width: '100%' }}
							/>
							<MaskedInput
								mask={[
									{
										length: [1, 5],
										regexp: /^\d*$/,
										placeholder: 'temp HP',
									},
								]}
								value={`${tempHealthChange ?? ''}`}
								onChange={(e) => {
									const value = e.target.value;
									if (value === '') {
										setTempHealthChange(undefined);
									} else {
										setTempHealthChange(parseInt(value));
									}
								}}
							/>
							<Button
								label="Set"
								onClick={handleTempHealthChange}
								primary
								color={'status-ok'}
								style={{ width: '100%' }}
							/>
						</Grid>
					</Box>
					<Button
						style={{ width: "", borderRadius: '8px'}}
						primary
						icon={<Close />}
						label="Slay"
						color={'status-critical'}
						onClick={slayCharacter}
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
