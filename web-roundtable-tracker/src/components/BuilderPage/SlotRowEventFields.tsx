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
import { Switch } from '@/components/ui/switch';
import type { AccomplishmentLevel } from '@/models/encounters/encounter.types';
import { type UseFormReturn, Controller } from 'react-hook-form';
import type { BuilderFormValues } from './builderConvert';
import type { SlotType } from './builderXp';
import { DcPicker } from './DcPicker';
import { RewardPenaltyList } from './RewardPenaltyList';
import { PartySizePicker } from './PartySizePicker';

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

	if (
		slotType !== 'reinforcement' &&
		slotType !== 'narrative' &&
		slotType !== 'skillChallenge'
	) {
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
											field.onChange(value === '' ? undefined : Number(value));
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

			{slotType === 'skillChallenge' && (
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

					<FormField
						control={control}
						name={`slots.${index}.shared` as const}
						render={({ field }) => (
							<FormItem className="flex flex-col justify-center space-y-1">
								<FormLabel>Shared Progress</FormLabel>
								<FormControl>
									<Switch
										checked={field.value ?? true}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<p className="text-xs text-muted-foreground">
									{field.value
										? 'Party shares progress'
										: 'Each PC tracks independently'}
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={`slots.${index}.successesRequired` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Successes Required</FormLabel>
								<FormControl>
									<div className="mt-2">
										<PartySizePicker
											value={field.value}
											onChange={field.onChange}
											min={1}
											max={12}
											rows={3}
											buttonSize="sm"
											showReadout={true}
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={`slots.${index}.failuresRequired` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel>Failures Required</FormLabel>
								<FormControl>
									<div className="mt-2">
										<PartySizePicker
											value={field.value}
											onChange={field.onChange}
											min={1}
											max={8}
											rows={2}
											buttonSize="sm"
											showReadout={true}
										/>
									</div>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={control}
						name={`slots.${index}.finishWhenMaxSuccesses` as const}
						render={({ field }) => (
							<FormItem className="flex flex-col justify-center space-y-1">
								<FormLabel>End Challenge on Max</FormLabel>
								<FormControl>
									<Switch
										checked={field.value ?? false}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<p className="text-xs text-muted-foreground">
									Automatically end when reaching max successes
								</p>
								<FormMessage />
							</FormItem>
						)}
					/>
				</>
			)}
			{slotType === 'skillChallenge' && (
				<div className="col-span-full space-y-3">
					{/* Top metadata */}
					<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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

						<FormField
							control={control}
							name={`slots.${index}.shared` as const}
							render={({ field }) => (
								<FormItem className="flex flex-col justify-center space-y-1">
									<FormLabel>Shared</FormLabel>
									<FormControl>
										<Switch
											checked={field.value ?? true}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<p className="text-xs text-muted-foreground">
										{field.value
											? 'Party shares progress'
											: 'Each PC tracks independently'}
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					{/* Successes section */}
					<div className="space-y-3 rounded-md border p-3">
						<h4 className="text-sm font-semibold">Successes</h4>

						<FormField
							control={control}
							name={`slots.${index}.skillChallengeDCs` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>Difficulty Classes</FormLabel>
									<FormControl>
										<DcPicker
											dcs={field.value ?? []}
											onDcsChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name={`slots.${index}.successesRequired` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>Successes Required</FormLabel>
									<FormControl>
										<div className="mt-2">
											<PartySizePicker
												value={field.value}
												onChange={field.onChange}
												min={1}
												max={12}
												rows={3}
												buttonSize="sm"
												showReadout={true}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name={`slots.${index}.finishWhenMaxSuccesses` as const}
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between space-y-0 rounded-sm border px-3 py-2">
									<div className="space-y-0.5">
										<FormLabel>End on Max Successes</FormLabel>
										<p className="text-xs text-muted-foreground">
											Automatically end challenge when max is reached
										</p>
									</div>
									<FormControl>
										<Switch
											checked={field.value ?? false}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Controller
							control={control}
							name={`slots.${index}.rewards` as const}
							render={({ field }) => (
								<RewardPenaltyList
									items={field.value ?? []}
									onItemsChange={field.onChange}
									label="Rewards"
									placeholder="No rewards configured"
								/>
							)}
						/>
					</div>

					{/* Failures section */}
					<div className="space-y-3 rounded-md border p-3">
						<h4 className="text-sm font-semibold">Failures</h4>

						<FormField
							control={control}
							name={`slots.${index}.failuresRequired` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>Failures Required</FormLabel>
									<FormControl>
										<div className="mt-2">
											<PartySizePicker
												value={field.value}
												onChange={field.onChange}
												min={1}
												max={8}
												rows={2}
												buttonSize="sm"
												showReadout={true}
											/>
										</div>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={control}
							name={`slots.${index}.finishWhenMaxFailures` as const}
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between space-y-0 rounded-sm border px-3 py-2">
									<div className="space-y-0.5">
										<FormLabel>End on Max Failures</FormLabel>
										<p className="text-xs text-muted-foreground">
											Automatically end challenge when max is reached
										</p>
									</div>
									<FormControl>
										<Switch
											checked={field.value ?? false}
											onCheckedChange={field.onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Controller
							control={control}
							name={`slots.${index}.penalties` as const}
							render={({ field }) => (
								<RewardPenaltyList
									items={field.value ?? []}
									onItemsChange={field.onChange}
									label="Penalties"
									placeholder="No penalties configured"
								/>
							)}
						/>
					</div>
				</div>
			)}
		</div>
	);
}
