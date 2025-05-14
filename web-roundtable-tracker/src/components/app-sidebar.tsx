import { useRouter, Link, useMatchRoute } from '@tanstack/react-router';
import * as React from 'react';

import { SearchForm } from 'src/components/search-form';
import { FileRoutesByFullPath } from 'src/routeTree.gen';

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from 'src/components/ui/sidebar';

function MenuItem({
	item,
}: {
	item: { title: string; url: keyof FileRoutesByFullPath };
}) {
	const matchRoute = useMatchRoute();
	const isActive = !!matchRoute({ to: item.url });

	return (
		<SidebarMenuItem key={item.title}>
			<SidebarMenuButton asChild isActive={isActive}>
				<Link to={item.url}>{item.title}</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const { routesByPath, state } = useRouter();

	const data = {
		navMain: [
			{
				title: 'Routes',
				items: Object.keys(routesByPath as FileRoutesByFullPath).map(
					(path) => ({
						title: path,
						url: path as keyof FileRoutesByFullPath,
						isActive: state.location.pathname === path,
					})
				),
			},
		],
	};

	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<SearchForm />
			</SidebarHeader>
			<SidebarContent>
				{/* We create a SidebarGroup for each parent. */}
				{data.navMain.map((item) => (
					<SidebarGroup key={item.title}>
						<SidebarGroupLabel>{item.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{item.items.map((item) => (
									<MenuItem key={item.title} item={item} />
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				))}
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
