import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { GiveAdditionalTurnCommand } from '@/CommandHistory/Commands/GiveAdditionalTurnCommand';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { Box, Button } from 'grommet';
import { Close, Trigger } from 'grommet-icons';
import { useContext } from 'react';

type CharacterManagementFormProps = {
	uuid: string;
	hasTurn: boolean;
};

export const CharacterManagementForm = (
	props: CharacterManagementFormProps
) => {
	const { uuid: characterUuid } = props;
	const { executeCommand } = useContext(CommandHistoryContext);
	const slayCharacter = () => {
		executeCommand(new RemoveCharacterCommand({ uuid: characterUuid }));
	};
	const giveAdditionalTurn = () => {
		executeCommand(new GiveAdditionalTurnCommand({ uuid: characterUuid }));
	};

	return (
		<Box pad="small" gap="small" flex direction="row">
			<Button
				style={{ width: '', borderRadius: '8px' }}
				primary
				icon={<Close />}
				label="Remove from Initiative"
				color={'status-error'}
				onClick={slayCharacter}
			/>
			<Button
				style={{ width: '', borderRadius: '8px' }}
				primary
				icon={<Trigger />}
				label="Give Additional Turn"
				color={'accent-3'}
				onClick={giveAdditionalTurn}
				disabled={props.hasTurn}
			/>
		</Box>
	);
};
