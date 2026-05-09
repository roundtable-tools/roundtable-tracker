import { useMemo, useState, type ReactNode } from 'react';
import {
	Grid2x2,
	LayoutGrid,
	LayoutList,
	PanelsTopLeft,
	StretchHorizontal,
	X,
	AlignJustify,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type BuilderListLayoutKey =
	| 'compact-tabs'
	| 'wide-tabs'
	| 'wide-grid'
	| 'compact-grid'
	| 'list'
	| 'compact-list';

export type BuilderListLayoutSelection = {
	key: BuilderListLayoutKey;
	presentation: 'tabs' | 'grid' | 'list' | 'compact-list';
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
		contentListClass: 'space-y-0',
		contentItemClassName: 'min-w-0',
	},
	'compact-list': {
		key: 'compact-list',
		label: 'Compact list',
		icon: AlignJustify,
		selection: {
			key: 'compact-list',
			presentation: 'compact-list',
			density: 'compact',
		},
	},
};

interface BuilderListLayoutProps<TItem> {
	items: TItem[];
	getItemId: (item: TItem, index: number) => string;
	getItemLabel: (item: TItem, index: number) => string;
	/** Optional icon shown next to the label in wide-tabs triggers */
	getItemIcon?: (item: TItem, index: number) => ReactNode;
	/** Optional secondary meta text shown in wide-tabs triggers */
	getItemMeta?: (item: TItem, index: number) => string;
	renderItem: (
		item: TItem,
		index: number,
		layout: BuilderListLayoutSelection
	) => ReactNode;
	emptyState: ReactNode;
	activeItemId?: string;
	onActiveItemIdChange?: (id: string) => void;
	/** When provided, an X remove button is shown top-right of each item content area */
	onRemoveItem?: (item: TItem, index: number) => void;
	allowedLayouts?: BuilderListLayoutKey[];
	defaultLayout?: BuilderListLayoutKey;
	label?: string;
	/** Actions rendered on the left side of the toolbar */
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
	getItemIcon,
	getItemMeta,
	renderItem,
	emptyState,
	activeItemId,
	onActiveItemIdChange,
	onRemoveItem,
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

	/** Wrap item content with an optional remove button in the top-right corner */
	const wrapWithRemove = (
		item: TItem,
		index: number,
		content: ReactNode,
		wrapperClassName?: string
	) => {
		if (!onRemoveItem) {
			return wrapperClassName ? <div className={wrapperClassName}>{content}</div> : content;
		}

		return (
			<div className={cn('relative', wrapperClassName)}>
				<button
					type="button"
					title="Remove"
					onClick={() => onRemoveItem(item, index)}
					className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded text-destructive hover:bg-destructive/10"
				>
					<X className="h-4 w-4" aria-hidden="true" />
				</button>
				{content}
			</div>
		);
	};

	const layoutSwitcher = (
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
	);

	const toolbar = (
		<div className="flex items-center justify-between gap-3 flex-wrap">
			<div className="flex items-center gap-2 flex-wrap">
				{label ? <span className="block text-sm font-medium">{label}</span> : null}
				{toolbarActions}
			</div>
			{layoutSwitcher}
		</div>
	);

	if (items.length === 0) {
		return (
			<div className="space-y-2">
				{toolbar}
				<div>{emptyState}</div>
			</div>
		);
	}

	return (
		<div className="space-y-2">
			{toolbar}

			{layout.presentation === 'list' ? (
				<div
					className={cn(
						'rounded-md border bg-card divide-y overflow-hidden',
						getContentClassName?.(layout)
					)}
				>
					{items.map((item, index) => (
						<div
							key={getItemId(item, index)}
							className={cn(
								activeLayoutOption.contentItemClassName,
								'p-3',
								getItemClassName?.(layout, item, index)
							)}
						>
							{wrapWithRemove(item, index, renderItem(item, index, layout))}
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
								'rounded-md border bg-card p-3',
								getItemClassName?.(layout, item, index)
							)}
						>
							{wrapWithRemove(item, index, renderItem(item, index, layout))}
						</div>
					))}
				</div>
			) : layout.presentation === 'compact-list' ? (
				<div className={cn('flex flex-col sm:flex-row gap-0 rounded-md border bg-card overflow-hidden', getContentClassName?.(layout))}>
					{/* Nav list */}
					<div className="flex-none w-full sm:w-48 border-b sm:border-b-0 sm:border-r bg-muted/30 divide-y">
						{items.map((item, index) => {
							const itemId = getItemId(item, index);
							const isActive = itemId === activeItemId;

							return (
								<button
									key={itemId}
									type="button"
									onClick={() => onActiveItemIdChange?.(itemId)}
									className={cn(
										'w-full px-3 py-2 text-left text-sm truncate transition-colors',
										isActive
											? 'bg-primary/10 text-primary font-medium'
											: 'text-muted-foreground hover:bg-accent hover:text-foreground'
									)}
								>
									{getItemLabel(item, index)}
								</button>
							);
						})}
					</div>
					{/* Content panel */}
					<div className="flex-1 min-w-0 p-3">
						{items.map((item, index) => {
							const itemId = getItemId(item, index);

							if (itemId !== activeItemId) return null;

							return (
								<div key={itemId} className={cn('min-w-0', getItemClassName?.(layout, item, index))}>
									{wrapWithRemove(item, index, renderItem(item, index, layout))}
								</div>
							);
						})}
					</div>
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
							const isWide = layout.density === 'wide';
							const icon = isWide ? getItemIcon?.(item, index) : undefined;
							const meta = isWide ? getItemMeta?.(item, index) : undefined;

							return (
								<TabsTrigger key={itemId} value={itemId} className="w-full truncate">
									{isWide && icon ? (
										<span className="flex items-center gap-1.5 w-full min-w-0">
											<span className="flex-none">{icon}</span>
											<span className="truncate">{itemLabel}</span>
											{meta ? <span className="ml-auto flex-none text-xs text-muted-foreground font-normal">{meta}</span> : null}
										</span>
									) : (
										itemLabel
									)}
								</TabsTrigger>
							);
						})}
					</TabsList>

					{items.map((item, index) => {
						const itemId = getItemId(item, index);

						return (
							<TabsContent key={itemId} value={itemId} className="mt-3">
								{wrapWithRemove(item, index, renderItem(item, index, layout))}
							</TabsContent>
						);
					})}
				</Tabs>
			)}
		</div>
	);
}