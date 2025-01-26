import { Box, Button, Clock, Footer } from 'grommet';
import { Redo, Revert } from 'grommet-icons';
import { useContext, useState } from 'react';
import { CommandHistoryContext } from './CommandHistory/CommandHistoryContext';
import { RandomIntCommand } from './CommandHistory/Commands/RandomIntCommand';

type EncounterBarProps = {
	endEncounter: () => void;
};

export const EncounterBar = (props: EncounterBarProps) => {
	const { executeCommand, undo, canUndo } = useContext(CommandHistoryContext);
	const { endEncounter } = props;
	const [time, setTime] = useState('T00:00:00');
	const resetClock = () => {
		setTime(`${Math.random()}T00:00:00`);
	};
	const createRandomNumber = () => {
		executeCommand(new RandomIntCommand(256));
	};
	return (
		<Footer
			background="brand"
			pad={{ left: 'medium', right: 'small', vertical: 'small' }}
			elevation="medium"
			flex={{ shrink: 0 }}
		>
			<Button
				disabled={!canUndo}
				onClick={() => {
					resetClock();
					undo();
				}}
			>
				<Revert />
			</Button>
			<Box align="center">
				<Clock type="digital" time={time} />
				<Button label="End encounter" onClick={endEncounter} />
			</Box>
			<Button
				onClick={() => {
					resetClock();
					createRandomNumber();
				}}
			>
				<Redo />
			</Button>
		</Footer>
	);
};
