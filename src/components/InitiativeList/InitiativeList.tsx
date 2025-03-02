import { Box, Button, Grid, ResponsiveContext } from 'grommet';
import { InitiativeElement } from './InitiativeElement';

import {
	animate,
	isDragActive,
	motion,
	Reorder,
	useMotionValue,
} from 'motion/react';
import { Character } from '@/store/data';
import { useContext, useEffect, useRef, useState } from 'react';
import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { debounce } from 'throttle-debounce';
import { ReorderCharactersCommand } from '@/CommandHistory/Commands/ReorderCharactersCommand';
import { UUID } from '@/utils/uuid';
import { useEncounterStore } from '@/store/instance';
import { useRaisedShadow } from '@/hooks/useRisedShadow';
import {
	Close,
	Down,
	InProgress,
	Run,
	Undo,
	Vulnerability,
} from 'grommet-icons';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import {
	canBeDelayed,
	getChangeCharacterState,
} from '@/CommandHistory/Commands/composites/ChangeCharacterState';

const debounceOneSecond = debounce(
	1000,
	(executeFn: () => void) => {
		executeFn();
	},
	{ atBegin: false }
);

type ListMode = 'normal' | 'resolving-knocked-out';

export const InitiativeList = () => {
	const { executeCommand } = useContext(CommandHistoryContext);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);
	const delayedOrder = useEncounterStore((state) => state.delayedOrder);

	const charactersWithTurn = useEncounterStore(
		(state) => state.charactersWithTurn
	);

	const [charactersIds, setCharactersIds] = useState<UUID[]>(charactersOrder);
	const [mode, setMode] = useState<ListMode>('normal');
	const [knockedOutCharacter, setKnockedOutCharacter] = useState<UUID | null>(
		null
	);

	const delayedCharacters = delayedOrder
		.map((id) => charactersMap[id])
		.filter((character) => !!character);

	const chartersInOrder = charactersIds
		.map((id) => charactersMap[id])
		.filter((character) => !!character);

	useEffect(() => {
		setCharactersIds(charactersOrder);
	}, [charactersOrder]);

	const updateOrder = (newOrder: string[]) => {
		setCharactersIds((prev) => {
			if (prev.join('') === newOrder.join('')) return prev;
			debounceOneSecond(() => {
				executeCommand(
					new ReorderCharactersCommand({
						newOrder,
					})
				);
			});
			return newOrder;
		});
	};

	const onKnockedOut = (id: UUID) => {
		setMode('resolving-knocked-out');
		setKnockedOutCharacter(id);
	};

	const rowMode = (id: UUID): RowMode => {
		if (mode === 'resolving-knocked-out' && id === knockedOutCharacter)
			return 'knocked-out-receiver';

		return 'normal';
	};

	const slayCharacter = (id: UUID) => {
		setMode('normal');
		executeCommand(new RemoveCharacterCommand({ uuid: id }));
	};
	const updateCharacterState = (id: UUID, state: Character['state']) => {
		executeCommand(
			getChangeCharacterState(charactersMap[id], state, {
				charactersWithTurn,
				charactersOrder,
				delayedOrder,
			})
		);
	};

	const knockOut = () => {
		setMode('normal');
		if (!knockedOutCharacter) throw new Error('No knocked out character');

		updateCharacterState(knockedOutCharacter, 'knocked-out');
		setKnockedOutCharacter(null);
	};

	return (
		<Box gap={'medium'}>
			<Reorder.Group
				as="div"
				axis="y"
				values={delayedCharacters.map((character) => character.uuid)}
				onReorder={() => {}}
			>
				{delayedCharacters.map((character, index) => (
					<ReorderRow
						key={character.uuid}
						character={character}
						moved={false}
						index={index}
						mode={rowMode(character.uuid)}
						onKnockedOut={onKnockedOut}
						slayCharacter={slayCharacter}
						knockOut={knockOut}
						updateCharacterState={updateCharacterState}
						cancelAction={() => setMode('normal')}
					/>
				))}
			</Reorder.Group>

			<Reorder.Group
				as="div"
				axis="y"
				values={chartersInOrder.map((character) => character.uuid)}
				onReorder={updateOrder}
			>
				{chartersInOrder.map((character, index) => (
					<ReorderRow
						key={character.uuid}
						character={character}
						moved={false}
						index={index}
						mode={rowMode(character.uuid)}
						onKnockedOut={onKnockedOut}
						slayCharacter={slayCharacter}
						knockOut={knockOut}
						updateCharacterState={updateCharacterState}
						cancelAction={() => setMode('normal')}
					/>
				))}
			</Reorder.Group>
		</Box>
	);
};

type RowMode = 'normal' | 'knocked-out-source' | 'knocked-out-receiver';

