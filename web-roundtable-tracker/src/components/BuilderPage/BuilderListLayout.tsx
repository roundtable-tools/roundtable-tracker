import { useMemo, useState, type ReactNode } from 'react';
import {
	Grid2x2,
	LayoutGrid,
	LayoutList,
	PanelsTopLeft,
	StretchHorizontal,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type BuilderListLayoutKey =
	| 'compact-tabs'
	| 'wide-tabs'
	| 'wide-grid'
	| 'compact-grid'
	| 'list';

export type BuilderListLayoutSelection = {
	key: BuilderListLayoutKey;
	presentation: 'tabs' | 'grid' | 'list';
	density: 'compact' | 'wide';
};

type LayoutOption = {
	key: BuilderListLayoutKey;
	label: string;
	icon: typeof PanelsTopLeft;
	selection: BuilderListLayoutSelection;
	triggerGridClass?: string;
	contentGridClass?: string;
	contentListClass?: string;
	contentItemClassName?: string;
};

const LAYOUT_OPTIONS: Record<BuilderListLayoutKey, LayoutOption> = {
	'compact-tabs': {
		key: 'compact-tabs',
		label: 'Compact tabs',
		icon: PanelsTopLeft,
		selection: {
			key: 'compact-tabs',
			presentation: 'tabs',
			density: 'compact',
		},
		triggerGridClass: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6',
	},
	'wide-tabs': {
		key: 'wide-tabs',
		label: 'Wide tabs',
		icon: StretchHorizontal,
		selection: {
			key: 'wide-tabs',
			presentation: 'tabs',
			density: 'wide',
		},
		triggerGridClass: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
	},
	'wide-grid': {
		key: 'wide-grid',
		label: 'Wide tiles',
		icon: LayoutGrid,
		selection: {
			key: 'wide-grid',
			presentation: 'grid',
			density: 'wide',
		},
		contentGridClass: 'grid grid-cols-1 xl:grid-cols-2 gap-4',
		contentItemClassName: 'min-w-0',
	},
	'compact-grid': {
		key: 'compact-grid',
		label: 'Compact tiles',
		icon: Grid2x2,
		selection: {
			key: 'compact-grid',
			presentation: 'grid',
			density: 'compact',
		},
		contentGridClass: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3',
		contentItemClassName: 'min-w-0',
	},
	list: {
		key: 'list',
		label: 'List',
		icon: LayoutList,
		selection: {
			key: 'list',
			presentation: 'list',
			density: 'wide',
		},
		contentListClass: 'space-y-3',
		contentItemClassName: 'min-w-0',
	},
};

interface BuilderListLayoutProps<TItem> {
	items: TItem[];
	getItemId: (item: TItem, index: number) => string;
	getItemLabel: (item: TItem, index: number) => string;
	renderItem: (
		item: TItem,
		index: number,
		layout: BuilderListLayoutSelection
	) => ReactNode;
	emptyState: ReactNode;
	activeItemId?: string;
	onActiveItemIdChange?: (id: string) => void;
	allowedLayouts?: BuilderListLayoutKey[];
	defaultLayout?: BuilderListLayoutKey;
	label?: string;
	toolbarActions?: ReactNode;
	getContentClassName?: (
		layout: BuilderListLayoutSelection
	) => string | undefined;
	getItemClassName?: (
		layout: BuilderListLayoutSelection,
		item: TItem,
		index: number
	) => string | undefined;
}

export function BuilderListLayout<TItem>({
	items,
	getItemId,
	getItemLabel,
	renderItem,
	emptyState,
	activeItemId,
	onActiveItemIdChange,
	allowedLayouts = ['compact-tabs', 'wide-tabs', 'list'],
	defaultLayout,
	label,
	toolbarActions,
	getContentClassName,
	getItemClassName,
}: BuilderListLayoutProps<TItem>) {
	const availableLayouts = useMemo(
		() => allowedLayouts.map((key) => LAYOUT_OPTIONS[key]),
		[allowedLayouts]
	);
	const fallbackLayout = availableLayouts[0]?.key ?? 'compact-tabs';
	const [layoutKey, setLayoutKey] = useState<BuilderListLayoutKey>(
		defaultLayout && allowedLayouts.includes(defaultLayout)
			? defaultLayout
			: fallbackLayout
	);
	const activeLayoutOption =
		availableLayouts.find((layoutOption) => layoutOption.key === layoutKey) ??
		availableLayouts[0] ??
		LAYOUT_OPTIONS['compact-tabs'];
	const layout = activeLayoutOption.selection;
	const controls = (
		<div className="ml-auto flex items-center gap-2">
			<div className="flex items-center gap-1 rounded-lg border bg-background p-1">
				{availableLayouts.map((layoutOption) => {
					const Icon = layoutOption.icon;

					return (
						<button
							key={layoutOption.key}
							type="button"
							title={layoutOption.label}
							onClick={() => setLayoutKey(layoutOption.key)}
							className={cn(
								'flex h-7 w-7 items-center justify-center rounded',
								layoutKey === layoutOption.key
									? 'bg-primary text-primary-foreground'
									: 'text-muted-foreground hover:bg-accent hover:text-foreground'
							)}
						>
							<Icon className="h-4 w-4" aria-hidden="true" />
						</button>
					);
				})}
			</div>
			{toolbarActions}
		</div>
	);

	if (items.length === 0) {
		return (
			<div className="space-y-2">
				<div className="flex items-center justify-between gap-3 flex-wrap">
					{label ? <span className="block text-sm font-medium">{label}</span> : null}
					{controls}
				</div>
				<div>{emptyState}</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				{label ? <span className="block text-sm font-medium">{label}</span> : null}
				{controls}
			</div>

			{layout.presentation === 'list' ? (
				<div
					className={cn(
						activeLayoutOption.contentListClass ?? 'space-y-3',
						getContentClassName?.(layout)
					)}
				>
					{items.map((item, index) => (
						<div
							key={getItemId(item, index)}
							className={cn(
								activeLayoutOption.contentItemClassName,
								getItemClassName?.(layout, item, index)
							)}
						>
							{renderItem(item, index, layout)}
						</div>
					))}
				</div>
			) : layout.presentation === 'grid' ? (
				<div
					className={cn(
						activeLayoutOption.contentGridClass ?? 'grid gap-3',
						getContentClassName?.(layout)
					)}
				>
					{items.map((item, index) => (
						<div
							key={getItemId(item, index)}
							className={cn(
								activeLayoutOption.contentItemClassName,
								getItemClassName?.(layout, item, index)
							)}
						>
							{renderItem(item, index, layout)}
						</div>
					))}
				</div>
			) : (
				<Tabs
					value={activeItemId}
					onValueChange={onActiveItemIdChange}
					className="w-full space-y-3"
				>
					<TabsList
						className={cn(
							'h-auto w-full rounded-md bg-muted p-1 grid gap-2',
							activeLayoutOption.triggerGridClass
						)}
					>
						{items.map((item, index) => {
							const itemId = getItemId(item, index);
							const itemLabel = getItemLabel(item, index);

							return (
								<TabsTrigger key={itemId} value={itemId} className="w-full truncate">
									{itemLabel}
								</TabsTrigger>
							);
						})}
					</TabsList>

					{items.map((item, index) => {
						const itemId = getItemId(item, index);

						return (
							<TabsContent key={itemId} value={itemId} className="mt-3">
								{renderItem(item, index, layout)}
							</TabsContent>
						);
					})}
				</Tabs>
			)}
		</div>
	);
}