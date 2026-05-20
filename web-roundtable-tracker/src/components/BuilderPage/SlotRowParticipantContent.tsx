import { Skull, Trash2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toggle } from '@/components/ui/toggle';
import type { LevelAdjustment } from '@/models/utility/level/Level';
import { PartyLevelPicker } from './PartyLevelPicker';
import { PartySizePicker } from './PartySizePicker';
import { AdjustmentTab } from './SlotRowTabs/AdjustmentTab';
import { CombatReadyTab } from './SlotRowTabs/CombatReadyTab';
import { DcsTab } from './SlotRowTabs/DcsTab';
import { HpTab } from './SlotRowTabs/HpTab';
import { InitiativeTab } from './SlotRowTabs/InitiativeTab';
import { TraitsTab } from './SlotRowTabs/TraitsTab';
import type { BuilderFormValues } from './builderConvert';
import type {
	BuilderReinforcementParticipant,
	BuilderSlot,
	SideType,
	SlotType,
} from './builderXp';
import type { AdditionalDataBlockKey } from './SlotRow';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import {
	FACTION_ALIGNMENT,
	type EncounterFaction,
} from '@/models/encounters/factions';

function sideFromFactionAlignment(alignment: EncounterFaction['alignment']): SideType {
	if (alignment === FACTION_ALIGNMENT.Ally) {
		return 'ally';
	}

	if (alignment === FACTION_ALIGNMENT.Other) {
		return 'other';
	}

	return 'opponent';
}

const ADJUSTMENT_OPTIONS: { value: LevelAdjustment | 'none'; label: string }[] =
	[
		{ value: 'none', label: 'None' },
		{ value: 'weak', label: 'Weak' },
		{ value: 'elite', label: 'Elite' },
		{ value: 'elite-offense', label: 'Elite Offense' },
		{ value: 'elite-defense', label: 'Elite Defense' },
	];

interface SlotRowParticipantContentProps {
	index: number;
	form: UseFormReturn<BuilderFormValues>;
	slot: BuilderSlot;
	slotType: SlotType;
	isCombatSlot: boolean;
	isSimpleHazard: boolean;
	activeTab: string;
	visibleTabs: AdditionalDataBlockKey[];
	availableCombatTabs: AdditionalDataBlockKey[];
	missingSuggestedBlocks: AdditionalDataBlockKey[];
	reinforcementParticipants: BuilderReinforcementParticipant[];
	reinforcementActiveTabs: Record<string, string>;
	getReinforcementVisibleTabs: (
		participant: BuilderReinforcementParticipant
	) => AdditionalDataBlockKey[];
	getReinforcementSuggestedBlocks: (
		participant: BuilderReinforcementParticipant
	) => AdditionalDataBlockKey[];
	getReinforcementAvailableTabs: (
		participant: BuilderReinforcementParticipant
	) => AdditionalDataBlockKey[];
	onSetActiveTab: (tab: string) => void;
	onApplyAdditionalBlock: (block: AdditionalDataBlockKey) => void;
	onOpenAddParticipantDataDialog: () => void;
	onOpenAddReinforcementParticipantDataDialog: (participantId: string) => void;
	onAddReinforcementParticipant: () => void;
	onRemoveReinforcementParticipant: (participantIndex: number) => void;
	onSetReinforcementTab: (
		participant: BuilderReinforcementParticipant,
		tab: string
	) => void;
	onApplyReinforcementAdditionalBlock: (
		participantIndex: number,
		block: AdditionalDataBlockKey
	) => void;
	onRemoveReinforcementTab: (
		participantIndex: number,
		tab: AdditionalDataBlockKey
	) => void;
	onReinforcementParticipantChange: (
		participantIndex: number,
		changes: Partial<BuilderReinforcementParticipant>
	) => void;
	onRemoveDcsTab: () => void;
	onRemoveHpTab: () => void;
	onRemoveInitiativeTab: () => void;
	onRemoveAdjustmentTab: () => void;
	onRemoveTraitsTab: () => void;
	onRemoveCombatReadyTab: () => void;
}

