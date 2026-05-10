import { ScrollText, ShieldPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BuilderListLayout, type BuilderListLayoutKey } from '../BuilderListLayout';
import { SlotRow, EVENT_SLOT_TYPES } from '../SlotRow';
import { defaultSlot } from '../builderConvert';
import type { AdditionalDataBlockKey } from '../SlotRow';
import type { BuilderFormValues } from '../builderConvert';
import type { UseFormReturn, UseFieldArrayRemove, UseFieldArrayUpdate } from 'react-hook-form';

const EVENT_ICONS: Record<string, typeof ScrollText> = {
	narrative: ScrollText,
	reinforcement: ShieldPlus,
};

interface EventItem {
	id: string;
	slotIndex: number;
}

interface EventListSectionProps {
	form: UseFormReturn<BuilderFormValues>;
	items: EventItem[];
	resolvedSlots: BuilderFormValues['slots'];
	remove: UseFieldArrayRemove;
	update: UseFieldArrayUpdate<BuilderFormValues, 'slots'>;
	usedAdditionalDataBlocks: AdditionalDataBlockKey[];
	activeItemId: string;
	onActiveItemIdChange: (id: string) => void;
	append: (slot: BuilderFormValues['slots'][number]) => void;
	layoutKey?: BuilderListLayoutKey;
	onLayoutKeyChange?: (key: BuilderListLayoutKey) => void;
}

export function EventListSection({
	form,
	items,
	resolvedSlots,
	remove,
	update,
	usedAdditionalDataBlocks,
	activeItemId,
	onActiveItemIdChange,
	append,
	layoutKey,
	onLayoutKeyChange,
}: EventListSectionProps) {
	return (
		<BuilderListLayout
			label="Events"
			layoutKey={layoutKey}
			onLayoutKeyChange={onLayoutKeyChange}
			allowedLayouts={['compact-tabs', 'wide-tabs', 'compact-list', 'list']}
			items={items}
			getItemId={(item) => item.id}
			getItemLabel={(item, index) => {
				const slot = resolvedSlots[item.slotIndex];

				return slot?.name?.trim().length ? slot.name : `Event ${index + 1}`;
			}}
			getItemIcon={(item) => {
				const slot = resolvedSlots[item.slotIndex];
				const Icon = slot?.type ? (EVENT_ICONS[slot.type] ?? ScrollText) : ScrollText;

				return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
			}}
			getItemMeta={(item) => {
				const slot = resolvedSlots[item.slotIndex];

				if (!slot) return '';

				return slot.eventRound != null ? `Rd ${slot.eventRound}` : '';
			}}
			renderItem={(item) => (
				<SlotRow
					index={item.slotIndex}
					form={form}
					remove={remove}
					update={update}
					allowedTypes={EVENT_SLOT_TYPES}
					usedAdditionalDataBlocks={usedAdditionalDataBlocks}
				/>
			)}
			onRemoveItem={(item) => remove(item.slotIndex)}
			emptyState={
				<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
					No events yet. Add a narrative or reinforcement event.
				</div>
			}
			activeItemId={activeItemId}
			onActiveItemIdChange={onActiveItemIdChange}
			toolbarActions={
				<div className="flex items-center gap-1 rounded-lg border bg-background p-1">
					<span className="text-sm font-medium mx-1">Add event</span>
					<Button
						type="button"
						variant="default"
						title="Add reinforcement event"
						size="sm"
						className={'flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground'}
						onClick={() => append({ ...defaultSlot(), type: 'reinforcement' })}
					>
						<ShieldPlus className="h-3.5 w-3.5" aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="default"
						title="Add narrative event"
						size="sm"
						className={'flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground'}
						onClick={() => append({ ...defaultSlot(), type: 'narrative' })}
					>
						<ScrollText className="h-3.5 w-3.5" aria-hidden="true" />
					</Button>
				</div>
			}
		/>
	);
}
