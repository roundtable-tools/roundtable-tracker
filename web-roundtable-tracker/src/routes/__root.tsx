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
import React from 'react';

// Devtools load only in dev, so they stay out of the production bundle.
const TanStackRouterDevtools = import.meta.env.DEV
	? React.lazy(() =>
			import('@tanstack/react-router-devtools').then((module) => ({
				default: module.TanStackRouterDevtools,
			}))
		)
	: () => null;

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
						</header>
						<Outlet />
					</SidebarInset>
				</SidebarProvider>
				<React.Suspense fallback={null}>
					<TanStackRouterDevtools />
				</React.Suspense>
			</ThemeProvider>
		);
	},
});
