import { useEffect, useRef, useState } from 'react';
import {
	Ban,
	Clock3,
	Hammer,
	Heart,
	HeartOff,
	HeartPulse,
	Power,
	PowerOff,
	ShieldOff,
	Skull,
} from 'lucide-react';
import { type EncounterTimer } from '@/store/encounterTimer';
import { TurnTimeChip } from './TurnTimeChip';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	getOutOfFightNames,
	showsDisableProgress,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import {
	TAKE_OUT_EFFECT_SHORT_LABEL,
	TAKE_OUT_EFFECT_TEXT,
	type TakeOutEffect,
} from './takeOut';

/** 'ko' and 'slay' are Disable and Destroy for a hazard. */
export type SwipeAction = 'delay' | 'ko' | 'reactivate' | 'slay';

export type InitiativeCardDensity = 'desktop' | 'mobile';

type ParticipantAccent = {
	inactiveCard: string;
	inactiveMarker: string;
	name: string;
	activeCard: string;
};

const DENSITY_CONFIG = {
	desktop: {
		swipeRevealPx: 72,
		swipeIntentPx: 10,
		swipeSnapPx: 30,
		actionTriggerMs: 110,
		delaySlideTarget: -72,
		koSlideTarget: 72,
		actionButtonDelayClass: [
			'group/action relative flex self-stretch w-14 shrink-0 items-center justify-center transition-colors',
			'bg-background/70 backdrop-blur rounded-l-xl border-y border-l border-current/25 text-current/85 hover:bg-background/85 hover:border-current/55',
			'before:pointer-events-none before:absolute before:-right-[1px] before:top-1/2 before:-translate-y-1/2 before:h-[calc(100%+2px)] before:w-4',
			'before:bg-background before:[clip-path:ellipse(100%_50%_at_100%_50%)]',
			'after:pointer-events-none after:absolute after:-right-[1px] after:top-1/2 after:-translate-y-1/2 after:h-full after:w-4',
			'after:border-r after:border-current/25 after:[border-radius:0_100%_100%_0] group-hover/action:after:border-current/55',
		].join(' '),
		actionButtonKoClass: [
			'group/action relative flex self-stretch w-14 shrink-0 items-center justify-center transition-colors',
			'bg-background/70 backdrop-blur rounded-r-xl border-y border-r border-current/25 text-current/85 hover:bg-background/85 hover:border-current/55',
			'before:pointer-events-none before:absolute before:-left-[1px] before:top-1/2 before:-translate-y-1/2 before:h-[calc(100%+2px)] before:w-4',
			'before:bg-background before:[clip-path:ellipse(100%_50%_at_0%_50%)]',
			'after:pointer-events-none after:absolute after:-left-[1px] after:top-1/2 after:-translate-y-1/2 after:h-full after:w-4',
			'after:border-l after:border-current/25 after:[border-radius:100%_0_0_100%] group-hover/action:after:border-current/55',
		].join(' '),
		iconClass: 'h-4 w-4',
		showKoLabel: false,
	},
	mobile: {
		swipeRevealPx: 56,
		swipeIntentPx: 10,
		swipeSnapPx: 24,
		actionTriggerMs: 100,
		delaySlideTarget: -56,
		koSlideTarget: 56,
		actionButtonDelayClass: [
			'group/action relative flex h-11 w-full shrink-0 items-center justify-center transition-colors',
			'bg-background/70 backdrop-blur rounded-t-xl border-x border-t border-current/25 text-current/85 hover:bg-background/85 hover:border-current/55',
			'before:pointer-events-none before:absolute before:left-1/2 before:-bottom-[1px] before:-translate-x-1/2 before:h-3 before:w-[calc(100%+2px)]',
			'before:bg-background before:[clip-path:ellipse(50%_100%_at_50%_100%)]',
			'after:pointer-events-none after:absolute after:left-1/2 after:-bottom-[1px] after:-translate-x-1/2 after:h-3 after:w-full',
			'after:border-b after:border-current/25 after:[border-radius:0_0_100%_100%] group-hover/action:after:border-current/55',
		].join(' '),
		actionButtonKoClass: [
			'group/action relative flex h-11 w-full shrink-0 items-center justify-center transition-colors',
			'bg-background/70 backdrop-blur rounded-b-xl border-x border-b border-current/25 text-current/85 hover:bg-background/85 hover:border-current/55',
			'before:pointer-events-none before:absolute before:left-1/2 before:-top-[1px] before:-translate-x-1/2 before:h-3 before:w-[calc(100%+2px)]',
			'before:bg-background before:[clip-path:ellipse(50%_100%_at_50%_0%)]',
			'after:pointer-events-none after:absolute after:left-1/2 after:-top-[1px] after:-translate-x-1/2 after:h-3 after:w-full',
			'after:border-t after:border-current/25 after:[border-radius:100%_100%_0_0] group-hover/action:after:border-current/55',
		].join(' '),
		iconClass: 'h-3.5 w-3.5',
		showKoLabel: true,
	},
} as const;

