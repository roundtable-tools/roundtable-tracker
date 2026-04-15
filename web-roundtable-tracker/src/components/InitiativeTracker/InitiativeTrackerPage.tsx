import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { trackerMockData, type TrackerParticipant } from './mockData';
import Timeline from '@/components/InitiativeList/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	type CarouselApi,
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
	Heart,
	History,
	Redo2,
	ShieldOff,
	SkipForward,
	Undo2,
} from 'lucide-react';
import { Reorder } from 'motion/react';

function logTrackerButton(action: string, details?: Record<string, unknown>) {
	if (details) {
		console.log('[InitiativeTrackerPage]', action, details);
		return;
	}

	console.log('[InitiativeTrackerPage]', action);
}

const HAZARD_DISABLE_CHECK_NAMES = [
	'Disrupted',
	'Compromised',
	'Fracturing',
	'Critical',
	'Disabled',
] as const;

function getHealthLabelFromPercentage(healthPercentage: number) {
	if (healthPercentage <= 0) {
		return 'Unconscious';
	}

	if (healthPercentage >= 100) {
		return 'Uninjured';
	}

	if (healthPercentage >= 85) {
		return 'Barely Injured';
	}

	if (healthPercentage >= 65) {
		return 'Injured';
	}

	if (healthPercentage >= 35) {
		return 'Badly Injured';
	}

	return 'Near Death';
}

function getHazardDisableStageNames(requiredChecks: number) {
	const clampedRequiredChecks = Math.min(Math.max(requiredChecks, 1), 5);

	if (clampedRequiredChecks === 5) {
		return [...HAZARD_DISABLE_CHECK_NAMES];
	}

	if (clampedRequiredChecks === 4) {
		return [
			HAZARD_DISABLE_CHECK_NAMES[0],
			HAZARD_DISABLE_CHECK_NAMES[1],
			HAZARD_DISABLE_CHECK_NAMES[3],
			HAZARD_DISABLE_CHECK_NAMES[4],
		];
	}

	if (clampedRequiredChecks === 3) {
		return [
			HAZARD_DISABLE_CHECK_NAMES[0],
			HAZARD_DISABLE_CHECK_NAMES[2],
			HAZARD_DISABLE_CHECK_NAMES[4],
		];
	}

	if (clampedRequiredChecks === 2) {
		return [HAZARD_DISABLE_CHECK_NAMES[0], HAZARD_DISABLE_CHECK_NAMES[4]];
	}

	return [HAZARD_DISABLE_CHECK_NAMES[4]];
}

function getHazardDisableLabel(participant: TrackerParticipant) {
	const requiredChecks = participant.disableChecksRequired ?? 5;
	const successfulChecks = participant.disableChecksSucceeded ?? 0;

	if (successfulChecks <= 0) {
		return 'Stable';
	}

	const stageNames = getHazardDisableStageNames(requiredChecks);
	const stageIndex = Math.min(Math.max(successfulChecks, 1), requiredChecks) - 1;

	return stageNames[Math.min(stageIndex, stageNames.length - 1)] ?? 'Disabled';
}

