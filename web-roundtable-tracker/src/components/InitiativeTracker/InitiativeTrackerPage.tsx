import { Fragment, useMemo, useState } from 'react';
import { trackerMockData, type TrackerParticipant } from './mockData';
import Timeline from '@/components/InitiativeList/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	ArrowLeft,
	ArrowRight,
	ArrowUpDown,
	History,
	Redo2,
	SkipForward,
	Undo2,
} from 'lucide-react';

function getParticipantAccent(role: TrackerParticipant['role']) {
	switch (role) {
		case 'pc':
			return {
				badge: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-sky-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-sky-400',
				name: 'text-sky-200',
				activeCard:
					'border-sky-300 bg-sky-600 text-sky-50 shadow-lg shadow-sky-950/30',
				delayedCard: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
			};
		case 'opponent':
			return {
				badge: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-rose-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-rose-400',
				name: 'text-rose-200',
				activeCard:
					'border-rose-300 bg-rose-700 text-rose-50 shadow-lg shadow-rose-950/30',
				delayedCard: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
			};
		case 'neutral':
			return {
				badge: 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-violet-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-violet-400',
				name: 'text-violet-200',
				activeCard:
					'border-violet-300 bg-violet-700 text-violet-50 shadow-lg shadow-violet-950/30',
				delayedCard: 'border-violet-500/50 bg-violet-500/10 text-violet-200',
			};
		case 'hazard':
			return {
				badge: 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-amber-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-amber-400',
				name: 'text-amber-200',
				activeCard:
					'border-amber-300 bg-amber-600 text-amber-950 shadow-lg shadow-amber-950/30',
				delayedCard: 'border-amber-500/50 bg-amber-500/10 text-amber-200',
			};
		case 'reinforcement':
		default:
			return {
				badge: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-emerald-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-emerald-400',
				name: 'text-emerald-200',
				activeCard:
					'border-emerald-300 bg-emerald-600 text-emerald-50 shadow-lg shadow-emerald-950/30',
				delayedCard: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
			};
	}
}

function ParticipantRow({
	participant,
	onSelect,
	selected,
}: {
	participant: TrackerParticipant;
	onSelect: (id: string) => void;
	selected: boolean;
}) {
	return (
		<button
			type="button"
			onClick={() => onSelect(participant.id)}
			className={[
				'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
				selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
			].join(' ')}
		>
			<div>
				<p className="text-sm font-semibold">{participant.name}</p>
				<p className="text-xs text-muted-foreground">{participant.state}</p>
			</div>
			<Badge variant="secondary">{participant.hpLabel}</Badge>
		</button>
	);
}

function ParticipantDetails({ participant }: { participant: TrackerParticipant | null }) {
	if (!participant) {
		return (
			<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
				Select a participant trigger to view details here.
			</div>
		);
	}

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<h3 className="text-lg font-semibold">{participant.name}</h3>
				<Badge>{participant.role}</Badge>
				<Badge variant="secondary">{participant.state}</Badge>
			</div>
			<p className="text-sm text-muted-foreground">HP estimate: {participant.hpLabel}</p>
			<p className="text-sm">{participant.notes}</p>
		</div>
	);
}

