import { AppSidebar } from '@/components/app-sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
	SidebarProvider,
	SidebarInset,
	SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import {
	createRootRoute,
	Link,
	Outlet,
	useMatches,
} from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import React from 'react';
import { useEncounterStore } from '@/store/encounterRuntimeInstance';
import { encounterToTrackerHeader } from '@/store/trackerMappers';
import { INITIATIVE_PHASE } from '@/store/encounterRuntimeStore';

function toDurationLabel(milliseconds: number) {
	const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
	const minutes = Math.floor(totalSeconds / 60)
		.toString()
		.padStart(2, '0');
	const seconds = (totalSeconds % 60).toString().padStart(2, '0');

	return `${minutes}:${seconds}`;
}

function BreadCrumbs() {
	const matches = useMatches();

	const breadcrumbItems = matches
		.filter((match) => match.loaderData?.crumb)
		.map(({ pathname, loaderData }) => ({
			href: pathname,
			label: loaderData?.crumb,
		}));

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbItems.map((item, index) => (
					<React.Fragment key={item.href}>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={item.href}>{item.label}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						{index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
}

function EncounterHeaderInfo() {
	const matches = useMatches();
	const [nowMs, setNowMs] = React.useState(() =>
		typeof performance !== 'undefined' && typeof performance.now === 'function'
			? performance.now()
			: Date.now()
	);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const round = useEncounterStore((state) => state.round);
	const lastTurnElapsedMs = useEncounterStore((state) => state.lastTurnElapsedMs);
	const activeTurnStartedAtMs = useEncounterStore(
		(state) => state.activeTurnStartedAtMs
	);
	const activeTurnParticipantId = useEncounterStore(
		(state) => state.activeTurnParticipantId
	);
	const activeTurnRound = useEncounterStore((state) => state.activeTurnRound);
	const initiativePhase = useEncounterStore((state) => state.initiativePhase);

	React.useEffect(() => {
		if (initiativePhase !== INITIATIVE_PHASE.Active) {
			return;
		}

		let frameId: number | null = null;

		const tick = () => {
			setNowMs(
				typeof performance !== 'undefined' &&
					typeof performance.now === 'function'
					? performance.now()
					: Date.now()
			);
			frameId = window.requestAnimationFrame(tick);
		};

		frameId = window.requestAnimationFrame(tick);

		return () => {
			if (frameId !== null) {
				window.cancelAnimationFrame(frameId);
			}
		};
	}, [initiativePhase]);
	const turnElapsedByRoundParticipant = useEncounterStore(
		(state) => state.turnElapsedByRoundParticipant
	);
	const isInitiativeTrackerRoute = matches.some(
		(match) => match.routeId === '/initiative_tracker'
	);
	const activeTurnKey =
		typeof activeTurnRound === 'number' && activeTurnParticipantId
			? `${activeTurnRound}:${activeTurnParticipantId}`
			: null;
	const currentTurnElapsedMs =
		initiativePhase === INITIATIVE_PHASE.Active && activeTurnKey
			? (turnElapsedByRoundParticipant[activeTurnKey] ?? 0) +
				(typeof activeTurnStartedAtMs === 'number'
					? Math.max(0, nowMs - activeTurnStartedAtMs)
					: 0)
			: 0;
	const encounterHeader = encounterData
		? encounterToTrackerHeader(encounterData, partyLevel, round, {
				lastTurn: toDurationLabel(lastTurnElapsedMs),
				currentTurn: toDurationLabel(currentTurnElapsedMs),
		  })
		: null;

	if (!encounterHeader) {
		return null;
	}

	return (
		<>
			<Separator orientation="vertical" className="mx-2 h-4" />
			<div className="flex min-w-0 flex-1 items-center justify-between gap-4">
				<div
					className={[
						'flex min-w-0 items-center gap-2',
						isInitiativeTrackerRoute ? 'hidden md:flex' : '',
					].join(' ')}
				>
					<span className="truncate text-sm font-semibold">
						{encounterHeader.encounterTitle}
					</span>
					<span className="text-xs text-muted-foreground">
						{encounterHeader.threatLevel}
					</span>
				</div>
				<div className="shrink-0 text-right ml-auto md:ml-0">
					<p className="text-xs text-muted-foreground">
						Last turn {encounterHeader.turnTimers.lastTurn}
					</p>
					<p className="text-sm font-semibold tabular-nums">
						{encounterHeader.turnTimers.currentTurn}
					</p>
				</div>
			</div>
		</>
	);
}

export const Route = createRootRoute({
	component: () => {
		return (
			<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
				<SidebarProvider>
					<AppSidebar />
					<SidebarInset>
						<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
							<SidebarTrigger className="-ml-1" />
							<Separator orientation="vertical" className="mr-2 h-4" />
							<BreadCrumbs />
							<EncounterHeaderInfo />
						</header>
						<Outlet />
					</SidebarInset>
				</SidebarProvider>
				<TanStackRouterDevtools />
			</ThemeProvider>
		);
	},
});
