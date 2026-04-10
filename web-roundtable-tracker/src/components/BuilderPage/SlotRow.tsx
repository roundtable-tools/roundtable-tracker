import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
	UseFieldArrayRemove,
	UseFieldArrayUpdate,
	UseFormReturn,
} from 'react-hook-form';
import {
	ShieldPlus,
	Skull,
	Sparkles,
	ScrollText,
	TriangleAlert,
	type LucideIcon,
} from 'lucide-react';
import type { BuilderFormValues } from './builderConvert';
import { defaultSlot } from './builderConvert';
import type { BuilderSlot, SlotType, SideType } from './builderXp';
import type { LevelAdjustment } from '@/models/utility/level/Level';

const SLOT_TYPES: { value: SlotType; label: string; Icon: LucideIcon }[] = [
	{ value: 'creature', label: 'Creature', Icon: Skull },
	{ value: 'hazard', label: 'Hazard', Icon: TriangleAlert },
	{ value: 'reinforcement', label: 'Reinforcement', Icon: ShieldPlus },
	{ value: 'narrative', label: 'Narrative Event', Icon: ScrollText },
	{ value: 'aura', label: 'Aura Event', Icon: Sparkles },
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
	const isCombatSlot =
		slotType === 'creature' || slotType === 'reinforcement' || slotType === 'hazard';

	const handleTypeChange = (newType: SlotType) => {
		// Enforce single reinforcement slot
		if (newType === 'reinforcement') {
			const allSlots = form.getValues('slots') || [];
			const hasExistingReinforcement = allSlots.some(
				(s: BuilderSlot, i: number) => i !== index && s.type === 'reinforcement'
			);

			if (hasExistingReinforcement) {
				return; // Prevent creating a second reinforcement slot
			}
		}

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
		<div className="border rounded-md p-3 space-y-3 bg-card">
			<div className="flex items-start gap-2">
				<div className="flex flex-wrap gap-2">
					{SLOT_TYPES.map(({ value, label, Icon }) => {
						const allSlots = form.getValues('slots') || [];
						const isReinforcementDisabled =
							value === 'reinforcement' &&
							allSlots.some(
								(s: BuilderSlot, i: number) =>
									i !== index && s.type === 'reinforcement'
							);

						return (
							<Toggle
								key={value}
								type="button"
								size="sm"
								variant="outline"
								pressed={slotType === value}
								onPressedChange={(pressed) => {
									if (pressed) {
										handleTypeChange(value);
									}
								}}
								aria-label={`Set slot type to ${label}`}
								disabled={isReinforcementDisabled}
								title={
									isReinforcementDisabled
										? 'Only one reinforcement slot allowed'
										: undefined
								}
								className="gap-1.5"
							>
								<Icon className="size-4" />
								<span className="hidden sm:inline">{label}</span>
							</Toggle>
						);
					})}
				</div>

				<div className="ml-auto">
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={handleRemove}
					>
						{isOnly ? 'Clear' : 'Remove'}
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">

				{/* Name */}
				<FormField
					control={control}
					name={`slots.${index}.name` as const}
					render={({ field }) => (
						<FormItem className="space-y-1 sm:col-span-2 lg:col-span-2">
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
				{isCombatSlot && (
					<>
						<FormField
							control={control}
							name={`slots.${index}.side` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
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
								<FormItem className="space-y-1">
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
								<FormItem className="space-y-1">
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
									<FormItem className="space-y-1">
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
									<FormItem className="space-y-1 sm:col-span-2 lg:col-span-2">
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
									<FormItem className="flex items-center gap-2 mt-5 space-y-0 sm:col-span-2">
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
									<FormItem className="space-y-1">
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
									<FormItem className="space-y-1">
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
							<FormItem className="space-y-1">
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
							<FormItem className="space-y-1">
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
