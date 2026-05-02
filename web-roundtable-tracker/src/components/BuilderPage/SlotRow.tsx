import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DcsTab } from './SlotRowTabs/DcsTab';
import { HpTab } from './SlotRowTabs/HpTab';
import { InitiativeTab } from './SlotRowTabs/InitiativeTab';
import { AdjustmentTab } from './SlotRowTabs/AdjustmentTab';
import { TraitsTab } from './SlotRowTabs/TraitsTab';
import { CombatReadyTab } from './SlotRowTabs/CombatReadyTab';
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import {
	UseFieldArrayRemove,
	UseFieldArrayUpdate,
	UseFormReturn,
} from 'react-hook-form';
import {
	ScrollText,
	ShieldPlus,
	Skull,
	Trash2,
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
import { Card } from '../ui/card';

const SLOT_TYPES: { value: SlotType; label: string; Icon: LucideIcon }[] = [
	{ value: 'creature', label: 'Creature', Icon: Skull },
	{ value: 'hazard', label: 'Hazard', Icon: TriangleAlert },
	{ value: 'reinforcement', label: 'Reinforcement', Icon: ShieldPlus },
	{ value: 'narrative', label: 'Narrative Event', Icon: ScrollText },
];

export const PARTICIPANT_SLOT_TYPES: SlotType[] = ['creature', 'hazard'];

export const EVENT_SLOT_TYPES: SlotType[] = ['narrative', 'reinforcement'];

const SIDE_OPTIONS: { value: SideType; label: string }[] = [
	{ value: 'opponent', label: 'Opponents' },
	{ value: 'ally', label: 'Allies' },
	{ value: 'other', label: 'Other' },
];

const ADJUSTMENT_OPTIONS: { value: LevelAdjustment | 'none'; label: string }[] =
	[
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

export type AdditionalDataBlockKey =
	| 'hp'
	| 'dcs'
	| 'initiative'
	| 'adjustment'
	| 'traits'
	| 'combat-ready';

const COMBAT_TAB_ORDER: AdditionalDataBlockKey[] = [
	'combat-ready',
	'hp',
	'initiative',
	'dcs',
	'adjustment',
	'traits',
];

const ADDITIONAL_BLOCKS: Array<{
	key: AdditionalDataBlockKey;
	label: string;
	description: string;
}> = [
	{
		key: 'hp',
		label: 'HP / Hardness',
		description: 'Adds HP override, and hardness for hazards.',
	},
	{
		key: 'dcs',
		label: 'DC List',
		description:
			'Adds icon, name, and value entries. Hazards can set disable successes.',
	},
	{
		key: 'initiative',
		label: 'Initiative Bonus',
		description: 'Adds a bonus used during preview initiative generation.',
	},
	{
		key: 'adjustment',
		label: 'Adjustment',
		description: 'Pick preset adjustment or set a custom level modifier.',
	},
	{
		key: 'traits',
		label: 'Traits',
		description:
			'Add traits to this participant, which can be used for filtering and recall knowledge.',
	},
	{
		key: 'combat-ready',
		label: 'Combat Ready State',
		description:
			'Set whether this participant is active at the start of combat, or is waiting to be deployed.',
	},
];

function hasAdditionalBlock(
	slot: BuilderSlot,
	key: AdditionalDataBlockKey
): boolean {
	if (slot.type !== 'creature' && slot.type !== 'hazard') {
		return false;
	}

	if (key === 'hp') {
		return (
			typeof slot.maxHealth === 'number' ||
			(slot.type === 'hazard' && typeof slot.hardness === 'number')
		);
	}

	if (key === 'dcs') {
		return (slot.dcs?.length ?? 0) > 0;
	}

	if (key === 'initiative') {
		return typeof slot.initiativeBonus === 'number';
	}

	if (key === 'adjustment') {
		if (slot.type !== 'creature') {
			return false;
		}

		return (
			slot.adjustment !== 'none' ||
			(slot.adjustmentDescription?.trim().length ?? 0) > 0 ||
			typeof slot.adjustmentLevelModifier === 'number'
		);
	}

	if (key === 'traits') {
		return (slot.traits?.length ?? 0) > 0;
	}

	if (key === 'combat-ready') {
		return (
			slot.combatReadyState !== 'active' || slot.hiddenFromPlayers === true
		);
	}

	return false;
}

function hasReinforcementAdditionalBlock(
	participant: BuilderReinforcementParticipant,
	key: AdditionalDataBlockKey
): boolean {
	if (key === 'hp') {
		return (
			typeof participant.maxHealth === 'number' ||
			(participant.type === 'hazard' &&
				typeof participant.hardness === 'number')
		);
	}

	if (key === 'dcs') {
		return (participant.dcs?.length ?? 0) > 0;
	}

	if (key === 'initiative') {
		return typeof participant.initiativeBonus === 'number';
	}

	if (key === 'adjustment') {
		if (participant.type !== 'creature') {
			return false;
		}

		return (
			participant.adjustment !== 'none' ||
			(participant.adjustmentDescription?.trim().length ?? 0) > 0 ||
			typeof participant.adjustmentLevelModifier === 'number'
		);
	}

	if (key === 'traits') {
		return (participant.traits?.length ?? 0) > 0;
	}

	if (key === 'combat-ready') {
		return (
			participant.combatReadyState !== 'active' ||
			participant.hiddenFromPlayers === true
		);
	}

	return false;
}

function isBlockAllowed(
	block: AdditionalDataBlockKey,
	slotType: SlotType,
	isSimpleHazard: boolean
): boolean {
	if (block === 'adjustment' && slotType !== 'creature') return false;

	if (block === 'initiative' && isSimpleHazard) return false;

	return true;
}

function getTabForBlock(block: AdditionalDataBlockKey): AdditionalDataBlockKey {
	if (block === 'initiative') {
		return 'initiative';
	}

	return block;
}

function inferEnabledTabsFromSlot(slot: BuilderSlot): AdditionalDataBlockKey[] {
	if (slot.type !== 'creature' && slot.type !== 'hazard') {
		return [];
	}

	const tabs: AdditionalDataBlockKey[] = [];

	if (hasAdditionalBlock(slot, 'hp')) tabs.push('hp');

	if (hasAdditionalBlock(slot, 'initiative')) tabs.push('initiative');

	if (hasAdditionalBlock(slot, 'dcs')) tabs.push('dcs');

	if (slot.type === 'creature' && hasAdditionalBlock(slot, 'adjustment')) {
		tabs.push('adjustment');
	}

	if (hasAdditionalBlock(slot, 'traits')) tabs.push('traits');

	if (
		slot.combatReadyState &&
		(slot.combatReadyState !== 'active' || slot.hiddenFromPlayers)
	) {
		tabs.push('combat-ready');
	}

	return tabs;
}

function inferEnabledTabsFromReinforcementParticipant(
	participant: BuilderReinforcementParticipant
): AdditionalDataBlockKey[] {
	const tabs: AdditionalDataBlockKey[] = [];

	if (hasReinforcementAdditionalBlock(participant, 'hp')) tabs.push('hp');

	if (hasReinforcementAdditionalBlock(participant, 'initiative')) {
		tabs.push('initiative');
	}

	if (hasReinforcementAdditionalBlock(participant, 'dcs')) tabs.push('dcs');

	if (
		participant.type === 'creature' &&
		hasReinforcementAdditionalBlock(participant, 'adjustment')
	) {
		tabs.push('adjustment');
	}

	if (hasReinforcementAdditionalBlock(participant, 'traits'))
		tabs.push('traits');

	if (hasReinforcementAdditionalBlock(participant, 'combat-ready')) {
		tabs.push('combat-ready');
	}

	return tabs;
}

interface SlotRowProps {
	index: number;
	form: UseFormReturn<BuilderFormValues>;
	remove: UseFieldArrayRemove;
	update: UseFieldArrayUpdate<BuilderFormValues, 'slots'>;
	allowedTypes: SlotType[];
	usedAdditionalDataBlocks?: AdditionalDataBlockKey[];
}

export function SlotRow({
	index,
	form,
	remove,
	update,
	allowedTypes,
	usedAdditionalDataBlocks = [],
}: SlotRowProps) {
	const { control, watch, setValue } = form;
	const slot = watch(`slots.${index}`) as BuilderSlot;
	const slotType = slot.type;
	const isCombatSlot = slotType === 'creature' || slotType === 'hazard';
	const isSimpleHazard = slotType === 'hazard' && slot.isSimpleHazard;
	const [addDataOpen, setAddDataOpen] = useState(false);
	const [activeTab, setActiveTab] = useState<string>('');
	const [activeTabs, setActiveTabs] = useState<AdditionalDataBlockKey[]>(() =>
		inferEnabledTabsFromSlot(slot)
	);
	const [enabledBlocks, setEnabledBlocks] = useState<AdditionalDataBlockKey[]>(
		[]
	);
	const [reinforcementEnabledBlocks, setReinforcementEnabledBlocks] = useState<
		Record<string, AdditionalDataBlockKey[]>
	>({});
	const [reinforcementActiveTabs, setReinforcementActiveTabs] = useState<
		Record<string, string>
	>({});
	const [
		activeReinforcementParticipantId,
		setActiveReinforcementParticipantId,
	] = useState<string | null>(null);
	const availableSlotTypes = SLOT_TYPES.filter(({ value }) =>
		allowedTypes.includes(value)
	);
	const reinforcementParticipants = slot.reinforcementParticipants ?? [];
	const availableCombatTabs = useMemo(
		() =>
			COMBAT_TAB_ORDER.filter((tab) =>
				isBlockAllowed(tab as AdditionalDataBlockKey, slotType, isSimpleHazard)
			),
		[slotType, isSimpleHazard]
	);
	const visibleTabs = useMemo(
		() =>
			availableCombatTabs.filter((tab) => {
				return (
					activeTabs.includes(tab) ||
					enabledBlocks.some((block) => getTabForBlock(block) === tab)
				);
			}),
		[activeTabs, availableCombatTabs, enabledBlocks, isCombatSlot]
	);
	const missingSuggestedBlocks = useMemo(
		() =>
			usedAdditionalDataBlocks.filter(
				(block) =>
					isBlockAllowed(block, slotType, isSimpleHazard) &&
					!hasAdditionalBlock(slot, block) &&
					!enabledBlocks.includes(block)
			),
		[enabledBlocks, isSimpleHazard, slot, slotType, usedAdditionalDataBlocks]
	);

	useEffect(() => {
		setActiveTabs(inferEnabledTabsFromSlot(slot));
	}, [slot.id]);

	useEffect(() => {
		const ids = new Set(
			reinforcementParticipants.map((participant) => participant.id)
		);

		setReinforcementEnabledBlocks((current) => {
			const next = Object.fromEntries(
				Object.entries(current).filter(([id]) => ids.has(id))
			) as Record<string, AdditionalDataBlockKey[]>;

			return Object.keys(next).length === Object.keys(current).length
				? current
				: next;
		});

		setReinforcementActiveTabs((current) => {
			const next = Object.fromEntries(
				Object.entries(current).filter(([id]) => ids.has(id))
			) as Record<string, string>;

			return Object.keys(next).length === Object.keys(current).length
				? current
				: next;
		});

		if (
			activeReinforcementParticipantId &&
			!ids.has(activeReinforcementParticipantId)
		) {
			setActiveReinforcementParticipantId(null);
		}
	}, [activeReinforcementParticipantId, reinforcementParticipants]);

	useEffect(() => {
		if (!isCombatSlot) {
			if (activeTab !== '') {
				setActiveTab('');
			}

			if (activeTabs.length > 0) {
				setActiveTabs([]);
			}

			return;
		}

		setEnabledBlocks((current) =>
			current.filter((block) => isBlockAllowed(block, slotType, isSimpleHazard))
		);
		setActiveTabs((current) =>
			current.filter((tab) => isBlockAllowed(tab, slotType, isSimpleHazard))
		);

		if (
			visibleTabs.length > 0 &&
			(activeTab === '' ||
				!visibleTabs.includes(activeTab as AdditionalDataBlockKey))
		) {
			setActiveTab(visibleTabs[0]);
		}

		if (visibleTabs.length === 0 && activeTab !== '') {
			setActiveTab('');
		}
	}, [
		activeTab,
		activeTabs.length,
		isCombatSlot,
		isSimpleHazard,
		slotType,
		visibleTabs,
	]);

	const createDefaultReinforcementParticipant =
		(): BuilderReinforcementParticipant => ({
			id: uuidv4(),
			type: 'creature',
			name: '',
			side: 'opponent',
			level: 1,
			count: 1,
			maxHealth: undefined,
			hardness: undefined,
			initiativeBonus: undefined,
			initiativeDescription: undefined,
			dcs: [],
			successesToDisable: 1,
			adjustment: 'none',
			adjustmentDescription: undefined,
			adjustmentLevelModifier: undefined,
			isSimpleHazard: false,
			traits: [],
			combatReadyState: 'active',
			initiativeModifier: undefined,
			hiddenFromPlayers: false,
		});

	const applyAdditionalBlock = (block: AdditionalDataBlockKey) => {
		if (!isCombatSlot) {
			return;
		}

		setEnabledBlocks((current) =>
			current.includes(block) ? current : [...current, block]
		);

		const tab = getTabForBlock(block);
		setActiveTabs((current) =>
			current.includes(tab) ? current : [...current, tab]
		);
		setActiveTab(tab);

		if (block === 'hp') {
			if (typeof slot.maxHealth !== 'number') {
				setValue(`slots.${index}.maxHealth`, 1, {
					shouldDirty: true,
					shouldTouch: true,
				});
			}

			if (slot.type === 'hazard' && typeof slot.hardness !== 'number') {
				setValue(`slots.${index}.hardness`, 0, {
					shouldDirty: true,
					shouldTouch: true,
				});
			}
		}

		if (block === 'dcs' && (slot.dcs?.length ?? 0) === 0) {
			setValue(
				`slots.${index}.dcs`,
				[
					{
						name: '',
						value: 10,
					},
				],
				{ shouldDirty: true, shouldTouch: true }
			);
		}

		if (block === 'initiative' && typeof slot.initiativeBonus !== 'number') {
			setValue(`slots.${index}.initiativeBonus`, 0, {
				shouldDirty: true,
				shouldTouch: true,
			});
		}

		if (block === 'adjustment' && slot.type === 'creature') {
			setValue(`slots.${index}.adjustment`, 'none', {
				shouldDirty: true,
				shouldTouch: true,
			});

			if (typeof slot.adjustmentLevelModifier !== 'number') {
				setValue(`slots.${index}.adjustmentLevelModifier`, 0, {
					shouldDirty: true,
					shouldTouch: true,
				});
			}
		}
	};

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
			updatedParticipant.hardness = undefined;
		}

		next[participantIndex] = updatedParticipant;

		setValue(`slots.${index}.reinforcementParticipants`, next, {
			shouldDirty: true,
			shouldTouch: true,
		});
	};

	const getReinforcementVisibleTabs = (
		participant: BuilderReinforcementParticipant
	): AdditionalDataBlockKey[] => {
		const participantIsSimpleHazard =
			participant.type === 'hazard' && participant.isSimpleHazard;
		const availableTabs = COMBAT_TAB_ORDER.filter((tab) =>
			isBlockAllowed(tab, participant.type, participantIsSimpleHazard)
		);
		const inferredTabs =
			inferEnabledTabsFromReinforcementParticipant(participant);
		const enabledForParticipant =
			reinforcementEnabledBlocks[participant.id] ?? [];

		return availableTabs.filter(
			(tab) =>
				inferredTabs.includes(tab) ||
				enabledForParticipant.some((block) => getTabForBlock(block) === tab)
		);
	};

	const getReinforcementSuggestedBlocks = (
		participant: BuilderReinforcementParticipant
	): AdditionalDataBlockKey[] => {
		const participantIsSimpleHazard =
			participant.type === 'hazard' && participant.isSimpleHazard;
		const enabledForParticipant =
			reinforcementEnabledBlocks[participant.id] ?? [];

		return usedAdditionalDataBlocks.filter(
			(block) =>
				isBlockAllowed(block, participant.type, participantIsSimpleHazard) &&
				!hasReinforcementAdditionalBlock(participant, block) &&
				!enabledForParticipant.includes(block)
		);
	};

	const handleSetReinforcementTab = (
		participant: BuilderReinforcementParticipant,
		tab: string
	) => {
		setReinforcementActiveTabs((current) => ({
			...current,
			[participant.id]: tab,
		}));
	};

	const handleApplyReinforcementAdditionalBlock = (
		participantIndex: number,
		block: AdditionalDataBlockKey
	) => {
		const participant = reinforcementParticipants[participantIndex];

		if (!participant) {
			return;
		}

		const participantIsSimpleHazard =
			participant.type === 'hazard' && participant.isSimpleHazard;

		if (!isBlockAllowed(block, participant.type, participantIsSimpleHazard)) {
			return;
		}

		setReinforcementEnabledBlocks((current) => ({
			...current,
			[participant.id]: current[participant.id]?.includes(block)
				? (current[participant.id] ?? [])
				: [...(current[participant.id] ?? []), block],
		}));

		handleSetReinforcementTab(participant, getTabForBlock(block));

		if (block === 'hp') {
			handleReinforcementParticipantChange(participantIndex, {
				maxHealth:
					typeof participant.maxHealth === 'number' ? participant.maxHealth : 1,
				hardness:
					participant.type === 'hazard'
						? typeof participant.hardness === 'number'
							? participant.hardness
							: 0
						: participant.hardness,
			});
		}

		if (block === 'dcs' && (participant.dcs?.length ?? 0) === 0) {
			handleReinforcementParticipantChange(participantIndex, {
				dcs: [
					{
						name: '',
						value: 10,
					},
				],
			});
		}

		if (
			block === 'initiative' &&
			typeof participant.initiativeBonus !== 'number'
		) {
			handleReinforcementParticipantChange(participantIndex, {
				initiativeBonus: 0,
			});
		}

		if (block === 'adjustment' && participant.type === 'creature') {
			handleReinforcementParticipantChange(participantIndex, {
				adjustment: participant.adjustment ?? 'none',
				adjustmentLevelModifier:
					typeof participant.adjustmentLevelModifier === 'number'
						? participant.adjustmentLevelModifier
						: 0,
			});
		}

		if (block === 'traits' && !participant.traits) {
			handleReinforcementParticipantChange(participantIndex, {
				traits: [],
			});
		}

		if (block === 'combat-ready') {
			handleReinforcementParticipantChange(participantIndex, {
				combatReadyState: participant.combatReadyState ?? 'active',
				hiddenFromPlayers: participant.hiddenFromPlayers ?? false,
			});
		}
	};

	const handleRemoveReinforcementTab = (
		participantIndex: number,
		tab: AdditionalDataBlockKey
	) => {
		const participant = reinforcementParticipants[participantIndex];

		if (!participant) {
			return;
		}

		if (tab === 'dcs') {
			handleReinforcementParticipantChange(participantIndex, { dcs: [] });
		}

		if (tab === 'hp') {
			handleReinforcementParticipantChange(participantIndex, {
				maxHealth: undefined,
				hardness:
					participant.type === 'hazard' ? undefined : participant.hardness,
			});
		}

		if (tab === 'initiative') {
			handleReinforcementParticipantChange(participantIndex, {
				initiativeBonus: undefined,
				initiativeDescription: undefined,
			});
		}

		if (tab === 'adjustment') {
			handleReinforcementParticipantChange(participantIndex, {
				adjustment: 'none',
				adjustmentDescription: undefined,
				adjustmentLevelModifier: undefined,
			});
		}

		if (tab === 'traits') {
			handleReinforcementParticipantChange(participantIndex, { traits: [] });
		}

		if (tab === 'combat-ready') {
			handleReinforcementParticipantChange(participantIndex, {
				combatReadyState: 'active',
				hiddenFromPlayers: false,
			});
		}

		setReinforcementEnabledBlocks((current) => ({
			...current,
			[participant.id]: (current[participant.id] ?? []).filter(
				(block) => getTabForBlock(block) !== tab
			),
		}));

		setReinforcementActiveTabs((current) => {
			if (current[participant.id] !== tab) {
				return current;
			}

			return {
				...current,
				[participant.id]: '',
			};
		});
	};

	return (
		<div className="border rounded-md bg-card p-3 space-y-3">
			<div className="flex items-start gap-2">
				<div className="flex flex-wrap gap-2">
					{availableSlotTypes.map(({ value, label, Icon }) => (
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
					))}
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
				Optional parameters are collapsed by default. Expand below when you need
				overrides.
			</div>

			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-6">
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
											onValueChange={(value) =>
												field.onChange(value as SideType)
											}
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
							name={`slots.${index}.count` as const}
							render={({ field }) => (
								<FormItem className="space-y-1">
									<FormLabel>Count</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={0}
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

						{slotType === 'hazard' && (
							<>
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
							</>
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
						{reinforcementParticipants.map((participant, participantIndex) => {
							const participantIsSimpleHazard =
								participant.type === 'hazard' && participant.isSimpleHazard;
							const participantVisibleTabs =
								getReinforcementVisibleTabs(participant);
							const participantSuggestedBlocks =
								getReinforcementSuggestedBlocks(participant);
							const participantAvailableTabs = COMBAT_TAB_ORDER.filter((tab) =>
								isBlockAllowed(tab, participant.type, participantIsSimpleHazard)
							);
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
												handleRemoveReinforcementParticipant(participantIndex)
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
													handleReinforcementParticipantChange(
														participantIndex,
														{
															type: value as 'creature' | 'hazard',
														}
													)
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
													handleReinforcementParticipantChange(
														participantIndex,
														{
															name: event.target.value,
														}
													)
												}
												placeholder="Goblin Reinforcement"
											/>
										</div>

										<div className="space-y-1">
											<FormLabel>Side</FormLabel>
											<Select
												value={normalizeSideType(participant.side)}
												onValueChange={(value) =>
													handleReinforcementParticipantChange(
														participantIndex,
														{
															side: value as SideType,
														}
													)
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
												value={participant.level ?? ''}
												onChange={(event) =>
													handleReinforcementParticipantChange(
														participantIndex,
														{
															level: Number(event.target.value || 0),
														}
													)
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
													handleReinforcementParticipantChange(
														participantIndex,
														{
															count: Number(event.target.value || 0),
														}
													)
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
															handleReinforcementParticipantChange(
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
															handleReinforcementParticipantChange(
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
											handleSetReinforcementTab(participant, tab)
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
													ADDITIONAL_BLOCKS.find((b) => b.key === block)
														?.label || block;

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
															handleApplyReinforcementAdditionalBlock(
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
												onClick={() => {
													setActiveReinforcementParticipantId(participant.id);
													setAddDataOpen(true);
												}}
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
																		handleReinforcementParticipantChange(
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
																		handleRemoveReinforcementTab(
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
																		handleReinforcementParticipantChange(
																			participantIndex,
																			{ dcs: nextDcs }
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
																		handleReinforcementParticipantChange(
																			participantIndex,
																			{ dcs: nextDcs }
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
																		handleReinforcementParticipantChange(
																			participantIndex,
																			{ dcs: nextDcs }
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
																			handleReinforcementParticipantChange(
																				participantIndex,
																				{ dcs: nextDcs }
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
																		handleReinforcementParticipantChange(
																			participantIndex,
																			{ dcs: nextDcs }
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
																	handleRemoveReinforcementTab(
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
																	handleReinforcementParticipantChange(
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
																	handleReinforcementParticipantChange(
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
																	handleRemoveReinforcementTab(
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
																	handleReinforcementParticipantChange(
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
																		handleReinforcementParticipantChange(
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
																	handleRemoveReinforcementTab(
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
																	handleReinforcementParticipantChange(
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
																	handleReinforcementParticipantChange(
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
																	handleReinforcementParticipantChange(
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
																	handleRemoveReinforcementTab(
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
																		handleReinforcementParticipantChange(
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
																			handleReinforcementParticipantChange(
																				participantIndex,
																				{
																					traits: nextTraits,
																				}
																			);
																		}}
																	>
																		{trait} ×
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
																	handleRemoveReinforcementTab(
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
																	handleReinforcementParticipantChange(
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
																	handleReinforcementParticipantChange(
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
				<FormField
					control={control}
					name={`slots.${index}.description` as const}
					render={({ field }) => (
						<FormItem className="space-y-1">
							<FormLabel>Slot Notes</FormLabel>
							<FormControl>
								<Textarea
									placeholder="Optional notes for this slot"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Tabs for combat slots */}
				{isCombatSlot && (
					<Tabs
						value={activeTab}
						onValueChange={setActiveTab}
						className="w-full"
					>
						<TabsList className="flex flex-wrap w-full gap-2 h-auto p-1 bg-muted justify-start items-center">
							{/* Active tabs with solid borders */}
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

							{/* Suggested blocks with dashed borders */}
							{missingSuggestedBlocks.map((block) => {
								const blockLabel =
									ADDITIONAL_BLOCKS.find((b) => b.key === block)?.label ||
									block;

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
										onClick={() => applyAdditionalBlock(block)}
									>
										+ {blockLabel}
									</Button>
								);
							})}

							{/* "+ More" button */}
							<Button
								type="button"
								size="sm"
								className={[
									'border border-dashed h-8 bg-gray-200/50',
									availableCombatTabs.length === visibleTabs.length
										? 'opacity-50 cursor-not-allowed'
										: 'hover:bg-gray-200',
								].join(' ')}
								onClick={() => {
									setActiveReinforcementParticipantId(null);
									setAddDataOpen(true);
								}}
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
									onRemove={() => {
										setValue(`slots.${index}.dcs`, [], {
											shouldDirty: true,
											shouldTouch: true,
										});
										setEnabledBlocks((current) =>
											current.filter((block) => getTabForBlock(block) !== 'dcs')
										);
										setActiveTabs((current) =>
											current.filter((tab) => tab !== 'dcs')
										);

										if (activeTab === 'dcs') {
											setActiveTab('');
										}
									}}
								/>
							)}

							{visibleTabs.includes('hp') && (
								<HpTab
									index={index}
									slot={slot}
									slotType={slotType}
									control={control}
									onRemove={() => {
										setValue(`slots.${index}.maxHealth`, undefined, {
											shouldDirty: true,
											shouldTouch: true,
										});

										if (slotType === 'hazard') {
											setValue(`slots.${index}.hardness`, undefined, {
												shouldDirty: true,
												shouldTouch: true,
											});
										}
										setEnabledBlocks((current) =>
											current.filter((block) => getTabForBlock(block) !== 'hp')
										);
										setActiveTabs((current) =>
											current.filter((tab) => tab !== 'hp')
										);

										if (activeTab === 'hp') {
											setActiveTab('');
										}
									}}
								/>
							)}

							{visibleTabs.includes('initiative') && !isSimpleHazard && (
								<InitiativeTab
									index={index}
									slot={slot}
									control={control}
									onRemove={() => {
										setValue(`slots.${index}.initiativeBonus`, undefined, {
											shouldDirty: true,
											shouldTouch: true,
										});
										setValue(
											`slots.${index}.initiativeDescription`,
											undefined,
											{
												shouldDirty: true,
												shouldTouch: true,
											}
										);
										setEnabledBlocks((current) =>
											current.filter(
												(block) => getTabForBlock(block) !== 'initiative'
											)
										);
										setActiveTabs((current) =>
											current.filter((tab) => tab !== 'initiative')
										);

										if (activeTab === 'initiative') {
											setActiveTab('');
										}
									}}
								/>
							)}

							{slotType === 'creature' &&
								visibleTabs.includes('adjustment') && (
									<AdjustmentTab
										index={index}
										slot={slot}
										setValue={setValue}
										control={control}
										onRemove={() => {
											setValue(`slots.${index}.adjustment`, 'none', {
												shouldDirty: true,
												shouldTouch: true,
											});
											setValue(
												`slots.${index}.adjustmentDescription`,
												undefined,
												{
													shouldDirty: true,
													shouldTouch: true,
												}
											);
											setValue(
												`slots.${index}.adjustmentLevelModifier`,
												undefined,
												{
													shouldDirty: true,
													shouldTouch: true,
												}
											);
											setEnabledBlocks((current) =>
												current.filter(
													(block) => getTabForBlock(block) !== 'adjustment'
												)
											);
											setActiveTabs((current) =>
												current.filter((tab) => tab !== 'adjustment')
											);

											if (activeTab === 'adjustment') {
												setActiveTab('');
											}
										}}
									/>
								)}

							{visibleTabs.includes('traits') && (
								<TraitsTab
									index={index}
									slot={slot}
									setValue={setValue}
									onRemove={() => {
										setValue(`slots.${index}.traits`, [], {
											shouldDirty: true,
											shouldTouch: true,
										});
										setEnabledBlocks((current) =>
											current.filter(
												(block) => getTabForBlock(block) !== 'traits'
											)
										);
										setActiveTabs((current) =>
											current.filter((tab) => tab !== 'traits')
										);

										if (activeTab === 'traits') {
											setActiveTab('');
										}
									}}
								/>
							)}

							{visibleTabs.includes('combat-ready') && (
								<CombatReadyTab
									index={index}
									slot={slot}
									control={control}
									onRemove={() => {
										setValue(`slots.${index}.combatReadyState`, 'active', {
											shouldDirty: true,
											shouldTouch: true,
										});
										setValue(`slots.${index}.hiddenFromPlayers`, false, {
											shouldDirty: true,
											shouldTouch: true,
										});
										setEnabledBlocks((current) =>
											current.filter(
												(block) => getTabForBlock(block) !== 'combat-ready'
											)
										);
										setActiveTabs((current) =>
											current.filter((tab) => tab !== 'combat-ready')
										);

										if (activeTab === 'combat-ready') {
											setActiveTab('');
										}
									}}
								/>
							)}
						</Card>
					</Tabs>
				)}
			</div>

			<Dialog open={addDataOpen} onOpenChange={setAddDataOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{activeReinforcementParticipantId
								? 'Add Reinforcement Participant Data'
								: 'Add Participant Data'}
						</DialogTitle>
						<DialogDescription>
							Choose the additional information block to append.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						{(() => {
							if (activeReinforcementParticipantId) {
								const participantIndex = reinforcementParticipants.findIndex(
									(participant) =>
										participant.id === activeReinforcementParticipantId
								);
								const participant = reinforcementParticipants[participantIndex];

								if (!participant || participantIndex < 0) {
									return null;
								}

								const participantIsSimpleHazard =
									participant.type === 'hazard' && participant.isSimpleHazard;
								const enabledForParticipant =
									reinforcementEnabledBlocks[participant.id] ?? [];

								return ADDITIONAL_BLOCKS.filter(
									(block) =>
										isBlockAllowed(
											block.key,
											participant.type,
											participantIsSimpleHazard
										) && !enabledForParticipant.includes(block.key)
								).map((block) => (
									<div
										key={`${participant.id}-${block.key}`}
										className="rounded-md border p-3 cursor-pointer hover:bg-muted"
										onClick={() => {
											handleApplyReinforcementAdditionalBlock(
												participantIndex,
												block.key
											);
											setAddDataOpen(false);
										}}
									>
										<div className="flex items-center justify-between gap-2">
											<div>
												<p className="text-sm font-medium">{block.label}</p>
												<p className="text-xs text-muted-foreground">
													{block.description}
												</p>
											</div>
										</div>
									</div>
								));
							}

							return ADDITIONAL_BLOCKS.filter(
								(block) =>
									isBlockAllowed(block.key, slotType, isSimpleHazard) &&
									!enabledBlocks.includes(block.key)
							).map((block) => (
								<div
									key={block.key}
									className="rounded-md border p-3 cursor-pointer hover:bg-muted"
									onClick={() => {
										applyAdditionalBlock(block.key);
										setAddDataOpen(false);
									}}
								>
									<div className="flex items-center justify-between gap-2">
										<div>
											<p className="text-sm font-medium">{block.label}</p>
											<p className="text-xs text-muted-foreground">
												{block.description}
											</p>
										</div>
									</div>
								</div>
							));
						})()}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
