import { useMemo, useState, type ReactNode } from 'react';
import { Grid2x2, LayoutGrid, LayoutList } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export type BuilderListLayoutSelection = {
	mode: 'tabs' | 'all';
	density: 'few-columns' | 'many-columns';
};

export type BuilderListLayoutMode =
	| 'tabs-few-columns'
	| 'tabs-many-columns'
	| 'all';

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
	defaultLayoutMode?: BuilderListLayoutMode;
	label?: string;
	toolbarActions?: ReactNode;
}

function modeToSelection(mode: BuilderListLayoutMode): BuilderListLayoutSelection {
	if (mode === 'all') {
		return { mode: 'all', density: 'few-columns' };
	}

	if (mode === 'tabs-many-columns') {
		return { mode: 'tabs', density: 'many-columns' };
	}

	return { mode: 'tabs', density: 'few-columns' };
}

export function BuilderListLayout<TItem>({
	items,
	getItemId,
	getItemLabel,
	renderItem,
	emptyState,
	activeItemId,
	onActiveItemIdChange,
	defaultLayoutMode = 'tabs-few-columns',
	label,
	toolbarActions,
}: BuilderListLayoutProps<TItem>) {
	const [layoutMode, setLayoutMode] =
		useState<BuilderListLayoutMode>(defaultLayoutMode);
	const layout = useMemo(() => modeToSelection(layoutMode), [layoutMode]);
	const controls = (
		<div className="ml-auto flex items-center gap-2">
			<div className="flex items-center gap-1 rounded-lg border bg-background p-1">
				<button
					type="button"
					title="Few columns"
					onClick={() => setLayoutMode('tabs-few-columns')}
					className={cn(
						'flex h-7 w-7 items-center justify-center rounded',
						layoutMode === 'tabs-few-columns'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
				>
					<LayoutList className="h-4 w-4" aria-hidden="true" />
				</button>
				<button
					type="button"
					title="Many columns"
					onClick={() => setLayoutMode('tabs-many-columns')}
					className={cn(
						'flex h-7 w-7 items-center justify-center rounded',
						layoutMode === 'tabs-many-columns'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
				>
					<Grid2x2 className="h-4 w-4" aria-hidden="true" />
				</button>
				<button
					type="button"
					title="Render all items"
					onClick={() => setLayoutMode('all')}
					className={cn(
						'flex h-7 w-7 items-center justify-center rounded',
						layoutMode === 'all'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-accent hover:text-foreground'
					)}
				>
					<LayoutGrid className="h-4 w-4" aria-hidden="true" />
				</button>
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

	const gridClass =
		layout.density === 'few-columns'
			? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
			: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6';

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between gap-3 flex-wrap">
				{label ? <span className="block text-sm font-medium">{label}</span> : null}
				{controls}
			</div>

			{layout.mode === 'all' ? (
				<div className="space-y-3">
					{items.map((item, index) => (
						<div key={getItemId(item, index)}>
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
							gridClass
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