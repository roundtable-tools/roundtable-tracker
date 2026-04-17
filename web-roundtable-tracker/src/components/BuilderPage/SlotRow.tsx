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
	Trash2,
	ScrollText,
	TriangleAlert,
	type LucideIcon,
} from 'lucide-react';
import type { BuilderFormValues } from './builderConvert';
import { defaultSlot } from './builderConvert';
import type {
	BuilderReinforcementParticipant,
	BuilderSlot,
	SlotType,
	SideType,
} from './builderXp';
import { normalizeSideType } from './builderXp';
import type { LevelAdjustment } from '@/models/utility/level/Level';
import type { AccomplishmentLevel } from '@/models/encounters/encounter.types';
import { v4 as uuidv4 } from 'uuid';

const SLOT_TYPES: { value: SlotType; label: string; Icon: LucideIcon }[] = [
	{ value: 'creature', label: 'Creature', Icon: Skull },
	{ value: 'hazard', label: 'Hazard', Icon: TriangleAlert },
	{ value: 'reinforcement', label: 'Reinforcement', Icon: ShieldPlus },
	{ value: 'narrative', label: 'Narrative Event', Icon: ScrollText },
];

export const PARTICIPANT_SLOT_TYPES: SlotType[] = [
	'creature',
	'hazard',
];

export const EVENT_SLOT_TYPES: SlotType[] = ['narrative', 'reinforcement'];

const SIDE_OPTIONS: { value: SideType; label: string }[] = [
	{ value: 'opponent', label: 'Opponents' },
	{ value: 'ally', label: 'Allies' },
	{ value: 'other', label: 'Other' },
];

const ADJUSTMENT_OPTIONS: { value: LevelAdjustment | 'none'; label: string }[] = [
	{ value: 'none', label: 'None' },
	{ value: 'weak', label: 'Weak' },
	{ value: 'elite', label: 'Elite' },
	{ value: 'elite-offense', label: 'Elite Offense' },
	{ value: 'elite-defense', label: 'Elite Defense' },
];

const ACCOMPLISHMENT_OPTIONS: {
	value: AccomplishmentLevel;
	label: string;
}[] = [
	{ value: 'story', label: 'Story (0 XP)' },
	{ value: 'minor', label: 'Minor (10 XP)' },
	{ value: 'moderate', label: 'Moderate (30 XP)' },
	{ value: 'major', label: 'Major (80 XP)' },
];

interface SlotRowProps {
	index: number;
	form: UseFormReturn<BuilderFormValues>;
	remove: UseFieldArrayRemove;
	update: UseFieldArrayUpdate<BuilderFormValues, 'slots'>;
	allowedTypes: SlotType[];
}

