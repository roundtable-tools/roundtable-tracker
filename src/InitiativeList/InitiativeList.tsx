import { Box, Grid } from 'grommet';
import { InitiativeElement } from './InitiativeElement';
import { useEncounterStore } from '../store/store';
import { animate, isDragActive, motion, useMotionValue } from 'motion/react';
import { Character } from '../store/data';
import { useContext, useRef, useState } from 'react';
import { CommandHistoryContext } from '../CommandHistory/CommandHistoryContext';
import { UpdateCharacterCommand } from '../CommandHistory/Commands/UpdateCharacterCommand';

export const InitiativeList = () => {
	const characters = useEncounterStore((state) => state.characters);

	const { executeCommand } = useContext(CommandHistoryContext);

	return (
		<Grid rows={['xsmall', '...']} columns={['50px', '1fr', '50px']} gap="none">
			{characters.map((character, index) => (
				<ImitativeRow
					key={character.name}
					character={character}
					index={index}
					onStateChange={(state) => {
						executeCommand(
							new UpdateCharacterCommand({
								index,
								newCharacterProps: { state },
							})
						);
					}}
				/>
			))}
		</Grid>
	);
};

const getBackgroundColor = (index: number) => {
	switch (index) {
		case 0:
			return 'brand';
		case 1:
			return 'light-4';
		case 2:
			return 'light-3';
		default:
			return 'light-2';
	}
};

const offset: { [key in Character['state']]: number } = {
	normal: 0,
	delayed: -50,
	'knocked-out': 50,
};

const parseOffset = (x: number) => {
	if (x < -25) {
		return 'delayed';
	} else if (x > 25) {
		return 'knocked-out';
	} else {
		return 'normal';
	}
};

const ImitativeRow = (props: {
	character: Character;
	index: number;
	onStateChange: (state: Character['state']) => void;
}) => {
	const x = useMotionValue(0);
	const [isOpen, setOpen] = useState(false);
	const haveDragged = useRef(false);

	return (
		<>
			<Box background={'status-critical'} border={'all'}>
				Delay
			</Box>
			<Box background={'status-unknown'}>
				<motion.div
					drag="x"
					style={{ x }}
					animate={{ x: offset[props.character.state] }}
					dragConstraints={{ left: -50, right: 50 }}
					dragElastic={0.1}
					onMouseDown={() => {
						haveDragged.current = false;
					}}
					onMouseMove={() => {
						haveDragged.current = isDragActive() || haveDragged.current;
					}}
					onMouseUp={() => {
						if (!haveDragged.current) setOpen(!isOpen);
					}}
					onDragEnd={() => {
						const endX = x.get();
						const newState = parseOffset(endX);
						props.onStateChange(newState);
						animate(x, offset[newState]);
					}}
				>
					<Box background={getBackgroundColor(props.index)}>
						<InitiativeElement character={props.character} open={isOpen} />
					</Box>
				</motion.div>
			</Box>
			<Box background={'status-warning'} border={'all'}>
				Knock out
			</Box>
		</>
	);
};
