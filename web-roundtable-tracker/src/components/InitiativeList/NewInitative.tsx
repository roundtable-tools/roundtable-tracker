import { useEncounterStore } from '@/store/instance';
import { useEffect, useState } from 'react';
import { Timeline, TimelineEvent } from './Timeline';
import { Button } from '@/components/ui/button';
import { Clock } from './Clock';
import { generateUUID, UUID } from '@/utils/uuid';
import { CharacterCard, QuickAccessGrid } from './CharacterCard';
import { Character } from '@/store/data';
import { observable } from '@legendapp/state';
import { Card } from '../ui/card';
import { use$ } from '@legendapp/state/react';
import { CharacterTimer } from './CharacterTimer';
import type { InitiativeElement } from './InitiativeElement';
import { cn } from '@/lib/utils';

type InitiativeElement =
	| {
			type: 'character';
			element: Character;
	  }
	| {
			type: 'roundDisplay';
			element: {
				uuid: string;
			};
	  };

const encounterStore$ = observable({
	initiativeQueue: [] as InitiativeElement[],
	activeCharacter: null as Character | null,
	round: 1,
	populateInitiativeQueue: (characters: Character[]) => {
		encounterStore$.initiativeQueue.set(
			characters.map(
				(character) =>
					({
						type: 'character',
						element: { ...character, hasTurn: true },
					}) as const
			)
		);

		encounterStore$.initiativeQueue.push({
			type: 'roundDisplay',
			element: {
				uuid: generateUUID(),
			},
		});

		goToNextActive();
	},
	nextTurn: () => {
		console.log('Next Turn');

		if (encounterStore$.initiativeQueue.length === 0) return;

		const item = encounterStore$.initiativeQueue.shift()!;
		if (isRoundDisplay(item)) {
			encounterStore$.round.set(encounterStore$.round.peek() + 1);
			encounterStore$.initiativeQueue.push({
				type: 'roundDisplay',
				element: {
					uuid: generateUUID(),
				},
			});

			for (const character of encounterStore$.initiativeQueue) {
				if (isCharacter(character.peek())) {
					character.element.assign({
						hasTurn: true,
					});
				}
			}

			console.log('Round:', encounterStore$.initiativeQueue.peek());
		} else if (isCharacter(item)) {
			item.element.hasTurn = false;
			encounterStore$.initiativeQueue.push({
				...item,
				element: {
					...item.element,
					turnState:
						item.element.turnState == 'active'
							? 'normal'
							: item.element.turnState,
					hasTurn: false,
				},
			});
		}
		goToNextActive();
		console.log(
			'Initiative Queue next:',
			encounterStore$.initiativeQueue.peek()
		);
	},
});

const isCharacter = (
	item: InitiativeElement
): item is InitiativeElement & { type: 'character' } =>
	item.type === 'character';
const isRoundDisplay = (
	item: InitiativeElement
): item is InitiativeElement & { type: 'roundDisplay' } =>
	item.type === 'roundDisplay';

function goToNextActive() {
	const queue = encounterStore$.initiativeQueue.peek();
	let result = '';
	while (result != 'endRound' && result !== 'makeActive') {
		if (queue.length === 0) break;
		const item = queue.shift()!;
		result = processInitiativeQueueItem(item);
		if (result === 'makeActive' && isCharacter(item)) {
			encounterStore$.initiativeQueue.unshift({
				...item,
				element: {
					...item.element,
					turnState: 'active',
				},
			});
			console.log('Active Character:');
			encounterStore$.activeCharacter.set(item.element);
		}
		if (result === 'skip' && isCharacter(item)) {
			encounterStore$.initiativeQueue.push({
				...item,
				element: {
					...item.element,
					hasTurn: false,
				},
			});
		}
		if (result === 'endRound') {
			encounterStore$.initiativeQueue.unshift(item);
			console.log('End of round');
			encounterStore$.activeCharacter.set(null);
		}
		console.log('Result:', result);
	}
}
function processInitiativeQueueItem(item: InitiativeElement) {
	if (item.type === 'roundDisplay') return 'endRound';

	const character = item.element;
	if (canBeMadeActive(character)) return 'makeActive';

	return 'skip';
}

function canBeMadeActive(character: Character) {
	if (!character.hasTurn) return false;

	const validStates: Character['turnState'][] = ['active', 'normal', 'delayed'];

	return validStates.includes(character.turnState);
}

// Track start and end timestamps for each round
type RoundTimestamps = {
	id: UUID;
	round: number;
	start: number;
	end?: number;
	duration?: number;
};

