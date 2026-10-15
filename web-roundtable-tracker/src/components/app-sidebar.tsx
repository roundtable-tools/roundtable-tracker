import { Link, useMatchRoute } from '@tanstack/react-router';
import * as React from 'react';

import { NAV_GROUPS, type NavItem } from '@/components/appNavigation';

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
} from '@/components/ui/sidebar';

function MenuItem({ item }: { item: NavItem }) {
	const matchRoute = useMatchRoute();
	const isActive = !!matchRoute({ to: item.url });

	return (
		<SidebarMenuItem>
			<SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
				<Link to={item.url}>
					<item.icon />
					<span>{item.title}</span>
				</Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar {...props}>
			<SidebarHeader>
				<Link to="/" className="px-2 text-lg font-semibold">
					RoundTable Tracker
				</Link>
			</SidebarHeader>
			<SidebarContent>
				{NAV_GROUPS.map((group) => (
					<SidebarGroup key={group.title}>
						<SidebarGroupLabel>{group.title}</SidebarGroupLabel>
						<SidebarGroupContent>
							<SidebarMenu>
								{group.items.map((item) => (
									<MenuItem key={item.url} item={item} />
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
