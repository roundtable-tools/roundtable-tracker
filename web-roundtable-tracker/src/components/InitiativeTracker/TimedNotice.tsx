import { type ReactNode, useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

/** How long a notice waits for an answer before it takes its default. */
export const NOTICE_TIMEOUT_MS = 10_000;

/**
 * A question shown like a notification in the corner. Nothing else on the
 * page can be used while it is open, so no other change runs before it is
 * answered. Its actions answer it through `settle`. Anything else takes the
 * default answer, `onDismiss`: the close button, Escape, a press outside
 * (which does nothing else) or no answer within NOTICE_TIMEOUT_MS, shown by a
 * countdown line. It answers once, even if a timeout or a second event arrives before
 * the notice is removed.
 *
 * The notice takes the focus when it opens and gives it back when it closes.
 * The countdown stops while the pointer is over it or a control in it has
 * the focus, and starts over when both leave.
 */
export function TimedNotice({
	title,
	description,
	closeLabel,
	onDismiss,
	children,
}: {
	title: string;
	description: string;
	/** Accessible name of the close button, i.e. the default answer. */
	closeLabel: string;
	onDismiss: () => void;
	children: (settle: (answer: () => void) => void) => ReactNode;
}) {
	const id = useId();
	const noticeRef = useRef<HTMLDivElement>(null);
	const [countdownStarted, setCountdownStarted] = useState(false);
	const [hovered, setHovered] = useState(false);
	const [controlFocused, setControlFocused] = useState(false);
	const paused = hovered || controlFocused;
	// The handler changes every render; the listeners below read the latest.
	const onDismissRef = useRef(onDismiss);
	onDismissRef.current = onDismiss;
	const settledRef = useRef(false);
	const settle = (answer: () => void) => {
		if (settledRef.current) return;

		settledRef.current = true;
		answer();
	};
	const dismiss = () => settle(() => onDismissRef.current());

	useEffect(() => {
		if (paused) {
			setCountdownStarted(false);

			return;
		}

		const timeout = window.setTimeout(dismiss, NOTICE_TIMEOUT_MS);
		const frame = window.requestAnimationFrame(() => setCountdownStarted(true));

		return () => {
			window.clearTimeout(timeout);
			window.cancelAnimationFrame(frame);
		};
		// dismiss reads the latest handler through a ref.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paused]);

	useEffect(() => {
		const notice = noticeRef.current;
		const previousFocus =
			document.activeElement instanceof HTMLElement
				? document.activeElement
				: null;

		notice?.focus({ preventScroll: true });

		// Nothing else on the page is reachable from the keyboard until the
		// notice is answered: focus that leaves it comes back.
		const onFocusIn = (event: FocusEvent) => {
			if (
				!(
					event.target instanceof Node &&
					noticeRef.current?.contains(event.target)
				)
			) {
				noticeRef.current?.focus({ preventScroll: true });
			}
		};
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape') dismiss();
		};

		document.addEventListener('focusin', onFocusIn);
		document.addEventListener('keydown', onKeyDown);

		return () => {
			document.removeEventListener('focusin', onFocusIn);
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
		// Runs once per notice; dismiss reads the latest handler through a ref.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return (
		<>
			{/* Takes every press outside the notice, so nothing behind it (a
			button, a swipe) acts until it is answered. */}
			<div
				data-slot="notice-backdrop"
				aria-hidden
				className="fixed inset-0 z-50"
				onPointerDown={dismiss}
			/>
			<div
				ref={noticeRef}
				role="alertdialog"
				aria-labelledby={`${id}-title`}
				aria-describedby={`${id}-description`}
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
							<p id={`${id}-title`} className="font-semibold">
								{title}
							</p>
							<p
								id={`${id}-description`}
								className="text-sm text-muted-foreground"
							>
								{description}
							</p>
						</div>
						<Button
							variant="ghost"
							size="icon"
							className="-mr-2 -mt-2 h-7 w-7 shrink-0"
							aria-label={closeLabel}
							onClick={dismiss}
						>
							<X className="h-4 w-4" />
						</Button>
					</div>
					{children(settle)}
				</div>
				{/* Time left before the default answer. */}
				<div className="h-1 bg-muted">
					<div
						data-slot="notice-countdown"
						className="h-full origin-left bg-primary/60 transition-transform ease-linear"
						style={{
							transform: countdownStarted ? 'scaleX(0)' : 'scaleX(1)',
							// Snaps back to full while paused, then runs down again.
							transitionDuration: countdownStarted
								? `${NOTICE_TIMEOUT_MS}ms`
								: '0ms',
						}}
					/>
				</div>
			</div>
		</>
	);
}
