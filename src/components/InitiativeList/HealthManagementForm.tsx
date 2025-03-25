import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { UpdateCharacterDataCommand } from '@/CommandHistory/Commands/UpdateCharacterDataCommand';
import { Grid, MaskedInput, Button, Text, Box, Card } from 'grommet';
import { useContext, useState } from 'react';

type HealthManagementFormProps = {
	health: number;
	tempHealth: number;
	maxHealth: number;
	uuid: string;
};

export const HealthManagementForm = (props: HealthManagementFormProps) => {
	const { executeCommand } = useContext(CommandHistoryContext);
	const {
		health: characterCurrentHealth,
		tempHealth: characterTempHealth,
		maxHealth: characterMaxHealth,
		uuid: characterUuid,
	} = props;
	const [healthChange, setHealthChange] = useState<string | undefined>(
		undefined
	);
	const [tempHealthChange, setTempHealthChange] = useState<string | undefined>(
		undefined
	);
	const handleTempHealthChange = () => {
		const tempHealthChangeValue = parseInt(tempHealthChange ?? '0');
		if (isNaN(tempHealthChangeValue)) return;
		console.log('Temp health change:', tempHealthChangeValue);
		const newTempHealth = characterTempHealth + tempHealthChangeValue;
		console.log('New temp health:', newTempHealth);
		executeCommand(
			new UpdateCharacterDataCommand({
				uuid: characterUuid,
				newCharacterProps: { tempHealth: newTempHealth },
			})
		);
		setTempHealthChange(undefined);
	};

	const handleHealthChange = () => {
		const healthChangeValue = parseInt(healthChange ?? '0');
		if (isNaN(healthChangeValue)) return;
		console.log('Health change:', healthChangeValue);
		const newTempHealth =
			healthChangeValue < 0
				? characterTempHealth + healthChangeValue
				: characterTempHealth;
		const newHealth =
			healthChangeValue >= 0
				? characterCurrentHealth + healthChangeValue
				: newTempHealth >= 0
					? characterCurrentHealth
					: characterCurrentHealth + newTempHealth;
		console.log('New health:', newHealth);
		console.log('New temp health:', newTempHealth);
		executeCommand(
			new UpdateCharacterDataCommand({
				uuid: characterUuid,
				newCharacterProps: {
					health: Math.max(0,Math.min(newHealth,characterMaxHealth)),
					tempHealth: Math.max(newTempHealth, 0),
				},
			})
		);
		setHealthChange(undefined);
	};

	return (
		<Box pad="small" gap="small">
			<Card
				background={'white'}
				border={{ color: 'neutral-4', size: 'medium' }}
				pad={'medium'}
				flex
				direction={'row'}
				justify={'center'}
			>
				<Text size="xlarge" gridArea="value" alignSelf="center">
					{characterCurrentHealth}
					{characterTempHealth != 0 ? ` + ${characterTempHealth}` : ''}
				</Text>
				<Text size="xxlarge" gridArea="value" alignSelf="center">
					/{characterMaxHealth}
				</Text>
			</Card>
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
							setHealthChange(value);
						}
					}}
				/>
				<Button
					label="Set"
					onClick={handleHealthChange}
					primary
					color={'accent-4'}
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
							setTempHealthChange(value);
						}
					}}
				/>
				<Button
					label="Set"
					onClick={handleTempHealthChange}
					primary
					color={'accent-4'}
					style={{ width: '100%' }}
				/>
			</Grid>
		</Box>
	);
};
