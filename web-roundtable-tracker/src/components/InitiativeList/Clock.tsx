import { useState, useEffect } from 'react';

export function TimeDisplay({ seconds }: { seconds: number }) {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	return (
		<span className="font-mono text-lg">
			{hours > 0 ? `${hours}:` : ''}
			{hours > 0 ? String(minutes).padStart(2, '0') : minutes}:
			{String(secs).padStart(2, '0')}
		</span>
	);
}

export function Clock({ startTimestamp }: { startTimestamp: number }) {
	const [now, setNow] = useState(Date.now());

	useEffect(() => {
		const interval = setInterval(() => setNow(Date.now()), 1000);

		return () => clearInterval(interval);
	}, []);

	const elapsed = Math.max(0, now - startTimestamp);
	const totalSeconds = Math.floor(elapsed / 1000);

	return <TimeDisplay seconds={totalSeconds} />;
}
