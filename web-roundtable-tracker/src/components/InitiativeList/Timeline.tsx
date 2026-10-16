import { cn } from '@/lib/utils';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export type TimelineEvent = {
	id?: string;
	round: number;
	label: string;
	description?: string;
	actionLabel?: string;
	onAction?: () => void;
	actionDisabled?: boolean;
};

interface TimelineProps {
	currentTurn: number;
	events: TimelineEvent[];
	futureTurns?: number; // how many turns into the future to show
}

function TimelineItem({
	turn,
	isCurrent,
	events,
	children,
}: {
	turn: number;
	isCurrent: boolean;
	events?: TimelineEvent[];
	children?: React.ReactNode;
}) {
	const hasEvents = events && events.length > 0;
	// An event still needs the GM until its action is done (a triggered
	// reinforcement disables its action); events without an action always do.
	const hasPendingEvents =
		events?.some((event) => !event.actionDisabled) ?? false;

	return (
		<div className="flex items-center relative">
			<Tooltip>
				<TooltipTrigger asChild>
					<div
						className={cn(
							'rounded-full w-8 h-8 flex items-center justify-center border relative',
							isCurrent
								? 'bg-primary text-primary-foreground border-primary'
								: hasEvents
									? 'bg-accent text-accent-foreground border-accent font-semibold'
									: 'bg-muted text-muted-foreground border-muted'
						)}
					>
						<span className="text-base">{turn}</span>
						{hasEvents && events.length > 1 ? (
							<Badge
								data-slot="timeline-event-count"
								className={cn(
									'absolute -top-2 -right-2 pointer-events-none select-none text-[10px] w-4 h-4 flex items-center justify-center p-0',
									hasPendingEvents &&
										'bg-amber-400 text-amber-950 ring-2 ring-background'
								)}
							>
								{events.length}
							</Badge>
						) : (
							hasPendingEvents && (
								<span
									data-slot="timeline-event-dot"
									aria-label="Event to trigger"
									className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-background pointer-events-none"
								/>
							)
						)}
					</div>
				</TooltipTrigger>
				{hasEvents && (
					<TooltipContent side="top">
						{events!.map((event, idx) => (
							<div key={idx} className="mb-2 last:mb-0">
								<div className="font-bold mb-1">{event.label}</div>
								{event.description && (
									<div className="text-xs text-muted-foreground">
										{event.description}
									</div>
								)}
								{event.onAction && event.actionLabel && (
									<Button
										type="button"
										size="sm"
										variant="secondary"
										disabled={event.actionDisabled}
										onClick={(buttonEvent) => {
											buttonEvent.stopPropagation();
											event.onAction?.();
										}}
										className="mt-2 h-7 px-2 text-xs"
									>
										{event.actionLabel}
									</Button>
								)}
							</div>
						))}
					</TooltipContent>
				)}
			</Tooltip>
			{children}
		</div>
	);
}

export function Timeline({
	currentTurn,
	events,
	futureTurns = 4,
}: TimelineProps) {
	const eventMap: Record<number, TimelineEvent[]> = {};
	events.forEach((e) => {
		if (!eventMap[e.round]) eventMap[e.round] = [];
		eventMap[e.round].push(e);
	});
	const startTurn = currentTurn;
	const endTurn = currentTurn + futureTurns;
	const turns = Array.from(
		{ length: endTurn - startTurn + 1 },
		(_, i) => startTurn + i
	);

	return (
		<div className="relative flex items-center gap-0 w-full py-2 pl-2 overflow-x-hidden">
			{turns.map((turn, idx) => (
				<TimelineItem
					key={turn}
					turn={turn}
					isCurrent={turn === currentTurn}
					events={eventMap[turn]}
				>
					{idx < turns.length - 1 && (
						<div className="h-1 w-8 bg-border mx-1 rounded-full" />
					)}
				</TimelineItem>
			))}
			{/* Fading line after the last item */}
			<div className="h-1 w-16 ml-2 rounded-full bg-gradient-to-r from-border/80 to-transparent" />
		</div>
	);
}

export default Timeline;