export function SlotRow({ index, form, remove, update, allowedTypes }: SlotRowProps) {
	const { control, watch, setValue } = form;
	const slot = watch(`slots.${index}`) as BuilderSlot;
	const slotType = slot.type;
	const isCombatSlot = slotType === 'creature' || slotType === 'hazard';
	const availableSlotTypes = SLOT_TYPES.filter(({ value }) =>
		allowedTypes.includes(value)
	);
	const reinforcementParticipants = slot.reinforcementParticipants ?? [];

	const createDefaultReinforcementParticipant = (): BuilderReinforcementParticipant => ({
		id: uuidv4(),
		type: 'creature',
		name: '',
		side: 'opponent',
		level: 1,
		count: 1,
		maxHealth: undefined,
		successesToDisable: 1,
		adjustment: 'none',
		isSimpleHazard: false,
	});

	const handleTypeChange = (newType: SlotType) => {
		const current = form.getValues(`slots.${index}`);
		const reset = defaultSlot();

		update(index, { ...reset, id: current.id, type: newType });
	};

	const handleRemove = () => {
		remove(index);
	};

	const handleAddReinforcementParticipant = () => {
		setValue(
			`slots.${index}.reinforcementParticipants`,
			[...reinforcementParticipants, createDefaultReinforcementParticipant()],
			{ shouldDirty: true, shouldTouch: true }
		);
	};

	const handleRemoveReinforcementParticipant = (participantIndex: number) => {
		setValue(
			`slots.${index}.reinforcementParticipants`,
			reinforcementParticipants.filter((_, idx) => idx !== participantIndex),
			{ shouldDirty: true, shouldTouch: true }
		);
	};

	const handleReinforcementParticipantChange = (
		participantIndex: number,
		changes: Partial<BuilderReinforcementParticipant>
	) => {
		const next = [...reinforcementParticipants];
		const current = next[participantIndex];

		if (!current) {
			return;
		}

		const updatedParticipant: BuilderReinforcementParticipant = {
			...current,
			...changes,
		};

		if (changes.type === 'hazard') {
			updatedParticipant.adjustment = 'none';
			updatedParticipant.successesToDisable =
				current.successesToDisable && current.successesToDisable > 0
					? current.successesToDisable
					: 1;
		}

		if (changes.type === 'creature') {
			updatedParticipant.isSimpleHazard = false;
			updatedParticipant.successesToDisable = 1;
		}

		next[participantIndex] = updatedParticipant;

		setValue(`slots.${index}.reinforcementParticipants`, next, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	return (
		<div className="border rounded-md p-3 space-y-3 bg-card">
			<div className="flex items-start gap-2">
				<div className="flex flex-wrap gap-2">
					{availableSlotTypes.map(({ value, label, Icon }) => {
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
						Remove
					</Button>
				</div>
			</div>

			<div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
				Optional parameters are collapsed by default. Expand below when you need overrides.
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

				{/* Creature & Hazard fields */}
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
											value={normalizeSideType(field.value as SideType)}
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

						{slotType === 'creature' && (
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

					</>
				)}

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

				{/* Narrative fields */}
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
					</>
				)}

				{slotType === 'narrative' && (
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
				)}
			</div>

			{slotType === 'reinforcement' && (
				<section className="space-y-3 rounded-md border p-3">
					<div className="flex items-center justify-between gap-2">
						<h4 className="text-sm font-medium">Reinforcement Participants</h4>
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={handleAddReinforcementParticipant}
						>
							Add Reinforcement Participant
						</Button>
					</div>

					{reinforcementParticipants.length === 0 ? (
						<div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
							No reinforcement participants added yet.
						</div>
					) : null}

					<div className="space-y-3">
						{reinforcementParticipants.map((participant, participantIndex) => (
							<div
								key={participant.id}
								className="space-y-3 rounded-md border bg-muted/10 p-3"
							>
								<div className="flex items-center justify-between gap-2">
									<p className="text-sm font-medium">
										Participant {participantIndex + 1}
									</p>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() =>
											handleRemoveReinforcementParticipant(participantIndex)
										}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>

								<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
									<div className="space-y-1">
										<FormLabel>Type</FormLabel>
										<Select
											value={participant.type}
											onValueChange={(value) =>
												handleReinforcementParticipantChange(participantIndex, {
													type: value as 'creature' | 'hazard',
												})
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="creature">Creature</SelectItem>
												<SelectItem value="hazard">Hazard</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-1 lg:col-span-2">
										<FormLabel>Name</FormLabel>
										<Input
											defaultValue={participant.name}
											onBlur={(event) =>
												handleReinforcementParticipantChange(participantIndex, {
													name: event.target.value,
												})
											}
											placeholder="Goblin Reinforcement"
										/>
									</div>

									<div className="space-y-1">
										<FormLabel>Side</FormLabel>
										<Select
											value={normalizeSideType(participant.side)}
											onValueChange={(value) =>
												handleReinforcementParticipantChange(participantIndex, {
													side: value as SideType,
												})
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{SIDE_OPTIONS.map((option) => (
													<SelectItem key={option.value} value={option.value}>
														{option.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>

									<div className="space-y-1">
										<FormLabel>Level</FormLabel>
										<Input
											type="number"
											min={-1}
											defaultValue={participant.level}
											onBlur={(event) =>
												handleReinforcementParticipantChange(participantIndex, {
													level: Number(event.target.value || participant.level),
												})
											}
										/>
									</div>

									<div className="space-y-1">
										<FormLabel>Count</FormLabel>
										<Input
											type="number"
											min={0}
											defaultValue={participant.count}
											onBlur={(event) =>
												handleReinforcementParticipantChange(participantIndex, {
													count: Number(event.target.value || participant.count),
												})
											}
										/>
									</div>

									{participant.type === 'creature' ? (
										<div className="space-y-1">
											<FormLabel>Adjustment</FormLabel>
											<Select
												value={participant.adjustment}
												onValueChange={(value) =>
													handleReinforcementParticipantChange(participantIndex, {
														adjustment: value as LevelAdjustment | 'none',
													})
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{ADJUSTMENT_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									) : null}

									{participant.type === 'hazard' ? (
										<>
											<div className="space-y-1">
												<FormLabel>Successes</FormLabel>
												<Input
													type="number"
													min={1}
													defaultValue={participant.successesToDisable}
													onBlur={(event) =>
														handleReinforcementParticipantChange(participantIndex, {
															successesToDisable: Number(
																event.target.value || participant.successesToDisable
															),
														})
													}
												/>
											</div>
											<label className="mt-6 flex items-center gap-2 text-sm">
												<input
													type="checkbox"
													checked={participant.isSimpleHazard}
													onChange={(event) =>
														handleReinforcementParticipantChange(participantIndex, {
															isSimpleHazard: event.target.checked,
														})
													}
												/>
												Simple Hazard
											</label>
										</>
									) : null}
								</div>
							</div>
						))}
					</div>
				</section>
			)}

			<details className="rounded-md border p-3">
				<summary className="cursor-pointer text-sm font-medium">
					Optional Parameters
				</summary>
				<div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
					{(slotType === 'creature' || slotType === 'hazard') && (
						<FormField
							control={control}
							name={`slots.${index}.maxHealth` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>Max HP Override</FormLabel>
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

					<FormField
						control={control}
						name={`slots.${index}.description` as const}
						render={({ field }) => (
							<FormItem className="space-y-1 sm:col-span-2 lg:col-span-3">
								<FormLabel>Slot Notes</FormLabel>
								<FormControl>
									<Input placeholder="Optional notes for this slot" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
			</details>
		</div>
	);
}