function getParticipantIndicatorLabel(participant: TrackerParticipant) {
	if (participant.role === 'hazard') {
		return getHazardDisableLabel(participant);
	}

	const maxHp = participant.maxHp ?? 1;
	const currentHp = participant.currentHp ?? maxHp;
	const healthPercentage = (currentHp / maxHp) * 100;

	return getHealthLabelFromPercentage(healthPercentage);
}

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
		case 'ally':
			return {
				badge: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-emerald-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-emerald-400',
				name: 'text-emerald-200',
				activeCard:
					'border-emerald-300 bg-emerald-600 text-emerald-50 shadow-lg shadow-emerald-950/30',
				delayedCard: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
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
	const indicatorLabel = getParticipantIndicatorLabel(participant);

	return (
		<button
			type="button"
			onClick={() => {
				logTrackerButton('Participant row selected', {
					participantId: participant.id,
					participantName: participant.name,
				});
				onSelect(participant.id);
			}}
			className={[
				'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
				selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
			].join(' ')}
		>
			<div>
				<p className="text-sm font-semibold">{participant.name}</p>
				<p className="text-xs text-muted-foreground">{participant.state}</p>
			</div>
			<Badge variant="secondary">{indicatorLabel}</Badge>
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

	const indicatorLabel = getParticipantIndicatorLabel(participant);
	const isHazard = participant.role === 'hazard';

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<h3 className="text-lg font-semibold">{participant.name}</h3>
				<Badge>{participant.role}</Badge>
				<Badge variant="secondary">{participant.state}</Badge>
			</div>
			{isHazard ? (
				<p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
					<ShieldOff className="h-4 w-4" /> {indicatorLabel}
				</p>
			) : (
				<p className="text-sm text-muted-foreground">Health: {indicatorLabel}</p>
			)}
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
	const SWIPE_REVEAL_PX = 88;
	const SWIPE_INTENT_PX = 10;
	const SWIPE_SNAP_PX = 34;
	const accent = getParticipantAccent(participant.role);
	const indicatorLabel = getParticipantIndicatorLabel(participant);
	const [swipeOffset, setSwipeOffset] = useState(0);
	const [swipeActionFlash, setSwipeActionFlash] = useState<'delay' | 'ko' | null>(null);
	const swipeFlashTimeoutRef = useRef<number | null>(null);
	const swipeStateRef = useRef({
		pointerId: null as number | null,
		startX: 0,
		startY: 0,
		isSwiping: false,
		didDrag: false,
	});

	useEffect(() => {
		return () => {
			if (swipeFlashTimeoutRef.current !== null) {
				window.clearTimeout(swipeFlashTimeoutRef.current);
			}
		};
	}, []);

	const registerSwipeInput = (action: 'delay' | 'ko') => {
		logTrackerButton('Swipe action input', {
			action,
			participantId: participant.id,
			participantName: participant.name,
		});
		setSwipeActionFlash(action);
		if (swipeFlashTimeoutRef.current !== null) {
			window.clearTimeout(swipeFlashTimeoutRef.current);
		}

		swipeFlashTimeoutRef.current = window.setTimeout(() => {
			setSwipeActionFlash(null);
			swipeFlashTimeoutRef.current = null;
		}, 320);
	};

	const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}

		swipeStateRef.current.pointerId = event.pointerId;
		swipeStateRef.current.startX = event.clientX;
		swipeStateRef.current.startY = event.clientY;
		swipeStateRef.current.isSwiping = false;
		swipeStateRef.current.didDrag = false;
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (swipeStateRef.current.pointerId !== event.pointerId) {
			return;
		}

		const deltaX = event.clientX - swipeStateRef.current.startX;
		const deltaY = event.clientY - swipeStateRef.current.startY;

		if (!swipeStateRef.current.isSwiping) {
			if (Math.abs(deltaX) < SWIPE_INTENT_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
				return;
			}
			swipeStateRef.current.isSwiping = true;
		}

		swipeStateRef.current.didDrag = true;
		setSwipeOffset(Math.max(-SWIPE_REVEAL_PX, Math.min(SWIPE_REVEAL_PX, deltaX)));
	};

	const finishSwipe = () => {
		if (!swipeStateRef.current.didDrag) {
			return;
		}

		if (swipeOffset >= SWIPE_SNAP_PX) {
			registerSwipeInput('delay');
			setSwipeOffset(0);
			return;
		}

		if (swipeOffset <= -SWIPE_SNAP_PX) {
			registerSwipeInput('ko');
			setSwipeOffset(0);
			return;
		}

		setSwipeOffset(0);
	};

	const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (swipeStateRef.current.pointerId !== event.pointerId) {
			return;
		}

		finishSwipe();
		swipeStateRef.current.pointerId = null;
		swipeStateRef.current.isSwiping = false;
	};

	const handlePointerCancel = () => {
		swipeStateRef.current.pointerId = null;
		swipeStateRef.current.isSwiping = false;
		swipeStateRef.current.didDrag = false;
		setSwipeOffset(0);
	};

	const handleCardClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (swipeStateRef.current.didDrag) {
			event.preventDefault();
			event.stopPropagation();
			swipeStateRef.current.didDrag = false;
			return;
		}

		logTrackerButton('Initiative card selected', {
			participantId: participant.id,
			participantName: participant.name,
		});
		onSelect(participant.id);
	};

	return (
		<div
			className={[
				'relative overflow-hidden rounded-xl',
				selected ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : '',
			].join(' ')}
		>
			<div className="pointer-events-none absolute inset-y-0 left-0 right-0 flex items-center justify-between px-2">
				<div
					className={[
						'inline-flex items-center gap-1 rounded-full border border-current/20 px-3 py-2 text-xs uppercase tracking-[0.18em] transition-opacity',
						swipeOffset > 0 || swipeActionFlash === 'delay' ? 'opacity-100' : 'opacity-40',
						swipeActionFlash === 'delay' ? 'border-current/50' : '',
					].join(' ')}
				>
					<ArrowLeft className="h-4 w-4" /> Delay
				</div>
				<div
					className={[
						'inline-flex items-center gap-1 rounded-full border border-current/20 px-3 py-2 text-xs uppercase tracking-[0.18em] transition-opacity',
						swipeOffset < 0 || swipeActionFlash === 'ko' ? 'opacity-100' : 'opacity-40',
						swipeActionFlash === 'ko' ? 'border-current/50' : '',
					].join(' ')}
				>
					KO <ArrowRight className="h-4 w-4" />
				</div>
			</div>
			<button
				type="button"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onClick={handleCardClick}
				style={{ transform: `translateX(${swipeOffset}px)` }}
				className={[
					'group flex min-h-28 w-full min-w-0 touch-pan-y flex-wrap items-center gap-4 rounded-xl border px-4 py-6 text-left transition-transform',
					isCurrent ? accent.activeCard : `${accent.inactiveCard} ${accent.inactiveMarker}`,
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
						<div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em]">
							{participant.role === 'hazard' ? (
								<span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-1 text-current/80">
									<ShieldOff className="h-3 w-3" /> {indicatorLabel}
								</span>
							) : (
								<span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-1 text-current/80">
									<Heart className="h-3 w-3" /> {indicatorLabel}
								</span>
							)}
						</div>
					</div>
				</div>
			</button>
		</div>
	);
}

