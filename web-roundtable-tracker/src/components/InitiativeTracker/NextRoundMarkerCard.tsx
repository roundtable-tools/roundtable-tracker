/** Marks where the current round ends in an initiative list. */
export function NextRoundMarkerCard({
	nextRound,
	compact = false,
}: {
	nextRound: number;
	compact?: boolean;
}) {
	return (
		<div
			className={[
				'flex w-full min-w-0 items-center justify-center rounded-xl text-center',
				compact ? 'h-full min-h-0 px-3 py-4' : 'min-h-15 px-4 py-4',
			].join(' ')}
		>
			<div className="space-y-1">
				<p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
					Next Round
				</p>
				<p className="text-xl font-semibold tabular-nums text-primary">
					{nextRound}
				</p>
			</div>
		</div>
	);
}
