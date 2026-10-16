import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** How long the notice waits for a returning participant before it closes. */
export const RETURN_NOTICE_TIMEOUT_MS = 10_000;

type DelayedParticipant = { id: string; name: string };

/**
 * Asks, like a notification, whether a delaying participant returns before
 * the turn ends. Picking one returns it. Anything else means nobody returns:
 * the close button, Escape, a click outside (which does nothing else) or no
 * answer within RETURN_NOTICE_TIMEOUT_MS.
 *
 * The notice takes the focus when it opens and gives it back when it closes.
 * The countdown stops while the pointer is over it or a control in it has
 * the focus, and starts over when both leave.
 */
export function ReturnToInitiativeNotice({
	participants,
	onReturn,
	onDismiss,
}: {
	participants: DelayedParticipant[];
	onReturn: (participantId: string) => void;
	onDismiss: () => void;
}) {
	const noticeRef = useRef<HTMLDivElement>(null);
	const [countdownStarted, setCountdownStarted] = useState(false);
	const [hovered, setHovered] = useState(false);
	const [controlFocused, setControlFocused] = useState(false);
	const paused = hovered || controlFocused;
	// The handlers change every render; the listeners below read the latest.
	const handlersRef = useRef({ onReturn, onDismiss });
	handlersRef.current = { onReturn, onDismiss };
	// The prompt settles once, even if a timeout or a second event arrives
	// before the notice is removed.
	const settledRef = useRef(false);
	const settle = (answer: () => void) => {
		if (settledRef.current) return;

		settledRef.current = true;
		answer();
	};
	const dismiss = () => settle(() => handlersRef.current.onDismiss());

	useEffect(() => {
		if (paused) {
			setCountdownStarted(false);

			return;
		}

		const timeout = window.setTimeout(dismiss, RETURN_NOTICE_TIMEOUT_MS);
		const frame = window.requestAnimationFrame(() => setCountdownStarted(true));

		return () => {
			window.clearTimeout(timeout);
			window.cancelAnimationFrame(frame);
		};
		// dismiss reads the latest handlers through a ref.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paused]);

	useEffect(() => {
		const notice = noticeRef.current;
		const previousFocus =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;

		notice?.focus({ preventScroll: true });

		const isOutside = (target: EventTarget | null) =>
			!(target instanceof Node && noticeRef.current?.contains(target));

		// A click outside only closes the notice: it must not also act on what
		// it hits (e.g. Next Turn, which would end another turn).
		const swallowClick = (event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
		};
		const onPointerDown = (event: PointerEvent) => {
			if (!isOutside(event.target)) return;

			document.addEventListener('click', swallowClick, {
				capture: true,
				once: true,
			});
			// A press that ends without a click (a drag, a touch that turns into
			// a scroll, a release outside the window) leaves no listener. These
			// listeners outlive the notice, which closes on this press.
			const releasePress = () => {
				document.removeEventListener('pointerup', releasePress);
				document.removeEventListener('pointercancel', releasePress);
				window.removeEventListener('blur', releasePress);
				window.setTimeout(() =>
					document.removeEventListener('click', swallowClick, true)
				);
			};

			document.addEventListener('pointerup', releasePress);
			document.addEventListener('pointercancel', releasePress);
			window.addEventListener('blur', releasePress);
			dismiss();
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') dismiss();
		};

		document.addEventListener('pointerdown', onPointerDown, true);
		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.removeEventListener('pointerdown', onPointerDown, true);
			document.removeEventListener('keydown', onKeyDown);

			// Give the focus back unless the press that closed the notice
			// already moved it elsewhere.
			const active = document.activeElement;

			if (
				previousFocus?.isConnected &&
				(active === null ||
					active === document.body ||
					notice?.contains(active))
			) {
				previousFocus.focus({ preventScroll: true });
			}
		};
		// Runs once per notice; dismiss reads the latest handlers through a ref.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<div
			ref={noticeRef}
			role="alertdialog"
			aria-labelledby="return-to-initiative-title"
			aria-describedby="return-to-initiative-description"
			tabIndex={-1}
			onPointerEnter={() => setHovered(true)}
			onPointerLeave={() => setHovered(false)}
			onFocus={(event) =>
				setControlFocused(event.target !== event.currentTarget)
			}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					setControlFocused(false);
				}
			}}
			className="outline-none fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-lg"
		>
			<div className="space-y-3 p-4">
				<div className="flex items-start justify-between gap-2">
					<div>
						<p id="return-to-initiative-title" className="font-semibold">
							Return to Initiative?
						</p>
						<p
							id="return-to-initiative-description"
							className="text-sm text-muted-foreground"
						>
							Before this turn ends, does a delaying participant return?
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						className="-mr-2 -mt-2 h-7 w-7 shrink-0"
						aria-label="Nobody returns"
						onClick={dismiss}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<div className="space-y-2">
					{participants.map((participant) => (
						<div
							key={participant.id}
							className="flex items-center justify-between gap-2 rounded-md border p-2 pl-3"
						>
							<p className="text-sm font-semibold">{participant.name}</p>
							<Button
								size="sm"
								onClick={() =>
									settle(() => handlersRef.current.onReturn(participant.id))
								}
							>
								Return
							</Button>
						</div>
					))}
				</div>
			</div>
			{/* Time left before nobody returns. */}
			<div className="h-1 bg-muted">
				<div
					data-slot="return-notice-countdown"
					className="h-full origin-left bg-primary/60 transition-transform ease-linear"
					style={{
						transform: countdownStarted ? 'scaleX(0)' : 'scaleX(1)',
						// Snaps back to full while paused, then runs down again.
						transitionDuration: countdownStarted
							? `${RETURN_NOTICE_TIMEOUT_MS}ms`
							: '0ms',
					}}
				/>
			</div>
		</div>
	);
}
