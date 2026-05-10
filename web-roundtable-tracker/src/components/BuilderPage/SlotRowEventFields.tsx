import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { AccomplishmentLevel } from '@/models/encounters/encounter.types';
import type { UseFormReturn } from 'react-hook-form';
import type { BuilderFormValues } from './builderConvert';
import type { SlotType } from './builderXp';

const ACCOMPLISHMENT_OPTIONS: {
	value: AccomplishmentLevel;
	label: string;
}[] = [
	{ value: 'story', label: 'Story (0 XP)' },
	{ value: 'minor', label: 'Minor (10 XP)' },
	{ value: 'moderate', label: 'Moderate (30 XP)' },
	{ value: 'major', label: 'Major (80 XP)' },
];

interface SlotRowEventFieldsProps {
	index: number;
	slotType: SlotType;
	form: UseFormReturn<BuilderFormValues>;
}

export function SlotRowEventFields({
	index,
	slotType,
	form,
}: SlotRowEventFieldsProps) {
	const { control } = form;

	if (slotType !== 'reinforcement' && slotType !== 'narrative') {
		return null;
	}

	return (
		<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
			{slotType === 'reinforcement' && (
				<FormField
					control={control}
					name={`slots.${index}.reinforcementRound` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Reinforcement Round</FormLabel>
							<FormControl>
								<Input
									type="number"
									min={1}
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
			)}

			{slotType === 'narrative' && (
				<>
					<FormField
						control={control}
						name={`slots.${index}.eventRound` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Start Round</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										value={field.value ?? ''}
										onChange={(event) => {
											const value = event.target.value;
											field.onChange(
												value === '' ? undefined : Number(value)
											);
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
						name={`slots.${index}.repeatInterval` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Repeat Every (Optional)</FormLabel>
								<FormControl>
									<Input
										type="number"
										min={1}
										value={field.value ?? ''}
										onChange={(event) => {
											const value = event.target.value;
											field.onChange(
												value === '' ? undefined : Number(value)
											);
										}}
										onBlur={field.onBlur}
										name={field.name}
										ref={field.ref}
										placeholder="Leave blank for one-time"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={`slots.${index}.accomplishmentLevel` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Accomplishment Tier</FormLabel>
								<FormControl>
									<Select
										value={field.value ?? 'story'}
										onValueChange={(value) =>
											field.onChange(value as AccomplishmentLevel)
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select tier" />
										</SelectTrigger>
										<SelectContent>
											{ACCOMPLISHMENT_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			)}
		</div>
	);
}
