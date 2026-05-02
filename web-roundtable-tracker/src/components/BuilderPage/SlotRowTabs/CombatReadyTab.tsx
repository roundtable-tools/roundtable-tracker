import { Button } from '@/components/ui/button';
import { TabsContent } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
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

interface CombatReadyTabProps {
	index: number;
	slot: BuilderSlot;
	control: UseFormReturn<BuilderFormValues>['control'];
	onRemove: () => void;
}

export function CombatReadyTab({
	index,
	slot,
	control,
	onRemove,
}: CombatReadyTabProps) {
	return (
		<TabsContent value="combat-ready" className="space-y-3 mt-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<p className="text-sm font-medium">Combat Ready</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={onRemove}
					title="Remove Combat Ready section"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
				<FormField
					control={control}
					name={`slots.${index}.combatReadyState` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Combat Ready State</FormLabel>
							<Select
								value={field.value ?? slot.combatReadyState ?? 'active'}
								onValueChange={field.onChange}
							>
								<FormControl>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="delayed">Delayed</SelectItem>
									<SelectItem value="defeated">Defeated</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={control}
					name={`slots.${index}.hiddenFromPlayers` as const}
					render={({ field }) => (
						<FormItem className="space-y-1 flex flex-col justify-center">
							<FormLabel>Hidden from Players</FormLabel>
							<FormControl>
								<Toggle
									pressed={field.value ?? false}
									onPressedChange={field.onChange}
									className="w-fit"
								>
									{field.value ? 'Hidden' : 'Visible'}
								</Toggle>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</div>
		</TabsContent>
	);
}
