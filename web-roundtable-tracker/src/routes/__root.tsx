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

export const Route = createRootRoute({
	component: () => {
		return (
			<>
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

					<TanStackRouterDevtools />
				</ThemeProvider>
			</>
		);
	},
});
