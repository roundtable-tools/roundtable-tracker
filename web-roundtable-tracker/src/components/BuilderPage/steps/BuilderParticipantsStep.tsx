import { TabsContent } from '@/components/ui/tabs';
import { ParticipantListSection } from '../sections/ParticipantListSection';
import type { BuilderListLayoutKey } from '../BuilderListLayout';
import type { BuilderFormValues } from '../builderConvert';
import type { AdditionalDataBlockKey } from '../SlotRow';
import type {
	UseFieldArrayRemove,
	UseFieldArrayUpdate,
	UseFormReturn,
} from 'react-hook-form';

interface ParticipantItem {
	id: string;
	slotIndex: number;
}

interface BuilderParticipantsStepProps {
	form: UseFormReturn<BuilderFormValues>;
	items: ParticipantItem[];
	resolvedSlots: BuilderFormValues['slots'];
	remove: UseFieldArrayRemove;
	update: UseFieldArrayUpdate<BuilderFormValues, 'slots'>;
	usedAdditionalDataBlocks: AdditionalDataBlockKey[];
	activeItemId: string;
	onActiveItemIdChange: (id: string) => void;
	append: (slot: BuilderFormValues['slots'][number]) => void;
	layoutKey?: BuilderListLayoutKey;
	onLayoutKeyChange: (key: BuilderListLayoutKey) => void;
}

export function BuilderParticipantsStep({
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
}: BuilderParticipantsStepProps) {
	return (
		<TabsContent value="participants" className="space-y-3">
			<section className="space-y-3">
				<ParticipantListSection
					form={form}
					items={items}
					resolvedSlots={resolvedSlots}
					remove={remove}
					update={update}
					usedAdditionalDataBlocks={usedAdditionalDataBlocks}
					activeItemId={activeItemId}
					onActiveItemIdChange={onActiveItemIdChange}
					append={append}
					layoutKey={layoutKey}
					onLayoutKeyChange={onLayoutKeyChange}
				/>
			</section>
		</TabsContent>
	);
}
