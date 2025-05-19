import { useEncounterStore } from '@/store/instance';
import { useEffect, useRef, useState } from 'react';
import { Timeline, TimelineEvent } from './Timeline';
import { Button } from '@/components/ui/button';
import { Clock, TimeDisplay } from './Clock';
import { generateUUID, UUID } from '@/utils/uuid';
import { CharacterCard, QuickAccessGrid } from './CharacterCard';
import { Character } from '@/store/data';
import { observable } from '@legendapp/state';
import { Card } from '../ui/card';

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
	populateInitiativeQueue: (characters: Character[]) => {
		encounterStore$.initiativeQueue.set(
			characters.map(
				(character) =>
					({
						type: 'character',
						element: { ...character },
					}) as const
			)
		);

		encounterStore$.initiativeQueue.push({
			type: 'roundDisplay',
			element: {
				uuid: generateUUID(),
			},
		});
	},
});

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
	const [currentRound, setCurrentRound] = useState(1);

	const characters = Object.values(charactersMap);

	useEffect(() => {
		encounterStore$.populateInitiativeQueue(Object.values(charactersMap));
	}, [charactersMap]);

	const initiativeQueue = encounterStore$.initiativeQueue.get();

	const [roundTimestamps, setRoundTimestamps] = useState<RoundTimestamps[]>([]);

	// Track character turn timings
	const [characterTurnTimestamps, setCharacterTurnTimestamps] = useState<
		Record<string, { start: number; end?: number; duration?: number }>
	>({});
	const activeCharacterRef = useRef<string | null>(null);

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

	// Advance to next round, recording end/start timestamps
	const handleNextRound = () => {
		setCurrentRound((prev) => prev + 1);
	};

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

	// Helper to get the current character (first in list for now)
	const currentCharacter = characters[0];
	const lastCharacter = characters[characters.length - 1];

	// Start timing when a character becomes active
	useEffect(() => {
		if (!currentCharacter) return;
		if (activeCharacterRef.current !== currentCharacter.uuid) {
			// End previous character's turn
			if (activeCharacterRef.current) {
				setCharacterTurnTimestamps((prev) => {
					const prevData = prev[activeCharacterRef.current!];
					if (!prevData || prevData.end) return prev;

					return {
						...prev,
						[activeCharacterRef.current!]: {
							...prevData,
							end: Date.now(),
							duration: Date.now() - prevData.start,
						},
					};
				});
			}
			// Start new character's turn
			setCharacterTurnTimestamps((prev) => ({
				...prev,
				[currentCharacter.uuid]: { start: Date.now() },
			}));
			activeCharacterRef.current = currentCharacter.uuid;
		}
	}, [currentCharacter, currentCharacter?.uuid]);

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

				<Button onClick={handleNextRound}>Next Turn</Button>
			</section>

			<section>
				<QuickAccessGrid
					characters={quickAccessCharacters}
					onStateChange={handleQuickAccess}
				/>
			</section>

			<section className="mt-4">
				<h3 className="font-semibold text-base mb-2">Encounter Order</h3>
				<ul className="flex flex-col gap-2">
					{initiativeQueue.map((item) => {
						if (item.type === 'roundDisplay') {
							return (
								<li key={item.element.uuid} className="flex items-center gap-2">
									<RoundDisplay round={currentRound} />
								</li>
							);
						} else if (item.type === 'character') {
							return (
								<li key={item.element.uuid} className="flex items-center gap-2">
									<CharacterCard character={item.element} />

									<CharacterTimer
										uuid={item.element.uuid}
										currentCharacterUuid={currentCharacter?.uuid}
										characterTurnTimestamps={characterTurnTimestamps}
										getCurrentTurnTime={getCurrentTurnTime}
									/>
								</li>
							);
						}
					})}
				</ul>
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

function CharacterTimer({
	uuid,
	currentCharacterUuid,
	characterTurnTimestamps,
	getCurrentTurnTime,
}: {
	uuid: string;
	currentCharacterUuid?: string;
	characterTurnTimestamps: Record<
		string,
		{ start: number; end?: number; duration?: number }
	>;
	getCurrentTurnTime: (uuid: string) => number;
}) {
	const isCurrent = uuid === currentCharacterUuid;

	return (
		<span className="text-xs text-muted-foreground font-mono ml-2">
			{isCurrent ? (
				<Clock
					startTimestamp={characterTurnTimestamps[uuid]?.start ?? Date.now()}
				/>
			) : (
				<TimeDisplay seconds={Math.floor(getCurrentTurnTime(uuid) / 1000)} />
			)}
		</span>
	);
}