function InitiativeCarouselCard({
	participant,
	selected,
	onSelect,
	isCurrent,
}: {
	participant: TrackerParticipant;
	selected: boolean;
	onSelect: (id: string) => void;
	isCurrent: boolean;
}) {
	const accent = getParticipantAccent(participant.role);

	return (
		<button
			type="button"
			onClick={() => onSelect(participant.id)}
			className={[
				'group flex min-h-28 w-full min-w-0 flex-wrap items-center gap-4 rounded-xl border px-4 py-6 text-left transition-all',
				isCurrent ? accent.activeCard : `${accent.inactiveCard} ${accent.inactiveMarker}`,
				selected ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : '',
			].join(' ')}
		>
			<div className="flex min-w-0 flex-1 items-center gap-4">
				<div className="min-w-0 space-y-2">
					<div className="flex flex-wrap items-center gap-2">
						<p
							className={[
								'min-w-0 break-words text-base font-semibold',
								!isCurrent ? accent.name : '',
							].join(' ')}
						>
							{participant.name}
						</p>
						<Badge className={accent.badge}>{participant.role}</Badge>
						<Badge variant={isCurrent ? 'secondary' : 'outline'}>{participant.state}</Badge>
					</div>
					<p
						className={[
							'text-sm',
							isCurrent ? 'text-current/80' : 'text-slate-300',
						].join(' ')}
					>
						{participant.notes}
					</p>
					<div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em]">
						<span className="rounded-full border border-current/20 px-2 py-1 text-current/80">
							HP {participant.hpLabel}
						</span>
						<span className="rounded-full border border-current/20 px-2 py-1 text-current/80">
							Quick action swipe
						</span>
					</div>
				</div>
			</div>
			<div className="flex min-w-0 flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-current/70">
				<div className="flex items-center gap-1 rounded-full border border-current/20 px-3 py-2">
					<ArrowLeft className="h-4 w-4" /> Delay
				</div>
				<div className="flex items-center gap-1 rounded-full border border-current/20 px-3 py-2">
					KO <ArrowRight className="h-4 w-4" />
				</div>
			</div>
		</button>
	);
}

function NextRoundMarkerCard({ nextRound }: { nextRound: number }) {
	return (
		<div className="flex min-h-28 w-full min-w-0 items-center justify-center rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-6 text-center">
			<div className="space-y-1">
				<p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
					Next Round
				</p>
				<p className="text-xl font-semibold tabular-nums text-primary">{nextRound}</p>
			</div>
		</div>
	);
}

function DelayedMarkerCard({
	participant,
	selected,
	onSelect,
}: {
	participant: TrackerParticipant;
	selected: boolean;
	onSelect: (id: string) => void;
}) {
	const accent = getParticipantAccent(participant.role);

	return (
		<button
			type="button"
			onClick={() => onSelect(participant.id)}
			className={[
				'flex h-full w-full min-w-0 items-center justify-center rounded-xl border border-dashed px-4 py-3 text-center',
				accent.delayedCard,
				selected ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : '',
			].join(' ')}
		>
			<div className="space-y-1">
				<p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
					Delayed
				</p>
				<p className="text-base font-semibold text-primary">{participant.name}</p>
			</div>
		</button>
	);
}