export function SlotRowParticipantContent({
	index,
	form,
	slot,
	slotType,
	isCombatSlot,
	isSimpleHazard,
	activeTab,
	visibleTabs,
	availableCombatTabs,
	missingSuggestedBlocks,
	reinforcementParticipants,
	reinforcementActiveTabs,
	getReinforcementVisibleTabs,
	getReinforcementSuggestedBlocks,
	getReinforcementAvailableTabs,
	onSetActiveTab,
	onApplyAdditionalBlock,
	onOpenAddParticipantDataDialog,
	onOpenAddReinforcementParticipantDataDialog,
	onAddReinforcementParticipant,
	onRemoveReinforcementParticipant,
	onSetReinforcementTab,
	onApplyReinforcementAdditionalBlock,
	onRemoveReinforcementTab,
	onReinforcementParticipantChange,
	onRemoveDcsTab,
	onRemoveHpTab,
	onRemoveInitiativeTab,
	onRemoveAdjustmentTab,
	onRemoveTraitsTab,
	onRemoveCombatReadyTab,
}: SlotRowParticipantContentProps) {
	const { control, setValue } = form;
	const factions = useWatch({ control, name: 'factions' }) ?? [];

	return (
		<>
			<div className="space-y-3">
				{isCombatSlot && (
				<div className="grid grid-cols-[1fr_auto] gap-3 items-start">
					<div className="space-y-3">
						<FormField
							control={control}
							name={`slots.${index}.level` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>Level</FormLabel>
									<FormControl>
										<PartyLevelPicker
											value={field.value}
											onChange={field.onChange}
											onBlur={field.onBlur}
											name={field.name}
											ref={field.ref}
											min={-1}
											max={25}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
							<FormField
								control={control}
								name={`slots.${index}.factionId` as const}
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormLabel>Faction</FormLabel>
										<FormControl>
											<Select
												value={
													typeof field.value === 'string' ? field.value : ''
												}
												onValueChange={(value) => {
													const faction = factions.find((entry) => entry.id === value);

													field.onChange(value);
													if (faction) {
														setValue(
															`slots.${index}.side` as const,
															sideFromFactionAlignment(faction.alignment)
														);
													}
												}}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Choose faction" />
												</SelectTrigger>
												<SelectContent>
													{factions.map((faction) => (
														<SelectItem key={faction.id} value={faction.id}>
															{faction.name}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							{slotType === 'hazard' && (
								<>
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
									<FormField
										control={control}
										name={`slots.${index}.isSimpleHazard` as const}
										render={({ field }) => (
											<FormItem className="mt-5 flex items-center gap-2 space-y-0 sm:col-span-2">
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
								</>
							)}
						</div>
					</div>

					<FormField
						control={control}
						name={`slots.${index}.count` as const}
						render={({ field }) => (
							<FormItem className="space-y-1">
								<FormLabel className='-mb-5'>Count</FormLabel>
								<FormControl>
									<PartySizePicker
										value={field.value}
										onChange={(value) => {
											field.onChange(value == field.value ? 0 : value);
										}}
										onBlur={field.onBlur}
										name={field.name}
										ref={field.ref}
										min={1}
										max={12}
										rows={3}
										buttonSize="md"
										icon={slotType === 'hazard' ? TriangleAlert : Skull}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>
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
							onClick={onAddReinforcementParticipant}
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
						{reinforcementParticipants.map((participant, participantIndex) => {
							const participantVisibleTabs =
								getReinforcementVisibleTabs(participant);
							const participantSuggestedBlocks =
								getReinforcementSuggestedBlocks(participant);
							const participantAvailableTabs =
								getReinforcementAvailableTabs(participant);
							const participantActiveTab =
								reinforcementActiveTabs[participant.id];
							const resolvedParticipantActiveTab =
								participantActiveTab &&
								participantVisibleTabs.includes(
									participantActiveTab as AdditionalDataBlockKey
								)
									? participantActiveTab
									: (participantVisibleTabs[0] ?? '');

							return (
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
												onRemoveReinforcementParticipant(participantIndex)
											}
										>
											<Trash2 className="size-4" />
										</Button>
									</div>

									<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
										<div className="space-y-1">
											<FormLabel>Type</FormLabel>
											<Select
												value={participant.type}
												onValueChange={(value) =>
													onReinforcementParticipantChange(participantIndex, {
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
												value={participant.name}
												onChange={(event) =>
													onReinforcementParticipantChange(participantIndex, {
														name: event.target.value,
													})
												}
												placeholder="Goblin Reinforcement"
											/>
										</div>

										<div className="space-y-1">
											<FormLabel>Faction</FormLabel>
											<Select
												value={participant.factionId ?? ''}
												onValueChange={(value) =>
													{
													const faction = factions.find((entry) => entry.id === value);
													const side = faction
														? sideFromFactionAlignment(faction.alignment)
														: participant.side;

													onReinforcementParticipantChange(participantIndex, {
														factionId: value,
														side,
													})
													}
												}
											>
												<SelectTrigger className="w-full">
													<SelectValue placeholder="Choose faction" />
												</SelectTrigger>
												<SelectContent>
													{factions.map((faction) => (
														<SelectItem key={faction.id} value={faction.id}>
															{faction.name}
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
												value={participant.level ?? ''}
												onChange={(event) =>
													onReinforcementParticipantChange(participantIndex, {
														level: Number(event.target.value || 0),
													})
												}
											/>
										</div>

										<div className="space-y-1">
											<FormLabel>Count</FormLabel>
											<Input
												type="number"
												min={0}
												value={participant.count ?? ''}
												onChange={(event) =>
													onReinforcementParticipantChange(participantIndex, {
														count: Number(event.target.value || 0),
													})
												}
											/>
										</div>

										{participant.type === 'hazard' ? (
											<>
												<div className="space-y-1">
													<FormLabel>Successes</FormLabel>
													<Input
														type="number"
														min={1}
														value={participant.successesToDisable ?? ''}
														onChange={(event) =>
															onReinforcementParticipantChange(
																participantIndex,
																{
																	successesToDisable: Number(
																		event.target.value || 1
																	),
																}
															)
														}
													/>
												</div>
												<label className="mt-6 flex items-center gap-2 text-sm">
													<input
														type="checkbox"
														checked={participant.isSimpleHazard}
														onChange={(event) =>
															onReinforcementParticipantChange(
																participantIndex,
																{
																	isSimpleHazard: event.target.checked,
																}
															)
														}
													/>
													Simple Hazard
												</label>
											</>
										) : null}
									</div>

									<Tabs
										value={resolvedParticipantActiveTab}
										onValueChange={(tab) =>
											onSetReinforcementTab(participant, tab)
										}
										className="w-full"
									>
										<TabsList className="flex flex-wrap w-full gap-2 h-auto p-1 bg-muted justify-start items-center">
											{participantVisibleTabs.map((tab) => (
												<TabsTrigger
													key={`${participant.id}-${tab}`}
													value={tab}
													className="border border-solid data-[state=active]:border-foreground"
												>
													{tab === 'dcs' && 'DCs'}
													{tab === 'hp' && 'HP/Hardness'}
													{tab === 'initiative' && 'Initiative'}
													{tab === 'adjustment' && 'Adjustment'}
													{tab === 'traits' && 'Traits'}
													{tab === 'combat-ready' && 'Combat Ready'}
												</TabsTrigger>
											))}
											{participantSuggestedBlocks.map((block) => {
												const blockLabel =
													block === 'dcs'
														? 'DC List'
														: block === 'hp'
															? 'HP / Hardness'
															: block === 'initiative'
																? 'Initiative Bonus'
																: block === 'adjustment'
																	? 'Adjustment'
																	: block === 'traits'
																		? 'Traits'
																		: 'Combat Ready State';

												return (
													<Button
														key={`suggest-${participant.id}-${block}`}
														type="button"
														variant="outline"
														size="sm"
														className={[
															'border border-dashed h-8 bg-gray-200/50',
															participantAvailableTabs.length ===
															participantVisibleTabs.length
																? 'opacity-50 cursor-not-allowed'
																: 'hover:bg-gray-200',
														].join(' ')}
														onClick={() =>
															onApplyReinforcementAdditionalBlock(
																participantIndex,
																block
															)
														}
													>
														+ {blockLabel}
													</Button>
												);
											})}
											<Button
												type="button"
												size="sm"
												className={[
													'border border-dashed h-8 bg-gray-200/50',
													participantAvailableTabs.length ===
													participantVisibleTabs.length
														? 'opacity-50 cursor-not-allowed'
														: 'hover:bg-gray-200',
												].join(' ')}
												onClick={() =>
													onOpenAddReinforcementParticipantDataDialog(
														participant.id
													)
												}
												disabled={
													participantAvailableTabs.length ===
													participantVisibleTabs.length
												}
											>
												+ More
											</Button>
										</TabsList>

										<Card className="p-2">
											{participantVisibleTabs.includes('dcs') &&
												resolvedParticipantActiveTab === 'dcs' && (
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium">DCs</p>
															<div className="flex gap-2">
																<Button
																	type="button"
																	variant="outline"
																	size="sm"
																	onClick={() => {
																		const nextDcs = [
																			...(participant.dcs ?? []),
																			{ name: '', value: 10 },
																		];
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				dcs: nextDcs,
																			}
																		);
																	}}
																>
																	Add DC
																</Button>
																<Button
																	type="button"
																	variant="destructive"
																	size="sm"
																	onClick={() =>
																		onRemoveReinforcementTab(
																			participantIndex,
																			'dcs'
																		)
																	}
																>
																	<Trash2 className="h-4 w-4" />
																</Button>
															</div>
														</div>
														{(participant.dcs ?? []).map((dc, dcIndex) => (
															<div
																key={`r-dc-${participant.id}-${dcIndex}`}
																className="grid grid-cols-1 gap-2 rounded-md border p-2 sm:grid-cols-2 lg:grid-cols-5"
															>
																<Input
																	placeholder="Name"
																	value={dc.name ?? dc.inline ?? ''}
																	onChange={(event) => {
																		const nextDcs = [
																			...(participant.dcs ?? []),
																		];
																		nextDcs[dcIndex] = {
																			...nextDcs[dcIndex],
																			name: event.target.value,
																		};
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				dcs: nextDcs,
																			}
																		);
																	}}
																/>
																<Input
																	type="number"
																	placeholder="Value"
																	value={dc.value ?? ''}
																	onChange={(event) => {
																		const nextDcs = [
																			...(participant.dcs ?? []),
																		];
																		nextDcs[dcIndex] = {
																			...nextDcs[dcIndex],
																			value: Number(event.target.value || 0),
																		};
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				dcs: nextDcs,
																			}
																		);
																	}}
																/>
																<Input
																	placeholder="Icon key"
																	value={dc.icon ?? ''}
																	onChange={(event) => {
																		const nextDcs = [
																			...(participant.dcs ?? []),
																		];
																		nextDcs[dcIndex] = {
																			...nextDcs[dcIndex],
																			icon: event.target.value || undefined,
																		};
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				dcs: nextDcs,
																			}
																		);
																	}}
																/>
																{participant.type === 'hazard' ? (
																	<Input
																		type="number"
																		min={1}
																		placeholder="Disable Successes"
																		value={dc.disableSuccesses ?? ''}
																		onChange={(event) => {
																			const nextDcs = [
																				...(participant.dcs ?? []),
																			];
																			nextDcs[dcIndex] = {
																				...nextDcs[dcIndex],
																				disableSuccesses:
																					event.target.value === ''
																						? undefined
																						: Number(event.target.value),
																			};
																			onReinforcementParticipantChange(
																				participantIndex,
																				{
																					dcs: nextDcs,
																				}
																			);
																		}}
																	/>
																) : (
																	<div />
																)}
																<Button
																	type="button"
																	variant="ghost"
																	size="sm"
																	onClick={() => {
																		const nextDcs = (
																			participant.dcs ?? []
																		).filter((_, idx) => idx !== dcIndex);
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				dcs: nextDcs,
																			}
																		);
																	}}
																>
																	Remove
																</Button>
															</div>
														))}
													</div>
												)}
											{participantVisibleTabs.includes('initiative') &&
												resolvedParticipantActiveTab === 'initiative' && (
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium">Initiative</p>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	onRemoveReinforcementTab(
																		participantIndex,
																		'initiative'
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
														<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
															<Input
																type="number"
																placeholder="Initiative bonus"
																value={participant.initiativeBonus ?? ''}
																onChange={(event) => {
																	const value = event.target.value;
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			initiativeBonus:
																				value === ''
																					? undefined
																					: Number(value),
																		}
																	);
																}}
															/>
															<Input
																placeholder="Initiative description"
																value={participant.initiativeDescription ?? ''}
																onChange={(event) =>
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			initiativeDescription: event.target.value,
																		}
																	)
																}
															/>
														</div>
													</div>
												)}
											{participantVisibleTabs.includes('hp') &&
												resolvedParticipantActiveTab === 'hp' && (
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium">
																HP / Hardness
															</p>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	onRemoveReinforcementTab(
																		participantIndex,
																		'hp'
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
														<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
															<Input
																type="number"
																min={1}
																placeholder="HP override"
																value={participant.maxHealth ?? ''}
																onChange={(event) => {
																	const value = event.target.value;
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			maxHealth:
																				value === ''
																					? undefined
																					: Number(value),
																		}
																	);
																}}
															/>
															{participant.type === 'hazard' ? (
																<Input
																	type="number"
																	min={0}
																	placeholder="Hardness"
																	value={participant.hardness ?? ''}
																	onChange={(event) => {
																		const value = event.target.value;
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				hardness:
																					value === ''
																						? undefined
																						: Number(value),
																			}
																		);
																	}}
																/>
															) : null}
														</div>
													</div>
												)}
											{participant.type === 'creature' &&
												participantVisibleTabs.includes('adjustment') &&
												resolvedParticipantActiveTab === 'adjustment' && (
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium">Adjustment</p>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	onRemoveReinforcementTab(
																		participantIndex,
																		'adjustment'
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
														<div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
															<Select
																value={participant.adjustment}
																onValueChange={(value) =>
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			adjustment: value as
																				| LevelAdjustment
																				| 'none',
																		}
																	)
																}
															>
																<SelectTrigger className="w-full">
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	{ADJUSTMENT_OPTIONS.map((option) => (
																		<SelectItem
																			key={option.value}
																			value={option.value}
																		>
																			{option.label}
																		</SelectItem>
																	))}
																</SelectContent>
															</Select>
															<Input
																placeholder="Custom adjustment description"
																value={participant.adjustmentDescription ?? ''}
																onChange={(event) =>
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			adjustmentDescription: event.target.value,
																		}
																	)
																}
															/>
															<Input
																type="number"
																step="0.1"
																placeholder="Custom level modifier"
																value={
																	participant.adjustmentLevelModifier ?? ''
																}
																onChange={(event) => {
																	const value = event.target.value;
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			adjustmentLevelModifier:
																				value === ''
																					? undefined
																					: Number(value),
																		}
																	);
																}}
															/>
														</div>
													</div>
												)}
											{participantVisibleTabs.includes('traits') &&
												resolvedParticipantActiveTab === 'traits' && (
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium">Traits</p>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	onRemoveReinforcementTab(
																		participantIndex,
																		'traits'
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
														<div className="flex gap-2">
															<Input
																placeholder="Add trait..."
																onKeyDown={(event) => {
																	if (
																		event.key === 'Enter' &&
																		event.currentTarget.value.trim()
																	) {
																		const nextTraits = [
																			...(participant.traits ?? []),
																			event.currentTarget.value.trim(),
																		];
																		onReinforcementParticipantChange(
																			participantIndex,
																			{
																				traits: nextTraits,
																			}
																		);
																		event.currentTarget.value = '';
																	}
																}}
															/>
														</div>
														<div className="flex flex-wrap gap-2">
															{(participant.traits ?? []).map(
																(trait, traitIndex) => (
																	<span
																		key={`r-trait-${participant.id}-${traitIndex}`}
																		className="rounded border px-2 py-1 text-xs cursor-pointer"
																		onClick={() => {
																			const nextTraits = (
																				participant.traits ?? []
																			).filter((_, idx) => idx !== traitIndex);
																			onReinforcementParticipantChange(
																				participantIndex,
																				{
																					traits: nextTraits,
																				}
																			);
																		}}
																	>
																		{trait} x
																	</span>
																)
															)}
														</div>
													</div>
												)}
											{participantVisibleTabs.includes('combat-ready') &&
												resolvedParticipantActiveTab === 'combat-ready' && (
													<div className="space-y-2">
														<div className="flex items-center justify-between gap-2">
															<p className="text-sm font-medium">
																Combat Ready
															</p>
															<Button
																type="button"
																variant="destructive"
																size="sm"
																onClick={() =>
																	onRemoveReinforcementTab(
																		participantIndex,
																		'combat-ready'
																	)
																}
															>
																<Trash2 className="h-4 w-4" />
															</Button>
														</div>
														<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
															<Select
																value={participant.combatReadyState ?? 'active'}
																onValueChange={(value) =>
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			combatReadyState:
																				value as BuilderReinforcementParticipant['combatReadyState'],
																		}
																	)
																}
															>
																<SelectTrigger>
																	<SelectValue />
																</SelectTrigger>
																<SelectContent>
																	<SelectItem value="active">Active</SelectItem>
																	<SelectItem value="delayed">
																		Delayed
																	</SelectItem>
																	<SelectItem value="knocked-out">
																		Defeated
																	</SelectItem>
																</SelectContent>
															</Select>
															<Toggle
																pressed={participant.hiddenFromPlayers ?? false}
																onPressedChange={(pressed) =>
																	onReinforcementParticipantChange(
																		participantIndex,
																		{
																			hiddenFromPlayers: pressed,
																		}
																	)
																}
																className="w-fit"
															>
																{participant.hiddenFromPlayers
																	? 'Hidden'
																	: 'Visible'}
															</Toggle>
														</div>
													</div>
												)}
										</Card>
									</Tabs>
								</div>
							);
						})}
					</div>
				</section>
			)}

			<div className="space-y-4">
				{isCombatSlot && (
					<Tabs
						value={activeTab}
						onValueChange={onSetActiveTab}
						className="w-full"
					>
						<TabsList className="flex flex-wrap w-full gap-2 h-auto p-1 bg-muted justify-start items-center">
							{visibleTabs.map((tab) => (
								<TabsTrigger
									key={tab}
									value={tab}
									className="border border-solid data-[state=active]:border-foreground"
								>
									{tab === 'dcs' && 'DCs'}
									{tab === 'hp' && 'HP/Hardness'}
									{tab === 'initiative' && 'Initiative'}
									{tab === 'adjustment' && 'Adjustment'}
									{tab === 'traits' && 'Traits'}
									{tab === 'combat-ready' && 'Combat Ready'}
								</TabsTrigger>
							))}

							{missingSuggestedBlocks.map((block) => {
								const blockLabel =
									block === 'dcs'
										? 'DC List'
										: block === 'hp'
											? 'HP / Hardness'
											: block === 'initiative'
												? 'Initiative Bonus'
												: block === 'adjustment'
													? 'Adjustment'
													: block === 'traits'
														? 'Traits'
														: 'Combat Ready State';

								return (
									<Button
										key={`suggest-${block}`}
										type="button"
										variant="outline"
										size="sm"
										className={[
											'border border-dashed h-8 bg-gray-200/50',
											availableCombatTabs.length === visibleTabs.length
												? 'opacity-50 cursor-not-allowed'
												: 'hover:bg-gray-200',
										].join(' ')}
										onClick={() => onApplyAdditionalBlock(block)}
									>
										+ {blockLabel}
									</Button>
								);
							})}

							<Button
								type="button"
								size="sm"
								className={[
									'border border-dashed h-8 bg-gray-200/50',
									availableCombatTabs.length === visibleTabs.length
										? 'opacity-50 cursor-not-allowed'
										: 'hover:bg-gray-200',
								].join(' ')}
								onClick={onOpenAddParticipantDataDialog}
								disabled={availableCombatTabs.length === visibleTabs.length}
							>
								+ More
							</Button>
						</TabsList>
						<Card className="p-2">
							{visibleTabs.includes('dcs') && (
								<DcsTab
									index={index}
									slot={slot}
									slotType={slotType}
									setValue={setValue}
									onRemove={onRemoveDcsTab}
								/>
							)}

							{visibleTabs.includes('hp') && (
								<HpTab
									index={index}
									slot={slot}
									slotType={slotType}
									control={control}
									onRemove={onRemoveHpTab}
								/>
							)}

							{visibleTabs.includes('initiative') && !isSimpleHazard && (
								<InitiativeTab
									index={index}
									slot={slot}
									control={control}
									onRemove={onRemoveInitiativeTab}
								/>
							)}

							{slotType === 'creature' &&
								visibleTabs.includes('adjustment') && (
									<AdjustmentTab
										index={index}
										slot={slot}
										setValue={setValue}
										control={control}
										onRemove={onRemoveAdjustmentTab}
									/>
								)}

							{visibleTabs.includes('traits') && (
								<TraitsTab
									index={index}
									slot={slot}
									setValue={setValue}
									onRemove={onRemoveTraitsTab}
								/>
							)}

							{visibleTabs.includes('combat-ready') && (
								<CombatReadyTab
									index={index}
									slot={slot}
									control={control}
									onRemove={onRemoveCombatReadyTab}
								/>
							)}
						</Card>
					</Tabs>
				)}
			</div>
		</>
	);
}
