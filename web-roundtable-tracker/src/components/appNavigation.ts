import {
	FolderOpen,
	House,
	MonitorPlay,
	PencilRuler,
	Swords,
	Users,
	type LucideIcon,
} from 'lucide-react';

import type { FileRoutesByFullPath } from '@/routeTree.gen';

// /preview needs an encounter picked on the Encounters page first, so it is
// reached from there rather than from the menu.
export type NavPath = Exclude<keyof FileRoutesByFullPath, '/preview'>;

export type RoutePath = keyof FileRoutesByFullPath;

// Page names shown in the menu and the breadcrumbs. Keyed by every route path,
// so adding a route without a name fails typecheck.
export const ROUTE_TITLES: Record<RoutePath, string> = {
	'/': 'Home',
	'/encounters': 'Encounters',
	'/builder': 'Builder',
	'/party_setup': 'Parties',
	'/initiative_tracker': 'Tracker',
	'/initiative_player': 'Player view',
	'/preview': 'Preview',
};

export const getRouteTitle = (routeId: string): string | undefined =>
	Object.hasOwn(ROUTE_TITLES, routeId)
		? ROUTE_TITLES[routeId as RoutePath]
		: undefined;

export type NavItem = {
	title: string;
	url: NavPath;
	icon: LucideIcon;
};

// Keyed by every menu path, so adding a route without a menu entry fails
// typecheck.
const NAV_ICONS: Record<NavPath, LucideIcon> = {
	'/': House,
	'/encounters': FolderOpen,
	'/builder': PencilRuler,
	'/party_setup': Users,
	'/initiative_tracker': Swords,
	'/initiative_player': MonitorPlay,
};

const toNavItem = (url: NavPath): NavItem => ({
	url,
	title: ROUTE_TITLES[url],
	icon: NAV_ICONS[url],
});

export const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
	{
		title: 'Prepare',
		items: (['/', '/encounters', '/builder', '/party_setup'] as const).map(
			toNavItem
		),
	},
	{
		title: 'Play',
		items: (['/initiative_tracker', '/initiative_player'] as const).map(
			toNavItem
		),
	},
];

export const ALL_NAV_PATHS = Object.keys(NAV_ICONS) as NavPath[];
