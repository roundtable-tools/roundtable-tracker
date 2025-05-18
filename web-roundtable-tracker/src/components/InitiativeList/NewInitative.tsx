import { useEncounterStore } from '@/store/instance';
import { useState, useEffect } from 'react';
import { Timeline, TimelineEvent } from './Timeline';
import { Button } from '@/components/ui/button';

function Clock({ startTimestamp }: { startTimestamp: number }) {
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 1000);

		return () => clearInterval(interval);
	}, []);

	const elapsed = Math.max(0, now - startTimestamp);
	const totalSeconds = Math.floor(elapsed / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	return (
		<span className="font-mono text-lg">
			{hours > 0 ? `${hours}:` : ''}
			{hours > 0 ? String(minutes).padStart(2, '0') : minutes}:
			{String(seconds).padStart(2, '0')}
		</span>
	);
}

export function NewInitiative() {
	const encounterData = useEncounterStore((state) => state.encounterData);
	const charactersMap = useEncounterStore((state) => state.charactersMap);

	const characters = Object.values(charactersMap);

	const [startTimestamp] = useState<number>(new Date().getTime());
	const [currentTurn, setCurrentTurn] = useState(1);

	// Example events for demonstration
	const events: TimelineEvent[] = [
		{
			turn: 2,
			label: 'Trap Triggered',
			description: 'A hidden trap activates.',
		},
		{ turn: 4, label: 'Reinforcements', description: 'More enemies arrive.' },
		{ turn: 4, label: 'Reinforcements', description: 'More enemies arrive.' },
	];

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
					Turn
				</h2>
				<Timeline currentTurn={currentTurn} events={events} />

				<Button onClick={() => setCurrentTurn((t) => t + 1)}>Next Turn</Button>
			</section>

			<section className="mt-4">
				<ul className="mt-2">
					{characters.map((character) => (
						<li key={character.uuid} className="py-2">
							<span>{character.name}</span>
							<span className="ml-4">{character.initiative}</span>
						</li>
					))}
				</ul>
			</section>
		</main>
	);
}
