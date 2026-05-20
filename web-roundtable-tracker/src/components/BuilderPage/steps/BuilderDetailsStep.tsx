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
import { TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
	CHALLENGE_POINT_TIER_STARTS,
	challengePointTierLabel,
	normalizePartySetup,
} from '@/models/utility/challengePoints/challengePoints';
import {
	ENCOUNTER_FACTION_COLOR_KEYS,
	ENCOUNTER_FACTION_ICON_KEYS,
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
import { Trash2 } from 'lucide-react';
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
				name: `Faction ${factions.length + 1}`,
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
				reinforcementParticipants:
					slot.reinforcementParticipants?.map((participant) => ({
						...participant,
						factionId:
							participant.factionId === factionId
								? fallbackFaction.id
								: participant.factionId,
						side:
							participant.factionId === factionId
								? fallbackSide
								: participant.side,
					})),
			})),
			{ shouldDirty: true, shouldTouch: true }
		);

		form.setValue(
			'notes',
			currentNotes.map((note) => ({
				...note,
				factionId: note.factionId === factionId ? fallbackFaction.id : note.factionId,
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
											variant={partySetupMode === mode.key ? 'default' : 'outline'}
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
												<SelectItem value="custom">Custom level list</SelectItem>
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
											Using saved party levels: {resolvedSpecificPartyLevels.join(', ')}
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
																form.setValue('specificPartyLevels', nextLevels);
															}}
														/>
														<Button
															type="button"
															variant="outline"
															onClick={() => {
																const nextLevels = specificPartyLevels.filter(
																	(_, i) => i !== index
																);

																form.setValue('specificPartyLevels', nextLevels);
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
										{normalizedPartySetup.challengePointBasisLevel}). Assumed party size
										for threat display:{' '}
										{normalizedPartySetup.inferredChallengePointPartySize}.
									</p>
								</div>
							) : null}

							<p className="text-xs text-muted-foreground">
								Effective calculation context: level {safePartyLevel}, size{' '}
								{safePartySize}, {normalizedPartySetup.challengePointBudget} ChP.
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
									Players are reserved; factions apply to opponent, ally, and other
									alignments.
								</p>
							</div>
							<Button type="button" variant="outline" size="sm" onClick={addFaction}>
								Add Faction
							</Button>
						</div>

						<div className="space-y-2">
							{factions.map((faction) => (
								<div
									key={faction.id}
									className="grid gap-2 rounded-md border bg-muted/20 p-2 sm:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
								>
									<Input
										value={faction.name}
										onChange={(event) =>
											updateFaction(faction.id, (current) => ({
												...current,
												name: event.target.value,
											}))
										}
										placeholder="Faction name"
									/>
									<Select
										value={faction.alignment}
										onValueChange={(value) =>
											updateFaction(faction.id, (current) => ({
												...current,
												alignment: value as EncounterFaction['alignment'],
											}))
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{FACTION_ALIGNMENT_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={faction.icon}
										onValueChange={(value) =>
											updateFaction(faction.id, (current) => ({
												...current,
												icon: value as EncounterFaction['icon'],
											}))
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ENCOUNTER_FACTION_ICON_KEYS.map((icon) => (
												<SelectItem key={icon} value={icon}>
													{icon}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Select
										value={faction.color}
										onValueChange={(value) =>
											updateFaction(faction.id, (current) => ({
												...current,
												color: value as EncounterFaction['color'],
											}))
										}
									>
										<SelectTrigger className="w-full">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{ENCOUNTER_FACTION_COLOR_KEYS.map((color) => (
												<SelectItem key={color} value={color}>
													{color}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button
										type="button"
										variant="ghost"
										onClick={() => removeFaction(faction.id)}
										disabled={Boolean(faction.isBuiltIn)}
										title={
											faction.isBuiltIn
												? 'Built-in faction cannot be removed'
												: 'Remove faction'
										}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>
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