function MobileInitiativeCarouselCard({
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
	const SWIPE_REVEAL_PX = 76;
	const SWIPE_INTENT_PX = 10;
	const SWIPE_SNAP_PX = 28;
	const accent = getParticipantAccent(participant.role);
	const indicatorLabel = getParticipantIndicatorLabel(participant);
	const [swipeOffsetY, setSwipeOffsetY] = useState(0);
	const [swipeActionFlash, setSwipeActionFlash] = useState<'delay' | 'ko' | null>(null);
	const swipeFlashTimeoutRef = useRef<number | null>(null);
	const swipeStateRef = useRef({
		pointerId: null as number | null,
		startX: 0,
		startY: 0,
		isSwiping: false,
		didDrag: false,
	});

	useEffect(() => {
		return () => {
			if (swipeFlashTimeoutRef.current !== null) {
				window.clearTimeout(swipeFlashTimeoutRef.current);
			}
		};
	}, []);

	const registerSwipeInput = (action: 'delay' | 'ko') => {
		logTrackerButton('Mobile swipe action input', {
			action,
			participantId: participant.id,
			participantName: participant.name,
		});
		setSwipeActionFlash(action);
		if (swipeFlashTimeoutRef.current !== null) {
			window.clearTimeout(swipeFlashTimeoutRef.current);
		}

		swipeFlashTimeoutRef.current = window.setTimeout(() => {
			setSwipeActionFlash(null);
			swipeFlashTimeoutRef.current = null;
		}, 320);
	};

	const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (event.pointerType === 'mouse' && event.button !== 0) {
			return;
		}

		swipeStateRef.current.pointerId = event.pointerId;
		swipeStateRef.current.startX = event.clientX;
		swipeStateRef.current.startY = event.clientY;
		swipeStateRef.current.isSwiping = false;
		swipeStateRef.current.didDrag = false;
		event.currentTarget.setPointerCapture(event.pointerId);
	};

	const handlePointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (swipeStateRef.current.pointerId !== event.pointerId) {
			return;
		}

		const deltaX = event.clientX - swipeStateRef.current.startX;
		const deltaY = event.clientY - swipeStateRef.current.startY;

		if (!swipeStateRef.current.isSwiping) {
			if (Math.abs(deltaY) < SWIPE_INTENT_PX || Math.abs(deltaY) <= Math.abs(deltaX)) {
				return;
			}
			swipeStateRef.current.isSwiping = true;
		}

		swipeStateRef.current.didDrag = true;
		setSwipeOffsetY(Math.max(-SWIPE_REVEAL_PX, Math.min(SWIPE_REVEAL_PX, deltaY)));
	};

	const finishSwipe = () => {
		if (!swipeStateRef.current.didDrag) {
			return;
		}

		if (swipeOffsetY <= -SWIPE_SNAP_PX) {
			registerSwipeInput('delay');
			setSwipeOffsetY(0);
			return;
		}

		if (swipeOffsetY >= SWIPE_SNAP_PX) {
			registerSwipeInput('ko');
			setSwipeOffsetY(0);
			return;
		}

		setSwipeOffsetY(0);
	};

	const handlePointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
		if (swipeStateRef.current.pointerId !== event.pointerId) {
			return;
		}

		finishSwipe();
		swipeStateRef.current.pointerId = null;
		swipeStateRef.current.isSwiping = false;
	};

	const handlePointerCancel = () => {
		swipeStateRef.current.pointerId = null;
		swipeStateRef.current.isSwiping = false;
		swipeStateRef.current.didDrag = false;
		setSwipeOffsetY(0);
	};

	const handleCardClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		if (swipeStateRef.current.didDrag) {
			event.preventDefault();
			event.stopPropagation();
			swipeStateRef.current.didDrag = false;
			return;
		}

		logTrackerButton('Mobile initiative card selected', {
			participantId: participant.id,
			participantName: participant.name,
		});
		onSelect(participant.id);
	};

	return (
		<div
			className={[
				'relative overflow-hidden rounded-xl',
				selected ? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background' : '',
			].join(' ')}
		>
			<div className="pointer-events-none absolute inset-x-0 bottom-0 top-0 flex flex-col items-center justify-between py-2">
				<div
					className={[
						'inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition-opacity',
						swipeOffsetY < 0 || swipeActionFlash === 'delay' ? 'opacity-100' : 'opacity-40',
						swipeActionFlash === 'delay' ? 'border-current/50' : '',
					].join(' ')}
				>
					Delay <ArrowLeft className="h-3 w-3" />
				</div>
				<div
					className={[
						'inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-1 text-[10px] uppercase tracking-[0.18em] transition-opacity',
						swipeOffsetY > 0 || swipeActionFlash === 'ko' ? 'opacity-100' : 'opacity-40',
						swipeActionFlash === 'ko' ? 'border-current/50' : '',
					].join(' ')}
				>
					KO <ArrowRight className="h-3 w-3" />
				</div>
			</div>
			<button
				type="button"
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onClick={handleCardClick}
				style={{ transform: `translateY(${swipeOffsetY}px)` }}
				className={[
					'group relative flex aspect-square min-h-44 w-full min-w-0 touch-pan-x flex-col justify-between gap-2 rounded-xl border p-3 text-left transition-transform',
					isCurrent ? accent.activeCard : `${accent.inactiveCard} ${accent.inactiveMarker}`,
				].join(' ')}
			>
				<div className="space-y-2">
					<div className="flex flex-wrap items-center gap-1.5">
						<p
							className={[
								'min-w-0 break-words text-sm font-semibold',
								!isCurrent ? accent.name : '',
							].join(' ')}
						>
							{participant.name}
						</p>
					</div>
					<div className="flex flex-wrap items-center gap-1.5">
						<Badge className={accent.badge}>{participant.role}</Badge>
						<Badge variant={isCurrent ? 'secondary' : 'outline'}>{participant.state}</Badge>
					</div>
				</div>
				<div className="text-[11px] uppercase tracking-[0.18em] text-current/80">
					{participant.role === 'hazard' ? (
						<span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-1">
							<ShieldOff className="h-3 w-3" /> {indicatorLabel}
						</span>
					) : (
						<span className="inline-flex items-center gap-1 rounded-full border border-current/20 px-2 py-1">
							<Heart className="h-3 w-3" /> {indicatorLabel}
						</span>
					)}
				</div>
			</button>
		</div>
	);
}

