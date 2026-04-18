import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Trash2 } from 'lucide-react';
import type { BuilderSlot } from '../builderXp';
import type { UseFormReturn } from 'react-hook-form';
import type { BuilderFormValues } from '../builderConvert';

interface InitiativeTabProps {
	index: number;
	slot: BuilderSlot;
	control: UseFormReturn<BuilderFormValues>['control'];
	onRemove: () => void;
}

export function InitiativeTab({ index, slot, control, onRemove }: InitiativeTabProps) {
	return (
		<TabsContent value="initiative" className="space-y-3 mt-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<p className="text-sm font-medium">Initiative</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={onRemove}
					title="Remove Initiative section"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
				<FormField
					control={control}
					name={`slots.${index}.initiativeBonus` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Initiative Bonus</FormLabel>
							<FormControl>
								<Input
									type="number"
									value={field.value ?? ''}
									onChange={(event) => {
										const value = event.target.value;
										field.onChange(value === '' ? undefined : Number(value));
									}}
									onBlur={field.onBlur}
									name={field.name}
									ref={field.ref}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name={`slots.${index}.initiativeDescription` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Initiative Description</FormLabel>
							<FormControl>
								<Input
									placeholder="e.g., Reroll, flat boost, etc."
									value={field.value ?? ''}
									onChange={field.onChange}
									onBlur={field.onBlur}
									name={field.name}
									ref={field.ref}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</TabsContent>
	);
}
