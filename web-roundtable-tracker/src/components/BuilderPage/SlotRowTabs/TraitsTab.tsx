import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import type { BuilderSlot } from '../builderXp';
import { UseFormSetValue } from 'react-hook-form';
import { BuilderFormValues } from '../builderConvert';

interface TraitCategory {
	color: 'blue' | 'orange' | 'purple' | 'green' | 'red';
	traits: string[];
}

const TRAIT_CATEGORIES: TraitCategory[] = [
	{
		color: 'blue',
		traits: ['Uncommon'],
	},
	{
		color: 'orange',
		traits: ['Rare'],
	},
	{
		color: 'purple',
		traits: ['Unique'],
	},
	{
		color: 'green',
		traits: ['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan'],
	},
	{
		color: 'red',
		traits: [], // General traits default to red
	},
];

function getTraitColor(trait: string): TraitCategory['color'] {
	for (const category of TRAIT_CATEGORIES) {
		if (category.traits.includes(trait)) {
			return category.color;
		}
	}

	return 'red';
}

interface TraitsTabProps {
	index: number;
	slot: BuilderSlot;
	setValue: UseFormSetValue<BuilderFormValues>;
	onRemove: () => void;
}

export function TraitsTab({ index, slot, setValue, onRemove }: TraitsTabProps) {
	return (
		<TabsContent value="traits" className="space-y-3 mt-3">
			<div className="space-y-2 rounded-md border bg-background/70 p-3">
				<div className="flex items-center justify-between gap-2">
					<p className="text-sm font-medium">Traits</p>
					<div className="flex gap-2">
						<Input
							type="text"
							placeholder="Add trait..."
							onKeyDown={(event) => {
								if (event.key === 'Enter' && event.currentTarget.value.trim()) {
									const traitValue = event.currentTarget.value.trim();
									const nextTraits = [...(slot.traits ?? []), traitValue];
									setValue(`slots.${index}.traits`, nextTraits, {
										shouldDirty: true,
										shouldTouch: true,
									});
									event.currentTarget.value = '';
								}
							}}
							className="h-8 flex-1"
						/>
						<Button
							type="button"
							variant="destructive"
							size="sm"
							onClick={onRemove}
							title="Remove Traits section"
						>
							<Trash2 className="h-4 w-4" />
						</Button>
					</div>
				</div>
				<div className="flex flex-wrap gap-2">
					{(slot.traits ?? []).map((trait, traitIndex) => (
						<Badge
							key={`trait-${index}-${traitIndex}`}
							variant="outline"
							className={`cursor-pointer background-${getTraitColor(trait)}`}
							onClick={() => {
								const nextTraits = (slot.traits ?? []).filter(
									(_, idx) => idx !== traitIndex
								);
								setValue(`slots.${index}.traits`, nextTraits, {
									shouldDirty: true,
									shouldTouch: true,
								});
							}}
						>
							{trait} ×
						</Badge>
					))}
				</div>
			</div>
		</TabsContent>
	);
}
