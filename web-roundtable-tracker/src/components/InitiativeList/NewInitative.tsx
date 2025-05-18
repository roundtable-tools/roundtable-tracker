import { useEncounterStore } from '@/store/instance';
import { useEffect, useState } from 'react';
import { Timeline, TimelineEvent } from './Timeline';
import { Button } from '@/components/ui/button';
import { Clock } from './Clock';
import { generateUUID, UUID } from '@/utils/uuid';
import { CharacterCard, QuickAccessGrid } from './CharacterCard';
import { Character } from '@/store/data';

export function NewInitiative() {
	const encounterData = useEncounterStore((state) => state.encounterData);
	const charactersMap = useEncounterStore((state) => state.charactersMap);

	const characters = Object.values(charactersMap);

	const [startTimestamp] = useState<number>(new Date().getTime());
	const [currentRound, setCurrentRound] = useState(1);

	// Track start and end timestamps for each round
	type RoundTimestamps = {
		id: UUID;
		round: number;
		start: number;
		end?: number;
		duration?: number;
	};
	const [roundTimestamps, setRoundTimestamps] = useState<RoundTimestamps[]>([]);

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

				<Button onClick={handleNextRound}>Next Round</Button>
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
					{characters.map((character) => (
						<li key={character.uuid}>
							<CharacterCard character={character} />
						</li>
					))}
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
