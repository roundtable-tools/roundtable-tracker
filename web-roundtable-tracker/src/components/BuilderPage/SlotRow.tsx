import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
	UseFieldArrayRemove,
	UseFieldArrayUpdate,
	UseFormReturn,
} from 'react-hook-form';
import type { BuilderFormValues } from './builderConvert';
import { defaultSlot } from './builderConvert';
import type { BuilderSlot, SlotType, SideType } from './builderXp';
import type { LevelAdjustment } from '@/models/utility/level/Level';

const SLOT_TYPES: { value: SlotType; label: string }[] = [
	{ value: 'creature', label: 'Creature' },
	{ value: 'hazard', label: 'Hazard' },
	{ value: 'reinforcement', label: 'Reinforcement' },
	{ value: 'narrative', label: 'Narrative Event' },
	{ value: 'aura', label: 'Aura Event' },
];

const SIDE_OPTIONS: { value: SideType; label: string }[] = [
	{ value: 'enemy', label: 'Enemy' },
	{ value: 'ally', label: 'Ally' },
	{ value: 'neutral', label: 'Neutral' },
];

const ADJUSTMENT_OPTIONS: { value: LevelAdjustment | 'none'; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'weak', label: 'Weak' },
	{ value: 'elite', label: 'Elite' },
	{ value: 'elite-offense', label: 'Elite Offense' },
	{ value: 'elite-defense', label: 'Elite Defense' },
];

interface SlotRowProps {
	index: number;
	form: UseFormReturn<BuilderFormValues>;
	remove: UseFieldArrayRemove;
	update: UseFieldArrayUpdate<BuilderFormValues, 'slots'>;
	isOnly: boolean;
}

export function SlotRow({ index, form, remove, update, isOnly }: SlotRowProps) {
	const { control, watch } = form;
	const slot = watch(`slots.${index}`) as BuilderSlot;
	const slotType = slot.type;

	const handleTypeChange = (newType: SlotType) => {
		const current = form.getValues(`slots.${index}`);
		const reset = defaultSlot();

		update(index, { ...reset, id: current.id, type: newType });
	};

	const handleRemove = () => {
		if (!isOnly) {
			remove(index);

			return;
		}

		const current = form.getValues(`slots.${index}`);
		const reset = defaultSlot();

		update(index, {
			...reset,
			id: current.id,
			type: current.type,
			name: '',
			count: 0,
		});
	};

	return (
		<div className="border rounded-md p-3 space-y-2 bg-card">
			<div className="flex gap-2 flex-wrap items-end">
				{/* Type */}
				<FormField
					control={control}
					name={`slots.${index}.type` as const}
					render={({ field }) => (
						<FormItem className="space-y-1 min-w-[160px]">
							<FormLabel>Type</FormLabel>
							<FormControl>
								<Select
									value={field.value}
									onValueChange={(value) => handleTypeChange(value as SlotType)}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SLOT_TYPES.map((o) => (
											<SelectItem key={o.value} value={o.value}>
												{o.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Name */}
				<FormField
					control={control}
					name={`slots.${index}.name` as const}
					render={({ field }) => (
						<FormItem className="space-y-1 flex-1 min-w-[140px]">
							<FormLabel>Name</FormLabel>
							<FormControl>
								<Input
									placeholder={
										slotType === 'creature'
											? `Training Dummy ${index + 1}`
											: 'Goblin'
									}
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Creature & Reinforcement fields */}
				{(slotType === 'creature' ||
					slotType === 'reinforcement' ||
					slotType === 'hazard') && (
					<>
						<FormField
							control={control}
							name={`slots.${index}.side` as const}
							render={({ field }) => (
								<FormItem className="space-y-1 min-w-[100px]">
									<FormLabel>Side</FormLabel>
									<FormControl>
										<Select
											value={field.value}
											onValueChange={(value) => field.onChange(value as SideType)}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{SIDE_OPTIONS.map((o) => (
													<SelectItem key={o.value} value={o.value}>
														{o.label}
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
							name={`slots.${index}.level` as const}
							render={({ field }) => (
								<FormItem className="space-y-1 w-[70px]">
									<FormLabel>Level</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={-1}
											placeholder="1"
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
							name={`slots.${index}.count` as const}
							render={({ field }) => (
								<FormItem className="space-y-1 w-[70px]">
									<FormLabel>Count</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
											placeholder="1"
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

						{(slotType === 'creature' || slotType === 'hazard') && (
							<FormField
								control={control}
								name={`slots.${index}.maxHealth` as const}
								render={({ field }) => (
									<FormItem className="space-y-1 w-[90px]">
										<FormLabel>Max HP</FormLabel>
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
						)}

						{(slotType === 'creature' || slotType === 'reinforcement') && (
							<FormField
								control={control}
								name={`slots.${index}.adjustment` as const}
								render={({ field }) => (
									<FormItem className="space-y-1 min-w-[120px]">
										<FormLabel>Adjustment</FormLabel>
										<FormControl>
											<Select
												value={field.value}
												onValueChange={(value) =>
													field.onChange(value as LevelAdjustment | 'none')
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{ADJUSTMENT_OPTIONS.map((o) => (
														<SelectItem key={o.value} value={o.value}>
															{o.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{slotType === 'hazard' && (
							<FormField
								control={control}
								name={`slots.${index}.isSimpleHazard` as const}
								render={({ field }) => (
									<FormItem className="flex items-center gap-2 mt-5 space-y-0">
										<FormControl>
											<input
												type="checkbox"
												id={`simple-hazard-${index}`}
												className="h-4 w-4"
												checked={Boolean(field.value)}
												onChange={(event) =>
													field.onChange(event.target.checked)
												}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
											/>
										</FormControl>
										<FormLabel htmlFor={`simple-hazard-${index}`}>
											Simple Hazard
										</FormLabel>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{slotType === 'hazard' && (
							<FormField
								control={control}
								name={`slots.${index}.successesToDisable` as const}
								render={({ field }) => (
									<FormItem className="space-y-1 w-[120px]">
										<FormLabel>Successes</FormLabel>
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
						)}

						{slotType === 'reinforcement' && (
							<FormField
								control={control}
								name={`slots.${index}.reinforcementRound` as const}
								render={({ field }) => (
									<FormItem className="space-y-1 w-[80px]">
										<FormLabel>Round</FormLabel>
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
						)}
					</>
				)}

				{/* Narrative fields */}
				{slotType === 'narrative' && (
					<FormField
						control={control}
						name={`slots.${index}.eventRound` as const}
						render={({ field }) => (
							<FormItem className="space-y-1 w-[80px]">
								<FormLabel>Round</FormLabel>
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

				{/* Aura fields */}
				{slotType === 'aura' && (
					<FormField
						control={control}
						name={`slots.${index}.auraCycle` as const}
						render={({ field }) => (
							<FormItem className="space-y-1 w-[100px]">
								<FormLabel>Cycle (rounds)</FormLabel>
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

				<div className="ml-auto self-end">
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={handleRemove}
					>
						Remove
					</Button>
				</div>
			</div>

			{/* Description (collapsed row) */}
			<FormField
				control={control}
				name={`slots.${index}.description` as const}
				render={({ field }) => (
					<FormItem className="space-y-1">
						<FormLabel>Description</FormLabel>
						<FormControl>
							<Input placeholder="Optional notes for this slot" {...field} />
						</FormControl>
						<FormMessage />
					</FormItem>
				)}
			/>
		</div>
	);
}
