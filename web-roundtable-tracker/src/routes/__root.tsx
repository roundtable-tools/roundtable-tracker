import { AppSidebar } from '@/components/app-sidebar';
import { getRouteTitle } from '@/components/appNavigation';
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

type EncounterHeader = {
	title: string;
	threatLevel: string;
	turnTimers: {
		lastTurn: string;
		currentTurn: string;
	};
};

function BreadCrumbs() {
	const matches = useMatches();

	const breadcrumbItems = matches.flatMap(({ pathname, routeId }) => {
		const label = getRouteTitle(routeId);

		return label ? [{ href: pathname, label }] : [];
	});

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
	const isInitiativeTrackerRoute = matches.some(
		(match) => match.routeId === '/initiative_tracker'
	);
	const encounterHeader =
		matches
			.map((match): unknown => match.loaderData)
			.filter(
				(loaderData): loaderData is { encounterHeader: EncounterHeader } =>
					Boolean(
						loaderData &&
						typeof loaderData === 'object' &&
						'encounterHeader' in loaderData
					)
			)
			.at(-1)?.encounterHeader ?? null;

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
						{encounterHeader.title}
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
