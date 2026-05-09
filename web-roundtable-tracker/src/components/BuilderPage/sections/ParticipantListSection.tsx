import { Skull, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BuilderListLayout } from '../BuilderListLayout';
import { SlotRow, PARTICIPANT_SLOT_TYPES } from '../SlotRow';
import { defaultSlot } from '../builderConvert';
import type { AdditionalDataBlockKey } from '../SlotRow';
import type { BuilderFormValues } from '../builderConvert';
import type { UseFormReturn, UseFieldArrayRemove, UseFieldArrayUpdate } from 'react-hook-form';

const SLOT_ICONS: Record<string, typeof Skull> = {
	creature: Skull,
	hazard: TriangleAlert,
};

interface ParticipantItem {
	id: string;
	slotIndex: number;
}

interface ParticipantListSectionProps {
	form: UseFormReturn<BuilderFormValues>;
	items: ParticipantItem[];
	resolvedSlots: BuilderFormValues['slots'];
	remove: UseFieldArrayRemove;
	update: UseFieldArrayUpdate<BuilderFormValues, 'slots'>;
	usedAdditionalDataBlocks: AdditionalDataBlockKey[];
	activeItemId: string;
	onActiveItemIdChange: (id: string) => void;
	append: (slot: BuilderFormValues['slots'][number]) => void;
}

export function ParticipantListSection({
	form,
	items,
	resolvedSlots,
	remove,
	update,
	usedAdditionalDataBlocks,
	activeItemId,
	onActiveItemIdChange,
	append,
}: ParticipantListSectionProps) {
	return (
		<BuilderListLayout
			label="Participants"
			allowedLayouts={['compact-tabs', 'wide-tabs', 'compact-list', 'list']}
			items={items}
			getItemId={(item) => item.id}
			getItemLabel={(item, index) => {
				const slot = resolvedSlots[item.slotIndex];

				return slot?.name?.trim().length ? slot.name : `Participant ${index + 1}`;
			}}
			getItemIcon={(item) => {
				const slot = resolvedSlots[item.slotIndex];
				const Icon = slot?.type ? (SLOT_ICONS[slot.type] ?? Skull) : Skull;

				return <Icon className="h-3.5 w-3.5" aria-hidden="true" />;
			}}
			getItemMeta={(item) => {
				const slot = resolvedSlots[item.slotIndex];

				if (!slot) return '';

				return `Lv ${slot.level ?? 1} ×${slot.count ?? 1}`;
			}}
			renderItem={(item) => (
				<SlotRow
					index={item.slotIndex}
					form={form}
					remove={remove}
					update={update}
					allowedTypes={PARTICIPANT_SLOT_TYPES}
					usedAdditionalDataBlocks={usedAdditionalDataBlocks}
				/>
			)}
			onRemoveItem={(item) => remove(item.slotIndex)}
			emptyState={
				<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
					No participants yet. Add a creature or hazard to the encounter.
				</div>
			}
			activeItemId={activeItemId}
			onActiveItemIdChange={onActiveItemIdChange}
			toolbarActions={
				<div className="flex items-center gap-1 rounded-lg border bg-background p-1">
					<span className="text-sm font-medium mx-1">Add participant</span>
					<Button
						type="button"
						variant="default"
						title="Add creature participant"
						size="sm"
						className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground"
						onClick={() => append(defaultSlot())}
					>
						<Skull className="h-3.5 w-3.5" aria-hidden="true" />
					</Button>
					<Button
						type="button"
						variant="default"
						title="Add hazard participant"
						size="sm"
						className="flex h-7 w-7 items-center justify-center rounded bg-primary text-primary-foreground"
						onClick={() => append({ ...defaultSlot(), type: 'hazard' })}
					>
						<TriangleAlert className="h-3.5 w-3.5" aria-hidden="true" />
					</Button>
				</div>
			}
		/>
	);
}
