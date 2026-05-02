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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import type { BuilderSlot } from '../builderXp';
import type { UseFormReturn } from 'react-hook-form';
import type { BuilderFormValues } from '../builderConvert';
import { LevelAdjustment } from '@/models/utility/level/Level';

const ADJUSTMENT_OPTIONS: { value: LevelAdjustment | 'none'; label: string }[] =
	[
		{ value: 'none', label: 'None' },
		{ value: 'weak', label: 'Weak' },
		{ value: 'elite', label: 'Elite' },
		{ value: 'elite-offense', label: 'Elite Offense' },
		{ value: 'elite-defense', label: 'Elite Defense' },
	];

interface AdjustmentTabProps {
	index: number;
	slot: BuilderSlot;
	setValue: (path: string, value: any, options: any) => void;
	control: UseFormReturn<BuilderFormValues>['control'];
	onRemove: () => void;
}

export function AdjustmentTab({
	index,
	slot,
	setValue,
	control,
	onRemove,
}: AdjustmentTabProps) {
	return (
		<TabsContent value="adjustment" className="space-y-3 mt-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<p className="text-sm font-medium">Adjustment</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={onRemove}
					title="Remove Adjustment section"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-2 rounded-md border bg-background/70 p-3 sm:grid-cols-2 lg:grid-cols-4">
				<div className="space-y-1">
					<FormLabel>Adjustment Mode</FormLabel>
					<Select
						value={slot.adjustment !== 'none' ? slot.adjustment : '__custom__'}
						onValueChange={(value) => {
							if (value === '__custom__') {
								setValue(`slots.${index}.adjustment`, 'none', {
									shouldDirty: true,
									shouldTouch: true,
								});

								return;
							}
							setValue(
								`slots.${index}.adjustment`,
								value as LevelAdjustment | 'none',
								{
									shouldDirty: true,
									shouldTouch: true,
								}
							);
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ADJUSTMENT_OPTIONS.filter((o) => o.value !== 'none').map((o) => (
								<SelectItem key={o.value} value={o.value}>
									{o.label}
								</SelectItem>
							))}
							<SelectItem value="__custom__">Custom</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<FormField
					control={control}
					name={`slots.${index}.adjustmentDescription` as const}
					render={({ field }) => (
						<FormItem className="space-y-1 sm:col-span-2 lg:col-span-2">
							<FormLabel>Custom Adjustment Description</FormLabel>
							<FormControl>
								<Input
									placeholder="Custom adjustment details"
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
				<FormField
					control={control}
					name={`slots.${index}.adjustmentLevelModifier` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Custom Level Modifier</FormLabel>
							<FormControl>
								<Input
									type="number"
									step="0.1"
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
			</div>
		</TabsContent>
	);
}