const ReorderRow = (props: {
	mode: RowMode;
	moved: boolean;
	character: Character;
	index: number;
	onKnockedOut: (id: UUID) => void;
	slayCharacter: (id: UUID) => void;
	knockOut: (id: UUID) => void;
	cancelAction: () => void;
	updateCharacterState: (id: UUID, state: Character['state']) => void;
}) => {
	const size = useContext(ResponsiveContext);
	const { character, index, mode } = props;

	const y = useMotionValue(0);
	const boxShadow = useRaisedShadow(y);

	const [isOpen, setOpen] = useState(false);
	const haveDragged = useRef(false);

	const restoreRef = useRef<(state: Character['state']) => void>();

	return (
		<Reorder.Item
			as="div"
			value={character.uuid}
			style={{ boxShadow, y, position: 'relative' }}
			dragListener={mode === 'normal' && character.state !== 'delayed'}
			whileDrag={{ scale: 1.01 }}
		>
			{mode === 'knocked-out-receiver' && (
				<Box
					background={'rgba(0,0,0,.8)'}
					style={{
						position: 'absolute',
						right: 0,
						top: 0,
						bottom: 0,
						zIndex: 1,
					}}
					justify="end"
					align="center"
					direction="row"
					pad={{ horizontal: 'small' }}
				>
					{size !== 'small' && (
						<Box
							gap={'medium'}
							direction="row"
							style={{
								position: 'absolute',
								pointerEvents: 'none',
								top: 0,
								right: 0,
								width: 'calc(100% + 100px)',
								maxWidth: 'unset',
								height: '100%',
								zIndex: -1,
								background:
									'linear-gradient(90deg, rgba(0,0,0,0) 0%,rgba(0,0,0,0.8) 100px, rgba(0,0,0,0) 100px)',
							}}
						/>
					)}

					<Button
						icon={<Undo />}
						onClick={() => {
							restoreRef.current?.(character.state);
							props.cancelAction();
						}}
					/>
					<Button
						primary
						icon={<Close />}
						label="Slay"
						color={'status-critical'}
						onClick={() => props.slayCharacter(character.uuid)}
					/>
					<Button
						secondary
						icon={<Down />}
						color={'status-warning'}
						onClick={() => props.knockOut(character.uuid)}
						label="K.O."
					/>
				</Box>
			)}

			<Grid
				rows={['xsmall', '...']}
				columns={['50px', '1fr', '50px']}
				gap="none"
				style={{ cursor: mode !== 'normal' ? 'pointer' : 'default' }}
				onClick={() => {
					if (mode !== 'normal') props.cancelAction();
				}}
			>
				<ImitativeRow
					mode={mode === 'knocked-out-receiver' ? 'preview-state' : 'normal'}
					previewState={
						mode === 'knocked-out-receiver' ? 'knocked-out' : undefined
					}
					character={character}
					index={index}
					isInteractive={mode === 'normal'}
					open={isOpen}
					onCancelStateChange={(changeState) => {
						restoreRef.current = changeState;
					}}
					onStateChange={(state) => {
						if (state === 'knocked-out') props.onKnockedOut(character.uuid);
						else {
							props.updateCharacterState(character.uuid, state);
						}
					}}
					onMouseDown={() => {
						haveDragged.current = false;
					}}
					onMouseMove={() => {
						haveDragged.current = isDragActive() || haveDragged.current;
					}}
					onMouseUp={() => {
						if (!haveDragged.current && mode === 'normal') setOpen(!isOpen);
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
	mode: 'normal' | 'preview-state';
	previewState?: Character['state'];
	character: Character;
	index: number;
	isInteractive?: boolean;
	open: boolean;
	onMouseDown?: () => void;
	onMouseUp?: () => void;
	onMouseMove?: () => void;
	onStateChange: (state: Character['state']) => void;
	onCancelStateChange?: (
		changeState: (state: Character['state']) => void
	) => void;
}) => {
	const x = useMotionValue(0);
	const state =
		(props.mode === 'preview-state'
			? props.previewState
			: props.character.state) ?? props.character.state;

	const charactersWithTurn = useEncounterStore(
		(state) => state.charactersWithTurn
	);

	const canEnterState = (newState: Character['state']) => {
		if (newState === 'delayed')
			return canBeDelayed(props.character, charactersWithTurn);
		return true;
	};

	return (
		<>
			<Button
				disabled={
					!props.isInteractive ||
					!canBeDelayed(props.character, charactersWithTurn)
				}
				onClick={() => {
					if (state !== 'delayed') props.onStateChange('delayed');
				}}
			>
				<Box
					background={'graph-3'}
					border={'all'}
					align="center"
					justify="center"
					height={'100%'}
				>
					<InProgress />
				</Box>
			</Button>
			<Box background={'status-unknown'} style={{ position: 'relative' }}>
				{state != 'normal' && (
					<Button
						style={{
							position: 'absolute',
							height: '100%',
							right: state === 'delayed' ? 0 : undefined,
							left: state === 'knocked-out' ? 0 : undefined,
							top: 0,
						}}
						disabled={!props.isInteractive}
						onClick={() => {
							props.onStateChange('normal');
						}}
					>
						<Box
							background={'status-ok'}
							border={'all'}
							align="center"
							justify="center"
							width={'50px'}
							height={'100%'}
						>
							<Run />
						</Box>
					</Button>
				)}
				<motion.div
					drag={props.isInteractive ? 'x' : false}
					style={{ x }}
					animate={{ x: offset[state] }}
					dragConstraints={{ left: -50, right: 50 }}
					dragElastic={0.1}
					onMouseDown={props.onMouseDown}
					onMouseUp={props.onMouseUp}
					onMouseMove={props.onMouseMove}
					onDragEnd={() => {
						const endX = x.get();
						const newState = parseOffset(endX);
						animate(x, offset[newState]);
						if (newState === state) return;

						if (!canEnterState(newState)) {
							animate(x, offset[state]);
							return;
						}

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
						<InitiativeElement
							character={props.character}
							open={props.open}
							isInteractive={props.isInteractive}
						/>
					</Box>
				</motion.div>
			</Box>
			<Button
				disabled={!props.isInteractive}
				onClick={() => {
					if (state !== 'knocked-out') props.onStateChange('knocked-out');
				}}
			>
				<Box
					background={'status-warning'}
					border={'all'}
					align="center"
					justify="center"
					height={'100%'}
				>
					<Vulnerability />
				</Box>
			</Button>
		</>
	);
};