export function InitiativeTrackerPage() {
	const [selectedParticipantId, setSelectedParticipantId] = useState(
		trackerMockData.initiativeParticipants[0]?.id ?? null
	);
	const [reorderOpen, setReorderOpen] = useState(false);
	const currentInitiativeParticipantId = trackerMockData.initiativeParticipants[0]?.id ?? null;

	const allParticipants = useMemo(
		() => [
			...trackerMockData.initiativeParticipants,
			...trackerMockData.outOfInitiative.reinforcements,
			...trackerMockData.outOfInitiative.delayed,
			...trackerMockData.outOfInitiative.hazards,
		],
		[]
	);

	const selectedParticipant =
		allParticipants.find((p) => p.id === selectedParticipantId) ?? null;
	const nextRound = trackerMockData.currentRound + 1;
	const nextRoundMarkerIndex = Math.max(
		1,
		Math.floor(trackerMockData.initiativeParticipants.length / 2)
	);

	return (
		<main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
			<header className="flex flex-col gap-2 rounded-xl border bg-card p-4 lg:hidden lg:flex-row lg:items-start lg:justify-between">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight">
						{trackerMockData.encounterTitle}
					</h1>
					<p className="text-sm text-muted-foreground">{trackerMockData.threatLevel}</p>
				</div>
				<div className="text-right">
					<p className="text-xs text-muted-foreground">Last turn {trackerMockData.turnTimers.lastTurn}</p>
					<p className="text-2xl font-semibold tabular-nums">
						{trackerMockData.turnTimers.currentTurn}
					</p>
				</div>
			</header>

			<section className="hidden lg:grid lg:h-[calc(100vh-8rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-4">
				<Card className="min-w-0 p-4 lg:col-span-2">
					<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
						<div className="min-w-0 space-y-3">
							<div className="min-w-0 space-y-1">
								<h1 className="truncate text-2xl font-semibold tracking-tight">
									{trackerMockData.encounterTitle}
								</h1>
								<p className="text-sm text-muted-foreground">
									{trackerMockData.threatLevel}
								</p>
							</div>
							<div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button aria-label="Next Turn" variant="secondary" size="icon">
											<SkipForward className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Next Turn</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Focus Current"
											variant="secondary"
											size="icon"
											className="border border-sky-500/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
										>
											<History className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Focus Current</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="End Encounter"
											variant="secondary"
											size="icon"
											className="border border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
										>
											<ArrowRight className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">End Encounter</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button aria-label="Manual Reorder" size="icon" onClick={() => setReorderOpen(true)}>
											<ArrowUpDown className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Manual Reorder</TooltipContent>
								</Tooltip>
								<div className="inline-flex items-center overflow-hidden rounded-md border border-input">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												aria-label="Undo"
												variant="ghost"
												size="icon"
												className="rounded-none border-0"
											>
												<Undo2 className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">Undo</TooltipContent>
									</Tooltip>
									<div className="h-6 w-px bg-border" />
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												aria-label="Redo"
												variant="ghost"
												size="icon"
												className="rounded-none border-0"
											>
												<Redo2 className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">Redo</TooltipContent>
									</Tooltip>
								</div>
							</div>
						</div>

						<div className="min-w-0 space-y-3 pl-4">
							<div className="flex min-w-0 items-center justify-between gap-3">
								<div />
								<div className="text-right">
									<p className="text-xs text-muted-foreground">
										Last turn {trackerMockData.turnTimers.lastTurn}
									</p>
									<p className="text-lg font-semibold tabular-nums">
										{trackerMockData.turnTimers.currentTurn}
									</p>
								</div>
							</div>
							<Timeline
								currentTurn={trackerMockData.currentRound}
								events={trackerMockData.timeline.map((event) => ({
									round: event.round,
									label: event.title,
									description: event.detail,
								}))}
								futureTurns={5}
							/>
						</div>
					</div>
				</Card>

				<div className="grid h-full min-h-0 min-w-0 gap-4 lg:grid-rows-[minmax(0,2fr)_minmax(0,1fr)]">
					<Card className="flex min-h-0 min-w-0 flex-col overflow-hidden gap-0 p-4">
						<div className="min-h-0 min-w-0 flex-1 overflow-hidden">
							<Carousel
      							orientation="vertical"
								opts={{ align: "start", dragFree: true }}
								className="h-[calc(100%-3rem)] pt-4 mt-4"
							>
								<CarouselContent className="h-full pt-7">
									{trackerMockData.initiativeParticipants.map((participant, index) => (
										<Fragment key={participant.id}>
											{index === nextRoundMarkerIndex ? (
												<CarouselItem
													key="next-round-marker"
													className="min-w-0 basis-[9.5rem]"
												>
													<NextRoundMarkerCard nextRound={nextRound} />
												</CarouselItem>
											) : null}
											<CarouselItem
												key={participant.id}
												className={[
													'min-w-0',
													participant.state === 'delayed' ? 'basis-[6.75rem]' : 'basis-[9.5rem]',
												].join(' ')}
											>
												{participant.state === 'delayed' ? (
													<DelayedMarkerCard
														participant={participant}
														selected={participant.id === selectedParticipantId}
														onSelect={setSelectedParticipantId}
													/>
												) : (
													<InitiativeCarouselCard
														participant={participant}
														selected={participant.id === selectedParticipantId}
														onSelect={setSelectedParticipantId}
														isCurrent={participant.id === currentInitiativeParticipantId}
													/>
												)}
											</CarouselItem>
										</Fragment>
									))}
								</CarouselContent>
								<CarouselPrevious/>
								<CarouselNext className="-mb-4"/>
							</Carousel>
						</div>
					</Card>

					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<Tabs defaultValue="reinforcements" className="flex min-h-0 flex-1 flex-col">
							<TabsList className="grid w-full grid-cols-3">
								<TabsTrigger value="reinforcements">Reinforcements</TabsTrigger>
								<TabsTrigger value="delaying">Delaying</TabsTrigger>
								<TabsTrigger value="hazards">Simple Hazards</TabsTrigger>
							</TabsList>
							<TabsContent value="reinforcements" className="mt-3 min-h-0 flex-1">
								<ScrollArea className="h-full pr-3">
									<div className="space-y-2">
										{trackerMockData.outOfInitiative.reinforcements.map((participant) => (
											<ParticipantRow
												key={participant.id}
												participant={participant}
												onSelect={setSelectedParticipantId}
												selected={participant.id === selectedParticipantId}
											/>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="delaying" className="mt-3 min-h-0 flex-1">
								<ScrollArea className="h-full pr-3">
									<div className="space-y-2">
										{trackerMockData.outOfInitiative.delayed.map((participant) => (
											<ParticipantRow
												key={participant.id}
												participant={participant}
												onSelect={setSelectedParticipantId}
												selected={participant.id === selectedParticipantId}
											/>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="hazards" className="mt-3 min-h-0 flex-1">
								<ScrollArea className="h-full pr-3">
									<div className="space-y-2">
										{trackerMockData.outOfInitiative.hazards.map((participant) => (
											<ParticipantRow
												key={participant.id}
												participant={participant}
												onSelect={setSelectedParticipantId}
												selected={participant.id === selectedParticipantId}
											/>
										))}
									</div>
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</Card>
				</div>

				<div className="grid h-full min-h-0 min-w-0 gap-4 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">

					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<Tabs defaultValue="description" className="flex min-h-0 flex-1 flex-col">
							<TabsList className="grid w-full grid-cols-4">
								<TabsTrigger value="description">Description</TabsTrigger>
								<TabsTrigger value="events">Narrative Events</TabsTrigger>
								<TabsTrigger value="history">Command History</TabsTrigger>
								<TabsTrigger value="stats">Turn Stats</TabsTrigger>
							</TabsList>
							<TabsContent value="description" className="mt-3 min-h-0 flex-1 text-sm">
								<ScrollArea className="h-full pr-3">
									<p>{trackerMockData.description}</p>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="events" className="mt-3 min-h-0 flex-1">
								<ScrollArea className="h-full pr-3">
									<ul className="space-y-2 text-sm">
										{trackerMockData.narrativeDetails.map((event) => (
											<li key={event} className="rounded-md border p-2">
												{event}
											</li>
										))}
									</ul>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="history" className="mt-3 min-h-0 flex-1">
								<ScrollArea className="h-full pr-3">
									<ul className="space-y-2 text-sm">
										{trackerMockData.historyPreview.map((entry) => (
											<li key={entry} className="rounded-md border p-2">
												{entry}
											</li>
										))}
									</ul>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="stats" className="mt-3 min-h-0 flex-1 text-sm">
								<ScrollArea className="h-full pr-3">
									<p>Average turn duration data will be connected in MVP.</p>
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</Card>

					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<ScrollArea className="h-full pr-3">
							<ParticipantDetails participant={selectedParticipant} />
						</ScrollArea>
					</Card>
				</div>
			</section>

			<section className="space-y-4 lg:hidden">
				<Card className="space-y-3 p-4">
					<h2 className="text-base font-semibold">Initiative Controls</h2>
					<div className="flex flex-wrap gap-2">
						<Button size="sm">
							<SkipForward className="mr-2 h-4 w-4" /> Next Turn
						</Button>
						<Button size="sm" variant="outline" onClick={() => setReorderOpen(true)}>
							<ArrowUpDown className="mr-2 h-4 w-4" /> Reorder
						</Button>
						<Button size="sm" variant="outline">
							<Undo2 className="mr-2 h-4 w-4" /> Undo
						</Button>
						<Button size="sm" variant="outline">
							<Redo2 className="mr-2 h-4 w-4" /> Redo
						</Button>
					</div>
				</Card>

				<Card className="p-4">
					<Tabs defaultValue="inactive">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="inactive">Inactive Participants</TabsTrigger>
							<TabsTrigger value="carousel">Horizontal Carousel</TabsTrigger>
						</TabsList>
						<TabsContent value="inactive" className="mt-3 space-y-2">
							{[
								...trackerMockData.outOfInitiative.reinforcements,
								...trackerMockData.outOfInitiative.delayed,
								...trackerMockData.outOfInitiative.hazards,
							].map((participant) => (
								<ParticipantRow
									key={participant.id}
									participant={participant}
									onSelect={setSelectedParticipantId}
									selected={participant.id === selectedParticipantId}
								/>
							))}
						</TabsContent>
						<TabsContent value="carousel" className="mt-3">
							<div className="flex gap-2 overflow-x-auto pb-1">
								{trackerMockData.initiativeParticipants.map((participant) => (
									participant.state === 'delayed' ? (
										<div
											key={participant.id}
											className="flex min-h-20 min-w-52 items-center justify-center rounded-md border border-dashed border-primary/50 bg-primary/5 p-2 text-center"
										>
											<div>
												<p className="text-xs font-medium uppercase tracking-[0.22em] text-primary/80">
													Delayed
												</p>
												<p className="text-sm font-semibold text-primary">{participant.name}</p>
											</div>
										</div>
									) : (
										<button
											type="button"
											key={participant.id}
											onClick={() => setSelectedParticipantId(participant.id)}
											className="min-w-52 rounded-md border p-2 text-left"
										>
											<p className="text-sm font-medium">{participant.name}</p>
											<p className="text-xs text-muted-foreground">{participant.state}</p>
										</button>
									)
								))}
							</div>
						</TabsContent>
					</Tabs>
				</Card>

				<Card className="p-4">
					<Tabs defaultValue="general">
						<TabsList className="grid w-full grid-cols-2">
							<TabsTrigger value="general">General Info</TabsTrigger>
							<TabsTrigger value="selected">Selected Participant</TabsTrigger>
						</TabsList>
						<TabsContent value="general" className="mt-3 text-sm">
							<p>{trackerMockData.description}</p>
							<div className="mt-4">
								<Timeline
									currentTurn={trackerMockData.currentRound}
									events={trackerMockData.timeline.map((event) => ({
										round: event.round,
										label: event.title,
										description: event.detail,
									}))}
									futureTurns={5}
								/>
							</div>
						</TabsContent>
						<TabsContent value="selected" className="mt-3">
							<ParticipantDetails participant={selectedParticipant} />
						</TabsContent>
					</Tabs>
				</Card>
			</section>

			<Dialog open={reorderOpen} onOpenChange={setReorderOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Manual Reorder Draft</DialogTitle>
						<DialogDescription>
							This PoC dialog mirrors the initiative list in a separate draft space. Drag and save behavior will be enabled in MVP.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						{trackerMockData.initiativeParticipants.map((participant) => (
							<div key={participant.id} className="rounded-md border p-2 text-sm">
								{participant.name}
							</div>
						))}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setReorderOpen(false)}>
							Cancel
						</Button>
						<Button disabled>Save Order</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
