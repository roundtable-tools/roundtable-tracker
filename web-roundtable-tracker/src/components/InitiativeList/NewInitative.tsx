import { useEncounterStore } from '@/store/instance';
import { useEffect, useState } from 'react';
import { Timeline } from './Timeline';
import { Button } from '@/components/ui/button';
import { Clock } from './Clock';
import { CharacterCard, QuickAccessGrid } from './CharacterCard';
import { Card } from '../ui/card';
import { use$ } from '@legendapp/state/react';
import { CharacterTimer } from './CharacterTimer';
import { cn } from '@/lib/utils';
import encounterStore$ from './iniativeStore/initiativeStore';
import { isCharacter } from './initiativeHelpers';
import { InitiativeQueueList } from './InitiativeQueueList';
import { useObserve } from '@legendapp/state/react';
import {
	PopulateInitiativeQueueCommand,
	NextTurnCommand,
	ReturnFromDelayCommand,
	ForceUpdateStateCommand,
	ReorderInitiativeQueueCommand,
} from './iniativeStore/commands';
import { Undo2, Redo2 } from 'lucide-react';

import { Character } from '@/store/data';
import { debounce } from 'throttle-debounce';

const debounceOneSecond = debounce(
	100,
	(executeFn: () => void) => {
		executeFn();
	},
	{ atBegin: false }
);

export function NewInitiative() {
	const encounterData = useEncounterStore((state) => state.encounterData);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const [startTimestamp] = useState<number>(new Date().getTime());
	const currentRound = use$(encounterStore$.round);

	useEffect(() => {
		encounterStore$.executeCommand(
			new PopulateInitiativeQueueCommand(Object.values(charactersMap))
		);
	}, [charactersMap]);

	const initiativeQueue = use$(encounterStore$.initiativeQueue);
	const activeCharacter = use$(encounterStore$.activeCharacter);
	const undoQueue = use$(encounterStore$.undoQueue);
	const redoQueue = use$(encounterStore$.redoQueue);

	const [displayedQueue, setDisplayedQueue] = useState(initiativeQueue);

	useObserve(() => {
		setDisplayedQueue(encounterStore$.initiativeQueue.get());
	});

	const characters = initiativeQueue
		.filter(isCharacter)
		.map((item) => item.element);

	const characterTurnTimestamps = use$(encounterStore$.characterTurnTimestamps);
	const roundTimestamps = use$(encounterStore$.roundTimestamps);

	const quickAccessCharacters = characters.filter(
		(c) => c.turnState === 'on-hold' || c.turnState === 'delayed'
	);

	const handleQuickAccess = (
		uuid: string,
		newState: Character['turnState']
	) => {
		encounterStore$.executeCommand(new ReturnFromDelayCommand(uuid));
	};

	const getCurrentTurnTime = (uuid: string): number => {
		const timestamp = characterTurnTimestamps[uuid];

		if (!timestamp) return 0;

		return timestamp.duration
			? timestamp.duration
			: Date.now() - timestamp.start;
	};

	const updateState = (uuid: string, newState: Character['turnState']) => {
		encounterStore$.executeCommand(new ForceUpdateStateCommand(uuid, newState));
	};

	const initiativeRenderQueue = (
		<InitiativeQueueList
			queue={displayedQueue}
			onReorder={(queue) => {
				setDisplayedQueue(queue);
				debounceOneSecond(() => {
					encounterStore$.executeCommand(
						new ReorderInitiativeQueueCommand(queue)
					);
				});
			}}
			mapTypeToElement={{
				roundDisplay: (_item, isFirstClass) => (
					<>
						<div
							className={cn('w-full  rounded-xl max-w-md ring-2', isFirstClass)}
						>
							<RoundDisplay round={currentRound} />
						</div>
						<RoundTimer startTimestamp={roundTimestamps[currentRound].start} />
					</>
				),
				character: (item, isFirstClass) => (
					<>
						<div
							className={cn('w-full max-w-md rounded-xl ring-2', isFirstClass)}
						>
							<CharacterCard
								character={item.element}
								onStateChange={updateState}
							/>
						</div>
						<CharacterTimer
							uuid={item.element.uuid}
							currentCharacterUuid={activeCharacter?.uuid}
							characterTurnTimestamps={characterTurnTimestamps}
							getCurrentTurnTime={getCurrentTurnTime}
						/>
					</>
				),
			}}
		/>
	);

	return (
		<main className="p-4 flex flex-col gap-4">
			<header className="flex items-center justify-between border-b pb-2">
				<h2 className="scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
					{encounterData?.name ?? 'Encounter Name'}
				</h2>
				<Clock startTimestamp={startTimestamp} />
			</header>
			<section className="flex items-center gap-4 flex-wrap max-w-full">
				<h2 className="scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
					Round
				</h2>
				<Timeline currentTurn={currentRound} events={[]} />
				<Button
					onClick={() => encounterStore$.executeCommand(new NextTurnCommand())}
				>
					{currentRound > 0 ? 'Next Turn' : 'Start Encounter'}
				</Button>
				<Button
					variant="outline"
					onClick={() => encounterStore$.undo()}
					disabled={undoQueue.length === 0}
				>
					<Undo2 className="mr-1" /> Undo
				</Button>
				<Button
					variant="outline"
					onClick={() => encounterStore$.redo()}
					disabled={redoQueue.length === 0}
				>
					<Redo2 className="mr-1" /> Redo
				</Button>
			</section>
			<section>
				<QuickAccessGrid
					characters={quickAccessCharacters}
					onStateChange={handleQuickAccess}
				/>
			</section>
			<section className="mt-4">
				<h3 className="font-semibold text-base mb-2">Encounter Order</h3>
				{initiativeRenderQueue}
			</section>
			<details className="mt-4">
				<summary className="cursor-pointer font-mono text-xs">
					Command Stack Debug
				</summary>
				<div className="flex flex-col gap-2 mt-2">
					<div>
						<strong>Undo Stack:</strong>
						<ol className="list-disc pl-4 text-xs">
							{undoQueue.map((cmd, i) => (
								<li key={i}>
									{cmd?.type || cmd?.constructor?.name || 'Unknown'}
								</li>
							))}
						</ol>
					</div>
					<div>
						<strong>Redo Stack:</strong>
						<ol className="list-disc pl-4 text-xs">
							{redoQueue.map((cmd, i) => (
								<li key={i}>
									{cmd?.type || cmd?.constructor?.name || 'Unknown'}
								</li>
							))}
						</ol>
					</div>
				</div>
			</details>
		</main>
	);
}

function RoundDisplay({ round }: { round: number }) {
	return (
		<Card className={'w-full max-w-md p-2 px-4'}>
			<span className="font-semibold m-auto">
				{round > 0 ? `Round ${round}` : 'Start of Encounter'}
			</span>
		</Card>
	);
}

function RoundTimer({ startTimestamp }: { startTimestamp: number }) {
	return (
		<span className="text-xs text-muted-foreground font-mono ml-2">
			<Clock startTimestamp={startTimestamp} />
		</span>
	);
}
