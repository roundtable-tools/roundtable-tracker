import { Box, Button, Clock, Footer } from 'grommet';
import { Redo, Revert } from 'grommet-icons';
import { useState } from 'react';

type EncounterBarProps = {
	endEncounter: () => void;
};

export const EncounterBar = (props: EncounterBarProps) => {
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
				onClick={() => {
					resetClock();
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
				}}
			>
				<Redo />
			</Button>
		</Footer>
	);
};
