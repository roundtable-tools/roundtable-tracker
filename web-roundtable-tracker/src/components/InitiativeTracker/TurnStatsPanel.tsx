import { useMemo } from 'react';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { formatDuration, getTurnStats } from '@/store/encounterTimer';
import { getSideAccent } from './sideAccent';

/**
 * Finished turns per participant (count, average, longest, total), totals
 * for PCs and GM-owned participants, and the length of each finished round.
 * The turn in progress isn't counted until it ends.
 */
export function TurnStatsPanel() {
	const timer = useEncounterStore((state) => state.timer);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const trackerMetaMap = useEncounterStore((state) => state.trackerMetaMap);

	const rows = useMemo(
		() =>
			getTurnStats(timer?.turnLog ?? []).map((stats) => ({
				...stats,
				name: charactersMap[stats.participantId]?.name ?? 'Removed',
				sideTheme: trackerMetaMap[stats.participantId]?.sideTheme ?? 'other',
			})),
		[timer?.turnLog, charactersMap, trackerMetaMap]
	);

	if (rows.length === 0) {
		return (
			<p className="text-sm text-muted-foreground">
				No finished turns yet. Times appear here as turns end.
			</p>
		);
	}

	const sum = (filter: (row: (typeof rows)[number]) => boolean) =>
		rows.filter(filter).reduce(
			(total, row) => ({
				turns: total.turns + row.turns,
				totalMs: total.totalMs + row.totalMs,
			}),
			{ turns: 0, totalMs: 0 }
		);
	const sides = [
		{ label: 'PCs', ...sum((row) => row.sideTheme === 'pc') },
		{ label: 'GM-owned', ...sum((row) => row.sideTheme !== 'pc') },
	];

	return (
		<div className="space-y-4 text-sm">
			<table className="w-full tabular-nums">
				<thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
					<tr>
						<th className="py-1 font-medium">Participant</th>
						<th className="py-1 text-right font-medium">Turns</th>
						<th className="py-1 text-right font-medium">Average</th>
						<th className="py-1 text-right font-medium">Longest</th>
						<th className="py-1 text-right font-medium">Total</th>
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={row.participantId}
							data-slot="turn-stats-row"
							className="border-t border-border/50"
						>
							<td className={`py-1 ${getSideAccent(row.sideTheme).name}`}>
								{row.name}
							</td>
							<td className="py-1 text-right">{row.turns}</td>
							<td className="py-1 text-right">
								{formatDuration(row.averageMs)}
							</td>
							<td className="py-1 text-right">
								{formatDuration(row.longestMs)}
							</td>
							<td className="py-1 text-right">{formatDuration(row.totalMs)}</td>
						</tr>
					))}
				</tbody>
			</table>

			<dl className="grid grid-cols-2 gap-2">
				{sides.map((side) => (
					<div key={side.label} className="rounded-md border p-2">
						<dt className="text-xs uppercase tracking-wide text-muted-foreground">
							{side.label}
						</dt>
						<dd className="tabular-nums">
							{side.turns} turns · {formatDuration(side.totalMs)} total
							{side.turns > 0 &&
								` · ${formatDuration(side.totalMs / side.turns)} average`}
						</dd>
					</div>
				))}
			</dl>

			{(timer?.roundLog.length ?? 0) > 0 && (
				<p className="text-muted-foreground tabular-nums">
					Finished rounds:{' '}
					{timer?.roundLog
						.map(
							({ round, durationMs }) =>
								`round ${round} ${formatDuration(durationMs)}`
						)
						.join(', ')}
				</p>
			)}
		</div>
	);
}
