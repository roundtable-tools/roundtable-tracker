import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { EndRoundCommand } from '@/CommandHistory/Commands/EndRoundCommand';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { useEncounterStore } from '@/store/instance';
import { UUID } from '@/utils/uuid';
import { Box, Button } from 'grommet';
import { useContext } from 'react';

export const RoundBar = () => {
	const { executeCommand } = useContext(CommandHistoryContext);
	const round = useEncounterStore((state) => state.round);
	const charactersWithTurn = useEncounterStore(
		(state) => state.charactersWithTurn
	);
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);
	const delayedOrder = useEncounterStore((state) => state.delayedOrder);

	const endRound = () => {
		executeCommand(new EndRoundCommand());
	};
	const endPlayerTurn = (uuid: UUID) => {
		executeCommand(new EndTurnCommand({ uuid }));
	};

	return (
		<Box
			direction="row"
			gap="small"
			align="center"
			pad="medium"
			style={{
				flexShrink: 0,
				gap: '0.5rem',
				flexWrap: 'wrap',
			}}
		>
			<Box>Round {round}</Box>
			<Box>
				Characters moved:{' '}
				{charactersOrder.length + delayedOrder.length - charactersWithTurn.size}{' '}
				/ {charactersOrder.length + delayedOrder.length}
			</Box>
			<Button
				label="End Round"
				onClick={endRound}
				style={{ opacity: charactersWithTurn.size > 0 ? 0.5 : 1 }}
			/>
			<Button
				label="Next Turn"
				onClick={() => {
					endPlayerTurn(charactersOrder[0]);
				}}
				disabled={charactersWithTurn.size - delayedOrder.length <= 0}
			/>
		</Box>
	);
};
