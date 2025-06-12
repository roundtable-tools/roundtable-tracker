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
import encounterStore$ from './initiativeStore';
import { isCharacter } from './initiativeHelpers';
import { InitiativeQueueList } from './InitiativeQueueList';

import { Character } from '@/store/data';

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

	const characterTurnTimestamps = use$(encounterStore$.characterTurnTimestamps);

	const quickAccessCharacters = characters.filter(
		(c) => c.turnState === 'on-hold' || c.turnState === 'delayed'
	);

	const handleQuickAccess = (
		uuid: string,
		newState: Character['turnState']
	) => {
		// Placeholder for state update
	};

	const getCurrentTurnTime = (uuid: string): number => {
		const timestamp = characterTurnTimestamps[uuid];
		if (!timestamp) return 0;
		return timestamp.end
			? timestamp.end - timestamp.start
			: Date.now() - timestamp.start;
	};

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
				<Button onClick={encounterStore$.nextTurn}>
					{currentRound > 0 ? 'Next Turn' : 'Start Encounter'}
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
