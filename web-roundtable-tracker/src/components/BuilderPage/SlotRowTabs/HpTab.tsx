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

interface HpTabProps {
	index: number;
	slot: BuilderSlot;
	slotType: string;
	control: UseFormReturn<BuilderFormValues>['control'];
	onRemove: () => void;
}

export function HpTab({ index, slot, slotType, control, onRemove }: HpTabProps) {
	return (
		<TabsContent value="hp" className="space-y-3 mt-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<p className="text-sm font-medium">HP / Hardness</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={onRemove}
					title="Remove HP section"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
				<FormField
					control={control}
					name={`slots.${index}.maxHealth` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>HP Override</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									value={field.value ?? slot.maxHealth ?? ''}
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
				{slotType === 'hazard' ? (
					<FormField
						control={control}
						name={`slots.${index}.hardness` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Hardness</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={0}
										value={field.value ?? slot.hardness ?? ''}
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
				) : null}
			</div>
		</TabsContent>
	);
}
