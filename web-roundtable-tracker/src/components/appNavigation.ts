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

export type NavItem = {
	title: string;
	url: NavPath;
	icon: LucideIcon;
};

// A Record keyed by every route path, so adding a route without a menu entry
// fails typecheck.
const NAV_ITEMS: Record<NavPath, Omit<NavItem, 'url'>> = {
	'/': { title: 'Home', icon: House },
	'/encounters': { title: 'Encounters', icon: FolderOpen },
	'/builder': { title: 'Builder', icon: PencilRuler },
	'/party_setup': { title: 'Parties', icon: Users },
	'/initiative_tracker': { title: 'Tracker', icon: Swords },
	'/initiative_player': { title: 'Player view', icon: MonitorPlay },
};

const toNavItem = (url: NavPath): NavItem => ({ url, ...NAV_ITEMS[url] });

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

export const ALL_NAV_PATHS = Object.keys(NAV_ITEMS) as NavPath[];