export function InitiativeActionCarouselCard({
	participant,
	selected,
	onSelect,
	isCurrent,
	onSwipeAction,
	density,
	accent,
	indicatorLabel,
	turnTimer,
	takeOutEffects,
}: {
	participant: TrackerParticipant;
	selected: boolean;
	onSelect: (id: string) => void;
	isCurrent: boolean;
	onSwipeAction: (
		participantId: string,
		action: SwipeAction,
		effect?: TakeOutEffect
	) => void;
	density: InitiativeCardDensity;
	accent: ParticipantAccent;
	indicatorLabel: string;
	/** Shown as the running turn time, on the current participant's card. */
	turnTimer?: EncounterTimer | null;
	/** What the K.O. / Disable action sets; one button per effect. */
	takeOutEffects: TakeOutEffect[];
}) {
	const {
		swipeRevealPx,
		swipeIntentPx,
		swipeSnapPx,
		actionTriggerMs,
		delaySlideTarget,
		koSlideTarget,
		actionButtonDelayClass,
		actionButtonKoClass,
		iconClass,
		showKoLabel,
	} = DENSITY_CONFIG[density];
	const isMobileDensity = density === 'mobile';
	const [swipeOffset, setSwipeOffset] = useState(0);
	const [swipeActionFlash, setSwipeActionFlash] = useState<SwipeAction | null>(
		null
	);
	const isKnockedOut = participant.state === 'knocked-out';
	const isHazard = participant.role === 'hazard';
	const names = getOutOfFightNames(participant);
	const canUseDelayAction = isKnockedOut || isCurrent;
	const delaySideAction: SwipeAction = isKnockedOut ? 'reactivate' : 'delay';
	const koSideAction: SwipeAction = isKnockedOut ? 'slay' : 'ko';
	const delaySideLabel = isKnockedOut ? 'Reactivate' : 'Delay';
	const koSideLabel = isKnockedOut ? names.remove : names.takeOut;
	// A swipe takes the first effect; each effect also has its own button.
	const koSideEffects: (TakeOutEffect | undefined)[] =
		isKnockedOut || takeOutEffects.length === 0 ? [undefined] : takeOutEffects;
	const ReactivateIcon = isHazard ? Power : HeartPulse;
	const TakeOutIcon = isHazard ? PowerOff : Ban;
	const RemoveIcon = isHazard ? Hammer : Skull;
	const koSideTitle = (effect?: TakeOutEffect) =>
		`${koSideLabel} ${participant.name}${effect ? `: ${TAKE_OUT_EFFECT_TEXT[effect]}` : ''}`;
	const swipeFlashTimeoutRef = useRef<number | null>(null);
	const actionTriggerTimeoutRef = useRef<number | null>(null);
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

			if (actionTriggerTimeoutRef.current !== null) {
				window.clearTimeout(actionTriggerTimeoutRef.current);
			}
		};
	}, []);

	const registerSwipeInput = (action: SwipeAction, effect?: TakeOutEffect) => {
		onSwipeAction(participant.id, action, effect);
		setSwipeActionFlash(action);

		if (swipeFlashTimeoutRef.current !== null) {
			window.clearTimeout(swipeFlashTimeoutRef.current);
		}

		swipeFlashTimeoutRef.current = window.setTimeout(() => {
			setSwipeActionFlash(null);
			swipeFlashTimeoutRef.current = null;
		}, 320);
	};

	const triggerActionWithSlide = (
		action: SwipeAction,
		effect?: TakeOutEffect
	) => {
		setSwipeOffset(
			action === delaySideAction ? delaySlideTarget : koSlideTarget
		);

		if (actionTriggerTimeoutRef.current !== null) {
			window.clearTimeout(actionTriggerTimeoutRef.current);
		}

		actionTriggerTimeoutRef.current = window.setTimeout(() => {
			registerSwipeInput(action, effect);
			setSwipeOffset(0);
			actionTriggerTimeoutRef.current = null;
		}, actionTriggerMs);
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
		const axisDelta = isMobileDensity ? deltaY : deltaX;
		const crossDelta = isMobileDensity ? deltaX : deltaY;

		if (!swipeStateRef.current.isSwiping) {
			if (
				Math.abs(axisDelta) < swipeIntentPx ||
				Math.abs(axisDelta) <= Math.abs(crossDelta)
			) {
				return;
			}
			swipeStateRef.current.isSwiping = true;
		}

		swipeStateRef.current.didDrag = true;
		const minSwipeOffset = canUseDelayAction ? -swipeRevealPx : 0;
		setSwipeOffset(
			Math.max(minSwipeOffset, Math.min(swipeRevealPx, axisDelta))
		);
	};

	const finishSwipe = () => {
		if (!swipeStateRef.current.didDrag) {
			return;
		}

		switch (true) {
			case canUseDelayAction && swipeOffset <= -swipeSnapPx:
				triggerActionWithSlide(delaySideAction);

				return;

			case swipeOffset >= swipeSnapPx:
				triggerActionWithSlide(koSideAction, koSideEffects[0]);

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

		onSelect(participant.id);
	};

	return (
		<div
			className={[
				'relative overflow-hidden rounded-xl',
				isMobileDensity ? 'h-full' : '',
				selected
					? 'ring-2 ring-primary/60 ring-offset-2 ring-offset-background'
					: '',
			].join(' ')}
		>
			<div
				className={
					isMobileDensity
						? 'flex h-full min-h-0 flex-col items-stretch'
						: 'flex min-h-15 items-stretch'
				}
			>
				{canUseDelayAction ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									triggerActionWithSlide(delaySideAction);
								}}
								className={[
									actionButtonDelayClass,
									swipeActionFlash === delaySideAction
										? 'border-current/60 after:border-current/60'
										: '',
								].join(' ')}
								aria-label={`${delaySideLabel} ${participant.name}`}
								title={
									density === 'mobile'
										? delaySideLabel
										: `${delaySideLabel} ${participant.name}`
								}
							>
								{isKnockedOut ? (
									<ReactivateIcon className={iconClass} />
								) : (
									<Clock3 className={iconClass} />
								)}
							</button>
						</TooltipTrigger>
						<TooltipContent side="top">
							Press or swipe card here to {delaySideLabel.toLowerCase()}{' '}
							{participant.name}
						</TooltipContent>
					</Tooltip>
				) : null}

				<button
					type="button"
					onPointerDown={handlePointerDown}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					onPointerCancel={handlePointerCancel}
					onClick={handleCardClick}
					style={{
						transform: isMobileDensity
							? `translateY(${swipeOffset}px)`
							: `translateX(${swipeOffset}px)`,
					}}
					className={[
						isMobileDensity
							? canUseDelayAction
								? 'relative z-10 -my-1 flex min-h-0 min-w-0 flex-1 touch-pan-x items-center justify-center rounded-xl border px-3 py-2 text-left transition-transform'
								: 'relative z-10 -mb-1 flex min-h-0 min-w-0 flex-1 touch-pan-x items-center justify-center rounded-xl border px-3 py-2 text-left transition-transform'
							: canUseDelayAction
								? 'relative z-10 -mx-1 flex min-h-10 min-w-0 flex-1 touch-pan-y items-center rounded-xl border px-3 py-2 text-left transition-transform'
								: 'relative z-10 -mr-1 flex min-h-10 min-w-0 flex-1 touch-pan-y items-center rounded-xl border px-3 py-2 text-left transition-transform',
						isCurrent
							? accent.activeCard
							: `${accent.inactiveCard} ${accent.inactiveMarker}`,
					].join(' ')}
				>
					<div
						className={
							density === 'mobile'
								? 'min-w-0 flex-1 space-y-1'
								: 'min-w-0 flex-1'
						}
					>
						{density === 'mobile' ? (
							<>
								<p
									className={[
										isMobileDensity
											? 'text-wrap text-align-center'
											: 'text-nowrap',
										'truncate text-sm font-semibold',
										!isCurrent ? accent.name : '',
									].join(' ')}
								>
									{participant.name}
								</p>
								<p className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-current/80">
									{showsDisableProgress(participant) ? (
										<ShieldOff className="h-3 w-3" />
									) : (
										<Heart className="h-3 w-3" />
									)}
									{indicatorLabel}
								</p>
								{isCurrent && (
									<TurnTimeChip
										timer={turnTimer}
										className="text-[11px] text-current/85"
									/>
								)}
							</>
						) : (
							<div className="flex min-w-0 items-center justify-between gap-3">
								<p
									className={[
										'truncate text-sm font-semibold',
										!isCurrent ? accent.name : '',
									].join(' ')}
								>
									{participant.name}
								</p>
								{isCurrent && (
									<TurnTimeChip
										timer={turnTimer}
										className="ml-auto text-xs text-current/85"
									/>
								)}
								<span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-current/20 px-2 py-1 text-[11px] uppercase tracking-[0.16em] text-current/85">
									{showsDisableProgress(participant) ? (
										<ShieldOff className="h-3 w-3" />
									) : (
										<Heart className="h-3 w-3" />
									)}
									{indicatorLabel}
								</span>
							</div>
						)}
					</div>
				</button>

				{koSideEffects.length === 1 ? (
					<Tooltip>
						<TooltipTrigger asChild>
							<button
								type="button"
								onClick={(event) => {
									event.stopPropagation();
									triggerActionWithSlide(koSideAction, koSideEffects[0]);
								}}
								className={[
									actionButtonKoClass,
									swipeActionFlash === koSideAction
										? 'border-current/60 after:border-current/60'
										: '',
								].join(' ')}
								aria-label={koSideTitle(koSideEffects[0])}
								title={
									density === 'mobile'
										? koSideLabel
										: `Press or swipe card here: ${koSideTitle(koSideEffects[0])}`
								}
							>
								{isKnockedOut ? (
									<RemoveIcon className={iconClass} />
								) : (
									<TakeOutIcon className={iconClass} />
								)}
								{showKoLabel ? (
									<span className="pointer-events-none absolute bottom-[calc(100%+0.25rem)] max-h-0 overflow-hidden whitespace-nowrap text-[10px] uppercase tracking-[0.16em] opacity-0 transition-all duration-200 group-hover/action:max-h-6 group-hover/action:opacity-100">
										{isKnockedOut ? names.remove : isHazard ? 'Disable' : 'KO'}
									</span>
								) : null}
							</button>
						</TooltipTrigger>
						<TooltipContent side="top">
							Press or swipe card here: {koSideTitle(koSideEffects[0])}
						</TooltipContent>
					</Tooltip>
				) : (
					<div
						className={[
							actionButtonKoClass,
							'p-0',
							isMobileDensity ? 'flex-row' : 'flex-col',
							swipeActionFlash === koSideAction
								? 'border-current/60 after:border-current/60'
								: '',
						].join(' ')}
					>
						{koSideEffects.map((effect, index) => (
							<Tooltip key={effect}>
								<TooltipTrigger asChild>
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											triggerActionWithSlide(koSideAction, effect);
										}}
										className={[
											'relative z-10 flex min-h-0 min-w-0 flex-1 items-center justify-center gap-1 self-stretch text-[10px] uppercase tracking-[0.08em] hover:bg-current/10',
											isMobileDensity ? 'pt-1' : 'pl-1',
											index > 0
												? isMobileDensity
													? 'border-l border-current/25'
													: 'border-t border-current/25'
												: '',
										].join(' ')}
										aria-label={koSideTitle(effect)}
										title={koSideTitle(effect)}
									>
										{effect === 'checks' ? (
											<ShieldOff className="h-3.5 w-3.5 shrink-0" />
										) : (
											<HeartOff className="h-3.5 w-3.5 shrink-0" />
										)}
										{isMobileDensity &&
											effect &&
											TAKE_OUT_EFFECT_SHORT_LABEL[effect]}
									</button>
								</TooltipTrigger>
								<TooltipContent side="top">
									{index === 0 ? 'Press or swipe card here: ' : 'Press: '}
									{koSideTitle(effect)}
								</TooltipContent>
							</Tooltip>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
