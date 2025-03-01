import { Box, Button, Clock, Footer } from 'grommet';
import { Redo, Revert } from 'grommet-icons';
import { useContext, useState } from 'react';
import { CommandHistoryContext } from '../CommandHistory/CommandHistoryContext';

type HistoryFooterProps = {
	endEncounter: () => void;
};

export const HistoryFooter = (props: HistoryFooterProps) => {
	const { undo, canUndo, redo, canRedo } = useContext(CommandHistoryContext);
	const { endEncounter } = props;
	const [time, setTime] = useState('T00:00:00');
	const resetClock = () => {
		setTime(`${Math.random()}T00:00:00`);
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
				disabled={!canRedo}
				onClick={() => {
					resetClock();
					redo();
				}}
			>
				<Redo />
			</Button>
		</Footer>
	);
};
