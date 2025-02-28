import { Box, Grid } from 'grommet';
import { InitiativeElement } from './InitiativeElement';

import {
	animate,
	isDragActive,
	motion,
	Reorder,
	useMotionValue,
} from 'motion/react';
import { Character } from '../store/data';
import { useContext, useEffect, useRef, useState } from 'react';
import {
	Command,
	CommandHistoryContext,
} from '../CommandHistory/CommandHistoryContext';
import { UpdateCharacterCommand } from '../CommandHistory/Commands/UpdateCharacterCommand';
import { debounce } from 'throttle-debounce';
import { ReorderCharactersCommand } from '../CommandHistory/Commands/ReorderCharactersCommand';
import { UUID } from '@/utils/uuid';
import { useEncounterStore } from '@/store/store';
import { useRaisedShadow } from '@/hooks/useRisedShadow';

const debounceOneSecond = debounce(
	1000,
	(executeFn: () => void) => {
		executeFn();
	},
	{ atBegin: false }
);

export const InitiativeList = () => {
	const { executeCommand } = useContext(CommandHistoryContext);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);

	const [charactersIds, setCharactersIds] = useState<UUID[]>(charactersOrder);

	useEffect(() => {
		setCharactersIds(charactersOrder);
	}, [charactersOrder]);

	const updateOrder = (newOrder: string[]) => {
		setCharactersIds((prev) => {
			if (prev.join('') === newOrder.join('')) return prev;
			debounceOneSecond(() => {
				executeCommand(new ReorderCharactersCommand({ newOrder }));
			});
			return newOrder;
		});
	};

	return (
		<Reorder.Group
			as="div"
			axis="y"
			values={charactersIds}
			onReorder={updateOrder}
		>
			{charactersIds
				.map((name) => charactersMap[name])
				.map((character, index) => (
					<ReorderRow
						key={character.uuid}
						character={character}
						index={index}
						executeCommand={executeCommand}
					/>
				))}
		</Reorder.Group>
	);
};

const ReorderRow = (props: {
	character: Character;
	index: number;
	executeCommand: (command: Command) => void;
}) => {
	const { character, index, executeCommand } = props;

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	const [isOpen, setOpen] = useState(false);
	const haveDragged = useRef(false);

	return (
		<Reorder.Item
			as="div"
			value={character.uuid}
			style={{ boxShadow, y, position: 'relative' }}
			dragListener={true}
			whileDrag={{ scale: 1.01 }}
		>
			<Grid
				rows={['xsmall', '...']}
				columns={['50px', '1fr', '50px']}
				gap="none"
			>
				<ImitativeRow
					character={character}
					index={index}
					isInteractive={true}
					open={isOpen}
					onStateChange={(state) => {
						executeCommand(
							new UpdateCharacterCommand({
								uuid: character.uuid,
								newCharacterProps: { turnState: state },
							})
						);
					}}
					onMouseDown={() => {
						haveDragged.current = false;
					}}
					onMouseMove={() => {
						haveDragged.current = isDragActive() || haveDragged.current;
					}}
					onMouseUp={() => {
						if (!haveDragged.current) setOpen(!isOpen);
					}}
				/>
			</Grid>
		</Reorder.Item>
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

const offset: { [key in Character['turnState']]: number } = {
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
	isInteractive?: boolean;
	open: boolean;
	onMouseDown?: () => void;
	onMouseUp?: () => void;
	onMouseMove?: () => void;
	onStateChange: (state: Character['turnState']) => void;
}) => {
	const x = useMotionValue(0);

	return (
		<>
			<Box background={'status-critical'} border={'all'}>
				Delay
			</Box>
			<Box background={'status-unknown'}>
				<motion.div
					drag={props.isInteractive ? 'x' : false}
					style={{ x }}
					animate={{ x: offset[props.character.turnState] }}
					dragConstraints={{ left: -50, right: 50 }}
					dragElastic={0.1}
					onMouseDown={props.onMouseDown}
					onMouseUp={props.onMouseUp}
					onMouseMove={props.onMouseMove}
					onDragEnd={() => {
						const endX = x.get();
						const newState = parseOffset(endX);
						animate(x, offset[newState]);
						if (newState === props.character.turnState) return;
						props.onStateChange(newState);
					}}
				>
					<Box
						background={getBackgroundColor(props.index)}
						style={{
							transitionDuration: '1s',
							transitionProperty: 'background-color',
						}}
					>
						<InitiativeElement character={props.character} open={props.open} />
					</Box>
				</motion.div>
			</Box>
			<Box background={'status-warning'} border={'all'}>
				Knock out
			</Box>
		</>
	);
};
