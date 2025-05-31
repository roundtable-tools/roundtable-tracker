import { Clock, TimeDisplay } from './Clock';

interface CharacterTimerProps {
	uuid: string;
	currentCharacterUuid?: string;
	characterTurnTimestamps: Record<
		string,
		{ start: number; end?: number; duration?: number }
	>;
	getCurrentTurnTime: (uuid: string) => number;
}

export function CharacterTimer({
	uuid,
	currentCharacterUuid,
	characterTurnTimestamps,
	getCurrentTurnTime,
}: CharacterTimerProps) {
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