export function NewInitiative() {
	const encounterData = useEncounterStore((state) => state.encounterData);
	const charactersMap = useEncounterStore((state) => state.charactersMap);

	const [startTimestamp] = useState<number>(new Date().getTime());
	const currentRound = use$(encounterStore$.round);

	useEffect(() => {
		encounterStore$.populateInitiativeQueue(Object.values(charactersMap));
	}, [charactersMap]);

	const initiativeQueue = use$(encounterStore$.initiativeQueue);
	const activeCharacter = use$(encounterStore$.activeCharacter);

	const characters = initiativeQueue
		.filter(isCharacter)
		.map((item) => item.element);

	const [roundTimestamps, setRoundTimestamps] = useState<RoundTimestamps[]>([]);

	// Track character turn timings
	const [characterTurnTimestamps, setCharacterTurnTimestamps] = useState<
		Record<string, { start: number; end?: number; duration?: number }>
	>({});

	// Example events for demonstration
	const events: TimelineEvent[] = [
		{
			round: 2,
			label: 'Trap Triggered',
			description: 'A hidden trap activates.',
		},
		{ round: 4, label: 'Reinforcements', description: 'More enemies arrive.' },
		{ round: 4, label: 'Reinforcements', description: 'More enemies arrive.' },
	];

	useEffect(() => {
		const roundDuration: RoundTimestamps = {
			id: generateUUID(),
			round: currentRound,
			start: Date.now(),
		};

		return () => {
			roundDuration.end = Date.now();
			roundDuration.duration = roundDuration.end - roundDuration.start;

			setRoundTimestamps((prev) => [...prev, roundDuration]);
		};
	}, [currentRound]);

	useEffect(() => {
		const characterTurnDuration = {
			start: Date.now(),
		};
		console.log('Character Turn Duration:', activeCharacter?.name);

		return () => {
			if (activeCharacter) {
				setCharacterTurnTimestamps((prev) => ({
					...prev,
					[activeCharacter.uuid]: {
						start: characterTurnDuration.start,
						end: Date.now(),
						duration: Date.now() - characterTurnDuration.start,
					},
				}));
			}
		};
	}, [activeCharacter]);

	// Filter characters for quick access (on hold or delayed)
	const quickAccessCharacters = characters.filter(
		(c) => c.turnState === 'on-hold' || c.turnState === 'delayed'
	);

	// Handler to set character to active
	const handleQuickAccess = (
		uuid: string,
		newState: Character['turnState']
	) => {
		// You may need to update the store here, this is a placeholder
		// e.g. useEncounterStore.getState().setCharacterState(uuid, newState)
		// For now, just log
		console.log('Set', uuid, 'to', newState);
	};

	// Helper to get current turn time for a character
	function getCurrentTurnTime(uuid: string) {
		const data = characterTurnTimestamps[uuid];
		if (!data) return 0;
		if (data.end) return data.duration ?? 0;

		return Date.now() - data.start;
	}

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
				<Timeline currentTurn={currentRound} events={events} />

				<Button onClick={encounterStore$.nextTurn}>Next Turn</Button>
			</section>

			<section>
				<QuickAccessGrid
					characters={quickAccessCharacters}
					onStateChange={handleQuickAccess}
				/>
			</section>

			<section className="mt-4">
				<h3 className="font-semibold text-base mb-2">Encounter Order</h3>
				<InitiativeQueueList
					queue={initiativeQueue}
					mapTypeToElement={{
						roundDisplay: (item, isFirstClass) => (
							<li key={item.element.uuid} className="flex items-center gap-2">
								<div
									className={cn(
										'w-full  rounded-xl max-w-md ring-2',
										isFirstClass
									)}
								>
									<RoundDisplay round={currentRound} />
								</div>
							</li>
						),
						character: (item, isFirstClass) => (
							<li key={item.element.uuid} className="flex items-center gap-2">
								<div
									className={cn(
										'w-full max-w-md rounded-xl ring-2',
										isFirstClass
									)}
								>
									<CharacterCard character={item.element} />
								</div>

								<CharacterTimer
									uuid={item.element.uuid}
									currentCharacterUuid={activeCharacter?.uuid}
									characterTurnTimestamps={characterTurnTimestamps}
									getCurrentTurnTime={getCurrentTurnTime}
								/>
							</li>
						),
					}}
				/>
			</section>
			{/* Example: show round durations for debugging */}
			<section className="mt-4">
				<h3 className="font-semibold">Round Durations (ms)</h3>
				<ul>
					{roundTimestamps.map((rs) => (
						<li key={rs.id}>
							Round {rs.round}: {rs.duration ?? 0} ms
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}

function RoundDisplay({ round }: { round: number }) {
	return (
		<Card className={'w-full max-w-md p-2 px-4'}>
			<span className="font-semibold m-auto">Round {round}</span>
		</Card>
	);
}

type ExtractFromUnionByType<T, U> = T extends { type: U } ? T : never;

interface InitiativeQueueListProps {
	queue: InitiativeElement[];
	mapTypeToElement: {
		[K in InitiativeElement['type']]: (
			item: ExtractFromUnionByType<InitiativeElement, K>,
			isFirstClass?: string
		) => JSX.Element;
	};
}

function InitiativeQueueList({
	queue,
	mapTypeToElement,
}: InitiativeQueueListProps) {
	return (
		<ul className="flex flex-col gap-2">
			{queue.map((item, index) => {
				const isFirstClass = index === 0 ? '' : 'ring-transparent';

				return mapTypeToElement[item.type]?.(item as never, isFirstClass);
			})}
		</ul>
	);
}
