import { Button } from '@/components/ui/button';
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
import { Toggle } from '@/components/ui/toggle';
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
	CHALLENGE_POINT_TIER_STARTS,
	challengePointTierLabel,
	normalizePartySetup,
} from '@/models/utility/challengePoints/challengePoints';
import {
	FACTION_ALIGNMENT,
	ensureEncounterFactions,
	type EncounterFaction,
} from '@/models/encounters/factions';
import type { Party } from '@/store/savedParties';
import { NoteListSection } from '../sections/NoteListSection';
import { ParagraphFields } from '../ParagraphFields';
import { PartyLevelPicker } from '../PartyLevelPicker';
import { PartySizePicker } from '../PartySizePicker';
import type { BuilderListLayoutKey } from '../BuilderListLayout';
import type { BuilderFormValues } from '../builderConvert';
import { v4 as uuidv4 } from 'uuid';
import {
	Flag,
	Shield,
	Sparkles,
	Skull,
	Swords,
	Trees,
	Trash2,
	type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { factionAlignmentToAlignment } from '@/store/data';
import type {
	FieldArrayWithId,
	UseFieldArrayAppend,
	UseFieldArrayRemove,
	UseFormReturn,
} from 'react-hook-form';
import { useWatch } from 'react-hook-form';

const FACTION_ALIGNMENT_OPTIONS = [
	{ value: FACTION_ALIGNMENT.Opponent, label: 'Opponent' },
	{ value: FACTION_ALIGNMENT.Ally, label: 'Ally' },
	{ value: FACTION_ALIGNMENT.Other, label: 'Other' },
] as const;

const FACTION_ICON_OPTIONS: Array<{
	value: EncounterFaction['icon'];
	label: string;
	Icon: LucideIcon;
}> = [
	{ value: 'swords', label: 'Swords', Icon: Swords },
	{ value: 'shield', label: 'Shield', Icon: Shield },
	{ value: 'flag', label: 'Flag', Icon: Flag },
	{ value: 'skull', label: 'Skull', Icon: Skull },
	{ value: 'trees', label: 'Trees', Icon: Trees },
	{ value: 'sparkles', label: 'Sparkles', Icon: Sparkles },
];

const FACTION_COLOR_OPTIONS: Array<{
	value: EncounterFaction['color'];
	label: string;
	swatchClassName: string;
}> = [
	{ value: 'crimson', label: 'Crimson', swatchClassName: 'bg-rose-700' },
	{ value: 'amber', label: 'Amber', swatchClassName: 'bg-amber-600' },
	{ value: 'emerald', label: 'Emerald', swatchClassName: 'bg-emerald-600' },
	{ value: 'sky', label: 'Sky', swatchClassName: 'bg-sky-600' },
	{ value: 'indigo', label: 'Indigo', swatchClassName: 'bg-indigo-600' },
	{ value: 'slate', label: 'Slate', swatchClassName: 'bg-slate-600' },
];

function sideFromAlignment(alignment: EncounterFaction['alignment']) {
	if (alignment === FACTION_ALIGNMENT.Ally) {
		return 'ally' as const;
	}

	if (alignment === FACTION_ALIGNMENT.Other) {
		return 'other' as const;
	}

	return 'opponent' as const;
}

interface BuilderDetailsStepProps {
	form: UseFormReturn<BuilderFormValues>;
	partySetupMode: BuilderFormValues['partySetupMode'];
	specificPartyId?: string;
	specificPartyLevels: number[];
	challengePointTierStart: number;
	challengePointBudget: number;
	savedParties: Party[];
	selectedSavedParty?: Party;
	resolvedSpecificPartyLevels: number[];
	normalizedPartySetup: ReturnType<typeof normalizePartySetup>;
	safePartyLevel: number;
	safePartySize: number;
	noteFields: FieldArrayWithId<BuilderFormValues, 'notes', 'id'>[];
	notes: BuilderFormValues['notes'];
	appendNote: UseFieldArrayAppend<BuilderFormValues, 'notes'>;
	removeNote: UseFieldArrayRemove;
	activeNotesTab: string;
	onActiveNotesTabChange: (id: string) => void;
	layoutKey?: BuilderListLayoutKey;
	onLayoutKeyChange: (key: BuilderListLayoutKey) => void;
}

export function BuilderDetailsStep({
	form,
	partySetupMode,
	specificPartyId,
	specificPartyLevels,
	challengePointTierStart,
	challengePointBudget,
	savedParties,
	selectedSavedParty,
	resolvedSpecificPartyLevels,
	normalizedPartySetup,
	safePartyLevel,
	safePartySize,
	noteFields,
	notes,
	appendNote,
	removeNote,
	activeNotesTab,
	onActiveNotesTabChange,
	layoutKey,
	onLayoutKeyChange,
}: BuilderDetailsStepProps) {
	const factions = useWatch({ control: form.control, name: 'factions' }) ?? [];
	const editableFactions = factions.filter((faction) => !faction.isBuiltIn);

	const updateFaction = (
		factionId: string,
		updater: (current: EncounterFaction) => EncounterFaction
	) => {
		form.setValue(
			'factions',
			factions.map((faction) =>
				faction.id === factionId ? updater(faction) : faction
			),
			{ shouldDirty: true, shouldTouch: true }
		);
	};

	const addFaction = () => {
		const nextFactions = ensureEncounterFactions([
			...factions,
			{
				id: uuidv4(),
				name: `Faction ${editableFactions.length + 1}`,
				alignment: FACTION_ALIGNMENT.Opponent,
				icon: 'flag',
				color: 'amber',
				isBuiltIn: false,
			},
		]);

		form.setValue('factions', nextFactions, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const removeFaction = (factionId: string) => {
		const removedFaction = factions.find((faction) => faction.id === factionId);

		if (!removedFaction || removedFaction.isBuiltIn) {
			return;
		}

		const nextFactions = ensureEncounterFactions(
			factions.filter((faction) => faction.id !== factionId)
		);
		const fallbackFaction = nextFactions.find(
			(faction) => faction.alignment === removedFaction.alignment
		);

		form.setValue('factions', nextFactions, {
			shouldDirty: true,
			shouldTouch: true,
		});

		if (!fallbackFaction) {
			return;
		}

		const fallbackSide = sideFromAlignment(fallbackFaction.alignment);
		const fallbackVisibility = factionAlignmentToAlignment(
			fallbackFaction.alignment
		);
		const currentSlots = form.getValues('slots');
		const currentNotes = form.getValues('notes');

		form.setValue(
			'slots',
			currentSlots.map((slot) => ({
				...slot,
				factionId:
					slot.factionId === factionId ? fallbackFaction.id : slot.factionId,
				side: slot.factionId === factionId ? fallbackSide : slot.side,
				reinforcementParticipants: slot.reinforcementParticipants?.map(
					(participant) => ({
						...participant,
						factionId:
							participant.factionId === factionId
								? fallbackFaction.id
								: participant.factionId,
						side:
							participant.factionId === factionId
								? fallbackSide
								: participant.side,
					})
				),
			})),
			{ shouldDirty: true, shouldTouch: true }
		);

		form.setValue(
			'notes',
			currentNotes.map((note) => ({
				...note,
				factionId:
					note.factionId === factionId ? fallbackFaction.id : note.factionId,
				visibility:
					note.factionId === factionId ? fallbackVisibility : note.visibility,
			})),
			{ shouldDirty: true, shouldTouch: true }
		);
	};

	return (
		<TabsContent value="details" className="space-y-3">
			<section className="space-y-3">
				<div className="space-y-2">
					<ParagraphFields
						control={form.control}
						label="Encounter Name and Description"
						fieldNames={['name', 'description']}
						placeholders={['Training Grounds', 'Brief setup description...']}
					/>
					<div
						className={cn(
							'rounded-md border p-3',
							partySetupMode === 'simple'
								? 'grid grid-cols-[1fr_auto] gap-3 items-start'
								: 'space-y-3'
						)}
					>
						<div className="space-y-3">
							<div className="space-y-2">
								<FormLabel>Party Setup</FormLabel>
								<div className="flex flex-wrap gap-2">
									{[
										{ key: 'simple', label: 'Simple' },
										{ key: 'specific', label: 'Specific' },
										{ key: 'challenge-points', label: 'Challenge Points' },
									].map((mode) => (
										<Button
											key={mode.key}
											type="button"
											variant={
												partySetupMode === mode.key ? 'default' : 'outline'
											}
											onClick={() =>
												form.setValue(
													'partySetupMode',
													mode.key as BuilderFormValues['partySetupMode']
												)
											}
										>
											{mode.label}
										</Button>
									))}
								</div>
							</div>

							{partySetupMode === 'simple' ? (
								<FormField
									control={form.control}
									name="partyLevel"
									render={({ field }) => (
										<FormItem className="space-y-1">
											<FormLabel>Party Level</FormLabel>
											<FormControl>
												<PartyLevelPicker
													value={field.value}
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
							) : null}

							{partySetupMode === 'specific' ? (
								<div className="space-y-3">
									<div className="space-y-1">
										<FormLabel>Saved Party</FormLabel>
										<Select
											value={specificPartyId || 'custom'}
											onValueChange={(value) =>
												form.setValue(
													'specificPartyId',
													value === 'custom' ? undefined : value
												)
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue placeholder="Use custom level list" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="custom">
													Custom level list
												</SelectItem>
												{savedParties.map((party) => (
													<SelectItem key={party.id} value={party.id}>
														{party.name} ({party.members.length})
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									{selectedSavedParty ? (
										<p className="text-xs text-muted-foreground">
											Using saved party levels:{' '}
											{resolvedSpecificPartyLevels.join(', ')}
										</p>
									) : (
										<div className="space-y-2">
											<FormLabel>Custom Party Levels</FormLabel>
											<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
												{specificPartyLevels.map((level, index) => (
													<div
														key={`custom-level-${index}`}
														className="flex gap-1"
													>
														<Input
															type="number"
															min={1}
															max={20}
															value={level}
															onChange={(event) => {
																const nextLevels = [...specificPartyLevels];

																nextLevels[index] = Number(event.target.value);
																form.setValue(
																	'specificPartyLevels',
																	nextLevels
																);
															}}
														/>
														<Button
															type="button"
															variant="outline"
															onClick={() => {
																const nextLevels = specificPartyLevels.filter(
																	(_, i) => i !== index
																);

																form.setValue(
																	'specificPartyLevels',
																	nextLevels
																);
															}}
														>
															X
														</Button>
													</div>
												))}
											</div>
											<Button
												type="button"
												variant="outline"
												onClick={() =>
													form.setValue('specificPartyLevels', [
														...specificPartyLevels,
														1,
													])
												}
											>
												Add Member Level
											</Button>
										</div>
									)}
								</div>
							) : null}

							{partySetupMode === 'challenge-points' ? (
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="space-y-1">
										<FormLabel>Level Tier</FormLabel>
										<Select
											value={`${challengePointTierStart}`}
											onValueChange={(value) =>
												form.setValue('challengePointTierStart', Number(value))
											}
										>
											<SelectTrigger className="w-full">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{CHALLENGE_POINT_TIER_STARTS.map((tierStart) => (
													<SelectItem key={tierStart} value={`${tierStart}`}>
														{challengePointTierLabel(tierStart)}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-1">
										<FormLabel>Challenge Points Budget</FormLabel>
										<Input
											type="number"
											value={challengePointBudget}
											onChange={(event) =>
												form.setValue(
													'challengePointBudget',
													Math.min(48, Number(event.target.value) || 0)
												)
											}
											onBlur={() =>
												form.setValue(
													'challengePointBudget',
													Math.max(2, challengePointBudget || 0)
												)
											}
										/>
									</div>
									<p className="text-xs text-muted-foreground sm:col-span-2">
										{normalizedPartySetup.challengePointBudget} ChP equals{' '}
										{normalizedPartySetup.xpBudgetEquivalent} XP at tier{' '}
										{normalizedPartySetup.challengePointTierLabel} (basis level{' '}
										{normalizedPartySetup.challengePointBasisLevel}). Assumed
										party size for threat display:{' '}
										{normalizedPartySetup.inferredChallengePointPartySize}.
									</p>
								</div>
							) : null}

							<p className="text-xs text-muted-foreground">
								Effective calculation context: level {safePartyLevel}, size{' '}
								{safePartySize}, {normalizedPartySetup.challengePointBudget}{' '}
								ChP.
							</p>
						</div>

						{partySetupMode === 'simple' ? (
							<FormField
								control={form.control}
								name="partySize"
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormLabel className="-mb-5">Party Size</FormLabel>
										<FormControl>
											<PartySizePicker
												value={field.value}
												onChange={field.onChange}
												onBlur={field.onBlur}
												name={field.name}
												ref={field.ref}
												rows={2}
												buttonSize="xl"
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						) : null}
					</div>
				</div>
				<div className="space-y-2">
					<section className="rounded-md border p-3 space-y-3">
						<div className="flex items-center justify-between gap-2">
							<div>
								<h3 className="text-sm font-semibold">Factions</h3>
								<p className="text-xs text-muted-foreground">
									Players are reserved; factions apply to opponent, ally, and
									other alignments.
								</p>
							</div>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={addFaction}
							>
								Add Faction
							</Button>
						</div>

						{editableFactions.length === 0 ? (
							<p className="text-xs text-muted-foreground">
								No custom factions yet. Add one to override alignment, icon, and
								color.
							</p>
						) : (
							<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
								{editableFactions.map((faction, index) => (
									<Card key={faction.id} className="gap-0 py-0">
										<CardContent className="space-y-2 px-3 py-3">
											<div className="flex items-center justify-between gap-2">
												<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
													Faction {index + 1}
												</p>
												<Button
													type="button"
													variant="ghost"
													size="sm"
													onClick={() => removeFaction(faction.id)}
													className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
													title="Remove faction"
												>
													<Trash2 className="size-3.5" />
													<span>Delete</span>
												</Button>
											</div>

											<div className="space-y-1">
												<FormLabel className="text-xs">Name</FormLabel>
												<Input
													value={faction.name}
													onChange={(event) =>
														updateFaction(faction.id, (current) => ({
															...current,
															name: event.target.value,
														}))
													}
													placeholder="Faction name"
													className="h-8 bg-background"
												/>
											</div>

											<div className="space-y-1">
												<FormLabel className="text-xs">Alignment</FormLabel>
												<div
													role="radiogroup"
													aria-label="Faction alignment"
													className="grid grid-cols-3 gap-1"
												>
													{FACTION_ALIGNMENT_OPTIONS.map((option) => (
														<Toggle
															key={option.value}
															pressed={faction.alignment === option.value}
															onPressedChange={(pressed) => {
																if (!pressed) {
																	return;
																}

																updateFaction(faction.id, (current) => ({
																	...current,
																	alignment: option.value,
																}));
															}}
															variant="outline"
															size="sm"
															className={cn(
																'h-7 w-full justify-center px-1 text-[11px]',
																faction.alignment === option.value &&
																	'border-primary bg-primary/10 text-primary'
															)}
														>
															{option.label}
														</Toggle>
													))}
												</div>
											</div>

											<div className="grid grid-cols-4 gap-2">
												<div className="col-span-2 space-y-1">
													<FormLabel className="text-xs">Icon</FormLabel>
													<div className="grid grid-cols-3 gap-1 rounded-md border bg-background p-1">
														{FACTION_ICON_OPTIONS.map((option) => {
															const isSelected = faction.icon === option.value;

															return (
																<Toggle
																	key={option.value}
																	pressed={isSelected}
																	onPressedChange={(pressed) => {
																		if (!pressed) {
																			return;
																		}

																		updateFaction(faction.id, (current) => ({
																			...current,
																			icon: option.value,
																		}));
																	}}
																	variant="outline"
																	size="sm"
																	className={cn(
																		'h-7 w-full px-0',
																		isSelected &&
																			'border-primary bg-primary/10 text-primary'
																	)}
																	title={option.label}
																>
																	<option.Icon className="size-3.5" />
																</Toggle>
															);
														})}
													</div>
												</div>

												<div className="col-span-2 space-y-1">
													<FormLabel className="text-xs">Color</FormLabel>
													<div className="grid grid-cols-3 gap-1 rounded-md border bg-background p-1">
														{FACTION_COLOR_OPTIONS.map((option) => {
															const isSelected = faction.color === option.value;

															return (
																<Toggle
																	key={option.value}
																	pressed={isSelected}
																	onPressedChange={(pressed) => {
																		if (!pressed) {
																			return;
																		}

																		updateFaction(faction.id, (current) => ({
																			...current,
																			color: option.value,
																		}));
																	}}
																	variant="outline"
																	size="sm"
																	className={cn(
																		'h-7 w-full px-0',
																		isSelected &&
																			'border-primary bg-primary/10 text-primary'
																	)}
																	title={option.label}
																>
																	<span
																		className={cn(
																			'h-3.5 w-3.5 rounded-full',
																			option.swatchClassName
																		)}
																	/>
																</Toggle>
															);
														})}
													</div>
												</div>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						)}
					</section>

					<NoteListSection
						form={form}
						noteFields={noteFields}
						notes={notes}
						appendNote={appendNote}
						removeNote={removeNote}
						activeNotesTab={activeNotesTab}
						onActiveNotesTabChange={onActiveNotesTabChange}
						layoutKey={layoutKey}
						onLayoutKeyChange={onLayoutKeyChange}
					/>
				</div>
			</section>
		</TabsContent>
	);
}
