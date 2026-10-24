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
import type { UseFormReturn } from 'react-hook-form';
import type { BuilderFormValues } from '../builderConvert';

interface DisableChecksTabProps {
	index: number;
	control: UseFormReturn<BuilderFormValues>['control'];
	onRemove: () => void;
}

/** Disable checks of a creature that can be disabled, e.g. a clockwork. */
export function DisableChecksTab({
	index,
	control,
	onRemove,
}: DisableChecksTabProps) {
	return (
		<TabsContent value="disable" className="space-y-3 mt-3">
			<div className="flex items-center justify-between gap-2 mb-3">
				<p className="text-sm font-medium">Disable Checks</p>
				<Button
					type="button"
					variant="destructive"
					size="sm"
					onClick={onRemove}
					title="Remove disable checks"
				>
					<Trash2 className="h-4 w-4" />
				</Button>
			</div>
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
				<FormField
					control={control}
					name={`slots.${index}.successesToDisable` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Successes</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
									value={field.value || ''}
									onChange={(event) => {
										const value = event.target.value;
										field.onChange(value === '' ? 0 : Number(value));
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