function NextRoundMarkerCard({ nextRound }: { nextRound: number }) {
	return (
		<div className="flex min-h-25 w-full min-w-0 items-center justify-center rounded-xl border border-dashed border-primary/50 bg-primary/5 px-4 py-6 text-center">
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
			onClick={() => {
				logTrackerButton('Delayed marker selected', {
					participantId: participant.id,
					participantName: participant.name,
				});
				onSelect(participant.id);
			}}
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
	const [initiativeCarouselApi, setInitiativeCarouselApi] = useState<CarouselApi>();
	const [initiativeParticipants, setInitiativeParticipants] = useState<TrackerParticipant[]>(
		trackerMockData.initiativeParticipants
	);
	const [selectedParticipantId, setSelectedParticipantId] = useState(
		trackerMockData.initiativeParticipants[0]?.id ?? null
	);
	const [reorderOpen, setReorderOpen] = useState(false);
	const [reorderDraftParticipants, setReorderDraftParticipants] = useState<TrackerParticipant[]>(
		trackerMockData.initiativeParticipants
	);
	const currentInitiativeParticipantId = initiativeParticipants[0]?.id ?? null;
	const nextTurnTimeoutRef = useRef<number | null>(null);
	const delayedParticipantCopies = useMemo(
		() =>
			initiativeParticipants
				.filter((participant) => participant.state === 'delayed')
				.map((participant) => ({
					...participant,
					id: `${participant.id}-delayed-copy`,
					name: `${participant.name} (Delayed Copy)`,
				})),
		[initiativeParticipants]
	);
	const delayedSectionParticipants = useMemo(
		() => [...delayedParticipantCopies, ...trackerMockData.outOfInitiative.delayed],
		[delayedParticipantCopies]
	);

	useEffect(() => {
		return () => {
			if (nextTurnTimeoutRef.current !== null) {
				window.clearTimeout(nextTurnTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		if (!reorderOpen) {
			return;
		}

		setReorderDraftParticipants(initiativeParticipants);
	}, [initiativeParticipants, reorderOpen]);

	const focusCurrentParticipant = () => {
		if (!initiativeCarouselApi) {
			logTrackerButton('Focus Current attempted before carousel API ready');
			return;
		}

		initiativeCarouselApi.scrollTo(0);
		logTrackerButton('Focus Current scrolled to top initiative element');
	};

	const handleNextTurn = () => {
		if (nextTurnTimeoutRef.current !== null) {
			window.clearTimeout(nextTurnTimeoutRef.current);
			nextTurnTimeoutRef.current = null;
		}
		setInitiativeParticipants((previousOrder) => {
			if (previousOrder.length < 2) {
				return previousOrder;
			}

			const [firstParticipant, ...rest] = previousOrder;
			const nextOrder = [...rest, firstParticipant];
			logTrackerButton('Next Turn mock rotation applied', {
				movedParticipantId: firstParticipant.id,
				movedParticipantName: firstParticipant.name,
				nextCurrentParticipantId: nextOrder[0]?.id,
			});

			return nextOrder;
		});
		nextTurnTimeoutRef.current = window.setTimeout(() => {
			focusCurrentParticipant();
			nextTurnTimeoutRef.current = null;
		}, 20);
		logTrackerButton('Next Turn rotation queued after focus animation');
	};

	const resetReorderDraft = () => {
		setReorderDraftParticipants(initiativeParticipants);
	};

	const handleReorderOpenChange = (open: boolean) => {
		if (!open) {
			resetReorderDraft();
		}

		setReorderOpen(open);
	};

	const allParticipants = useMemo(
		() => [
			...initiativeParticipants,
			...trackerMockData.outOfInitiative.reinforcements,
			...delayedSectionParticipants,
			...trackerMockData.outOfInitiative.hazards,
		],
		[initiativeParticipants, delayedSectionParticipants]
	);

	const selectedParticipant =
		allParticipants.find((p) => p.id === selectedParticipantId) ?? null;
	const nextRound = trackerMockData.currentRound + 1;
	const nextRoundMarkerIndex = Math.max(
		1,
		Math.floor(initiativeParticipants.length / 2)
	);

	return (
		<main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
			<section className="hidden lg:grid lg:h-[calc(100vh-8rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-4">
				<Card className="min-w-0 p-4 lg:col-span-2">
					<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
						<div className="min-w-0 space-y-3">
							<div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Next Turn"
											variant="secondary"
											size="icon"
											onClick={() => {
												logTrackerButton('Next Turn button clicked');
												handleNextTurn();
											}}
										>
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
											onClick={() => {
												logTrackerButton('Focus Current button clicked');
												focusCurrentParticipant();
											}}
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
											onClick={() => logTrackerButton('End Encounter button clicked')}
										>
											<ArrowRight className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">End Encounter</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Manual Reorder"
											size="icon"
											onClick={() => {
												logTrackerButton('Manual Reorder button clicked');
												setReorderOpen(true);
											}}
										>
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
												onClick={() => logTrackerButton('Undo button clicked')}
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
												onClick={() => logTrackerButton('Redo button clicked')}
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
								setApi={setInitiativeCarouselApi}
      							orientation="vertical"
								opts={{ align: "start", dragFree: true }}
								className="h-[calc(100%-3rem)] pt-4 mt-4"
							>
								<CarouselContent className="h-full pt-7">
									{initiativeParticipants.map((participant, index) => (
										<Fragment key={participant.id}>
											{index === nextRoundMarkerIndex ? (
												<CarouselItem
													key="next-round-marker"
													className="min-w-0 basis-[5rem]"
												>
													<NextRoundMarkerCard nextRound={nextRound} />
												</CarouselItem>
											) : null}
											<CarouselItem
												key={participant.id}
												className={[
													'min-w-0',
													participant.state === 'delayed' ? 'basis-[5.75rem]' : 'basis-[7rem]',
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
								<CarouselPrevious />
								<CarouselNext
									className="-mb-4"
								/>
							</Carousel>
						</div>
					</Card>

					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<Tabs defaultValue="reinforcements" className="flex min-h-0 flex-1 flex-col">
							<TabsList className="grid w-full grid-cols-3 h-auto">
								<TabsTrigger value="reinforcements" className="whitespace-normal">Reinforcements</TabsTrigger>
								<TabsTrigger value="delaying" className="whitespace-normal">Delaying</TabsTrigger>
								<TabsTrigger value="hazards" className="whitespace-normal">Simple Hazards</TabsTrigger>
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
										{delayedSectionParticipants.map((participant) => (
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
							<TabsList className="grid w-full grid-cols-4 h-auto">
								<TabsTrigger value="description" className="whitespace-normal">Description</TabsTrigger>
								<TabsTrigger value="events" className="whitespace-normal">Narrative Events</TabsTrigger>
								<TabsTrigger value="history" className="whitespace-normal">Command History</TabsTrigger>
								<TabsTrigger value="stats" className="whitespace-normal">Turn Stats</TabsTrigger>
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
				<Card className="p-4">
					<div className="flex items-start gap-3">
						<div className="min-w-0">
							{/* <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
								Initiative Controls
							</p> */}
							<h2 className="truncate text-base font-semibold">
								{trackerMockData.encounterTitle}
							</h2>
							<p className="text-sm text-muted-foreground">{trackerMockData.threatLevel}</p>
						</div>
						<div className="ml-auto flex flex-col items-end gap-2">
							<div className="flex items-center gap-2">
								<Button
									aria-label="Next Turn"
									variant="secondary"
									size="icon"
									onClick={() => {
										logTrackerButton('Mobile Next Turn button clicked');
										handleNextTurn();
									}}
								>
									<SkipForward className="h-4 w-4" />
								</Button>
								<Button
									aria-label="Focus Current"
									variant="secondary"
									size="icon"
									className="border border-sky-500/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
									onClick={() => {
										logTrackerButton('Focus Current button clicked');
										focusCurrentParticipant();
									}}
								>
									<History className="h-4 w-4" />
								</Button>
								<Button
									aria-label="End Encounter"
									variant="secondary"
									size="icon"
									className="border border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
									onClick={() => logTrackerButton('End Encounter button clicked')}
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex items-right gap-2 pr-1">
								<Button
									aria-label="Manual Reorder"
									size="icon"
									onClick={() => {
										logTrackerButton('Mobile Reorder button clicked');
										setReorderOpen(true);
									}}
								>
									<ArrowUpDown className="h-4 w-4" />
								</Button>
								<div className="inline-flex items-center overflow-hidden rounded-md border border-input">
									<Button
										aria-label="Undo"
										variant="ghost"
										size="icon"
										className="rounded-none border-0"
										onClick={() => logTrackerButton('Mobile Undo button clicked')}
									>
										<Undo2 className="h-4 w-4" />
									</Button>
									<div className="h-6 w-px bg-border" />
									<Button
										aria-label="Redo"
										variant="ghost"
										size="icon"
										className="rounded-none border-0"
										onClick={() => logTrackerButton('Mobile Redo button clicked')}
									>
										<Redo2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</Card>

				<Tabs defaultValue="inactive" className="space-y-3">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="inactive">Inactive Participants</TabsTrigger>
						<TabsTrigger value="carousel">Horizontal Carousel</TabsTrigger>
					</TabsList>
					<TabsContent value="inactive" className="mt-0">
						<Card className="p-4">
							<Tabs defaultValue="reinforcements" className="space-y-3">
								<TabsList className="grid w-full grid-cols-3 h-auto">
									<TabsTrigger value="reinforcements" className="whitespace-normal">Reinforcements</TabsTrigger>
									<TabsTrigger value="delaying" className="whitespace-normal">Delaying</TabsTrigger>
									<TabsTrigger value="hazards" className="whitespace-normal">Simple Hazards</TabsTrigger>
								</TabsList>
								<TabsContent value="reinforcements" className="mt-0">
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
								</TabsContent>
								<TabsContent value="delaying" className="mt-0">
									<div className="space-y-2">
										{delayedSectionParticipants.map((participant) => (
											<ParticipantRow
												key={participant.id}
												participant={participant}
												onSelect={setSelectedParticipantId}
												selected={participant.id === selectedParticipantId}
											/>
										))}
									</div>
								</TabsContent>
								<TabsContent value="hazards" className="mt-0">
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
								</TabsContent>
							</Tabs>
						</Card>
					</TabsContent>
					<TabsContent value="carousel" className="mt-0">
						<Card className="p-4">
							<Carousel
								opts={{ align: 'start', dragFree: true }}
								className="w-full"
							>
								<CarouselContent className="-ml-2">
									{initiativeParticipants.map((participant, index) => (
										<Fragment key={participant.id}>
											{index === nextRoundMarkerIndex ? (
												<CarouselItem className="basis-[42%] pl-2">
													<div className="flex aspect-square min-h-44 items-center justify-center rounded-xl border border-dashed border-primary/50 bg-primary/5 px-3 py-4 text-center">
														<div className="space-y-1">
															<p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
																Next Round
															</p>
															<p className="text-xl font-semibold tabular-nums text-primary">{nextRound}</p>
														</div>
													</div>
												</CarouselItem>
											) : null}
											<CarouselItem
												className={[
													'pl-2',
													participant.state === 'delayed' ? 'basis-[42%]' : 'basis-[70%]',
												].join(' ')}
											>
												{participant.state === 'delayed' ? (
													<div className="flex aspect-square min-h-44 w-full items-center justify-center rounded-xl border border-dashed border-primary/50 bg-primary/5 px-3 py-4 text-center">
														<div className="space-y-1">
															<p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
																Delayed
															</p>
															<p className="text-sm font-semibold text-primary">{participant.name}</p>
														</div>
													</div>
												) : (
													<MobileInitiativeCarouselCard
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
							</Carousel>
						</Card>
					</TabsContent>
				</Tabs>

				<Tabs defaultValue="general" className="space-y-3">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="general">General Info</TabsTrigger>
						<TabsTrigger value="selected">Selected Participant</TabsTrigger>
					</TabsList>
					<TabsContent value="general" className="mt-0">
						<Card className="p-4">
							<Tabs defaultValue="description" className="space-y-3">
								<TabsList className="grid w-full grid-cols-4 h-auto">
									<TabsTrigger value="description" className="whitespace-normal">Description</TabsTrigger>
									<TabsTrigger value="events" className="whitespace-normal">Narrative Events</TabsTrigger>
									<TabsTrigger value="history" className="whitespace-normal">Command History</TabsTrigger>
									<TabsTrigger value="stats" className="whitespace-normal">Turn Stats</TabsTrigger>
								</TabsList>
								<TabsContent value="description" className="mt-0 text-sm">
									<p>{trackerMockData.description}</p>
								</TabsContent>
								<TabsContent value="events" className="mt-0">
									<ul className="space-y-2 text-sm">
										{trackerMockData.narrativeDetails.map((event) => (
											<li key={event} className="rounded-md border p-2">
												{event}
											</li>
										))}
									</ul>
								</TabsContent>
								<TabsContent value="history" className="mt-0">
									<ul className="space-y-2 text-sm">
										{trackerMockData.historyPreview.map((entry) => (
											<li key={entry} className="rounded-md border p-2">
												{entry}
											</li>
										))}
									</ul>
								</TabsContent>
								<TabsContent value="stats" className="mt-0 text-sm">
									<p>Average turn duration data will be connected in MVP.</p>
								</TabsContent>
							</Tabs>
						</Card>
					</TabsContent>
					<TabsContent value="selected" className="mt-0">
						<Card className="p-4">
							<ParticipantDetails participant={selectedParticipant} />
						</Card>
					</TabsContent>
				</Tabs>
			</section>

			<Dialog open={reorderOpen} onOpenChange={handleReorderOpenChange}>
				<DialogContent
					className={[
						'left-auto right-0 top-0 h-dvh w-full max-w-[92vw] translate-x-0 translate-y-0 rounded-none border-l p-0',
						'flex flex-col gap-0',
						'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
						'sm:left-[50%] sm:right-auto sm:top-[50%] sm:h-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6',
						'sm:grid sm:gap-4 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0',
					].join(' ')}
				>
					<DialogHeader className="border-b px-6 py-4 sm:border-0 sm:px-0 sm:py-0">
						<DialogTitle>Manual Reorder Draft</DialogTitle>
						<DialogDescription>
							This PoC dialog mirrors the initiative list in a separate draft space. Drag and save behavior will be enabled in MVP.
						</DialogDescription>
					</DialogHeader>
					<div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-0 sm:py-0">
						<Reorder.Group
							axis="y"
							values={reorderDraftParticipants}
							onReorder={setReorderDraftParticipants}
							className="space-y-2"
						>
							{reorderDraftParticipants.map((participant) => (
								<Reorder.Item
									key={participant.id}
									value={participant}
									whileDrag={{ scale: 1.01 }}
									className="cursor-grab rounded-md border p-2 text-sm active:cursor-grabbing"
								>
									{participant.name}
								</Reorder.Item>
							))}
						</Reorder.Group>
					</div>
					<DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
						<Button
							variant="outline"
							onClick={() => {
								logTrackerButton('Manual reorder dialog cancel clicked');
								handleReorderOpenChange(false);
							}}
						>
							Cancel
						</Button>
						<Button disabled onClick={() => logTrackerButton('Manual reorder save clicked')}>
							Save Order
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
