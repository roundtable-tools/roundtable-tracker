import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
TriangleAlert,
type LucideIcon,
} from 'lucide-react';
import type { BuilderFormValues } from './builderConvert';
import { defaultSlot } from './builderConvert';
import type {
BuilderReinforcementParticipant,
BuilderSlot,
SlotType,
} from './builderXp';
import { ParagraphFields } from './ParagraphFields';
import { SlotRowEventFields } from './SlotRowEventFields';
import { SlotRowParticipantContent } from './SlotRowParticipantContent';

const SLOT_TYPES: { value: SlotType; label: string; Icon: LucideIcon }[] = [
{ value: 'creature', label: 'Creature', Icon: Skull },
{ value: 'hazard', label: 'Hazard', Icon: TriangleAlert },
{ value: 'reinforcement', label: 'Reinforcement', Icon: ShieldPlus },
{ value: 'narrative', label: 'Narrative Event', Icon: ScrollText },
];

export const PARTICIPANT_SLOT_TYPES: SlotType[] = ['creature', 'hazard'];

export const EVENT_SLOT_TYPES: SlotType[] = ['narrative', 'reinforcement'];

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

if (hasReinforcementAdditionalBlock(participant, 'traits')) {
tabs.push('traits');
}

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
allowedTypes: _allowedTypes,
usedAdditionalDataBlocks = [],
}: SlotRowProps) {
const { control, watch, setValue } = form;
void _allowedTypes;

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
[activeTabs, availableCombatTabs, enabledBlocks]
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

void handleTypeChange;
void handleRemove;

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

const getReinforcementAvailableTabs = (
participant: BuilderReinforcementParticipant
): AdditionalDataBlockKey[] => {
const participantIsSimpleHazard =
participant.type === 'hazard' && participant.isSimpleHazard;

return COMBAT_TAB_ORDER.filter((tab) =>
isBlockAllowed(tab, participant.type, participantIsSimpleHazard)
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

const handleRemoveDcsTab = () => {
setValue(`slots.${index}.dcs`, [], {
shouldDirty: true,
shouldTouch: true,
});
setEnabledBlocks((current) =>
current.filter((block) => getTabForBlock(block) !== 'dcs')
);
setActiveTabs((current) => current.filter((tab) => tab !== 'dcs'));

if (activeTab === 'dcs') setActiveTab('');
};

const handleRemoveHpTab = () => {
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
setActiveTabs((current) => current.filter((tab) => tab !== 'hp'));

if (activeTab === 'hp') setActiveTab('');
};

const handleRemoveInitiativeTab = () => {
setValue(`slots.${index}.initiativeBonus`, undefined, {
shouldDirty: true,
shouldTouch: true,
});
setValue(`slots.${index}.initiativeDescription`, undefined, {
shouldDirty: true,
shouldTouch: true,
});
setEnabledBlocks((current) =>
current.filter((block) => getTabForBlock(block) !== 'initiative')
);
setActiveTabs((current) =>
current.filter((tab) => tab !== 'initiative')
);

if (activeTab === 'initiative') setActiveTab('');
};

const handleRemoveAdjustmentTab = () => {
setValue(`slots.${index}.adjustment`, 'none', {
shouldDirty: true,
shouldTouch: true,
});
setValue(`slots.${index}.adjustmentDescription`, undefined, {
shouldDirty: true,
shouldTouch: true,
});
setValue(`slots.${index}.adjustmentLevelModifier`, undefined, {
shouldDirty: true,
shouldTouch: true,
});
setEnabledBlocks((current) =>
current.filter((block) => getTabForBlock(block) !== 'adjustment')
);
setActiveTabs((current) =>
current.filter((tab) => tab !== 'adjustment')
);

if (activeTab === 'adjustment') setActiveTab('');
};

const handleRemoveTraitsTab = () => {
setValue(`slots.${index}.traits`, [], {
shouldDirty: true,
shouldTouch: true,
});
setEnabledBlocks((current) =>
current.filter((block) => getTabForBlock(block) !== 'traits')
);
setActiveTabs((current) => current.filter((tab) => tab !== 'traits'));

if (activeTab === 'traits') setActiveTab('');
};

const handleRemoveCombatReadyTab = () => {
setValue(`slots.${index}.combatReadyState`, 'active', {
shouldDirty: true,
shouldTouch: true,
});
setValue(`slots.${index}.hiddenFromPlayers`, false, {
shouldDirty: true,
shouldTouch: true,
});
setEnabledBlocks((current) =>
current.filter((block) => getTabForBlock(block) !== 'combat-ready')
);
setActiveTabs((current) =>
current.filter((tab) => tab !== 'combat-ready')
);

if (activeTab === 'combat-ready') setActiveTab('');
};

return (
<div className="border rounded-md bg-card p-3 space-y-3">
<div className="w-full gap-2">
{(() => {
const slotTypeData = SLOT_TYPES.find(({ value }) => value == slotType);

return (
slotTypeData && (
<ParagraphFields
control={control}
label={
<div className="flex items-center gap-1">
<slotTypeData.Icon size={16} />
<span className="px-1">
{slotTypeData.label} Name and Description
</span>
</div>
}
fieldNames={[
`slots.${index}.name` as const,
`slots.${index}.description` as const,
]}
placeholders={[
'Training Grounds',
'Brief setup description...',
]}
/>
)
);
})()}
</div>

<SlotRowParticipantContent
index={index}
form={form}
slot={slot}
slotType={slotType}
isCombatSlot={isCombatSlot}
isSimpleHazard={isSimpleHazard}
activeTab={activeTab}
visibleTabs={visibleTabs}
availableCombatTabs={availableCombatTabs}
missingSuggestedBlocks={missingSuggestedBlocks}
reinforcementParticipants={reinforcementParticipants}
reinforcementActiveTabs={reinforcementActiveTabs}
getReinforcementVisibleTabs={getReinforcementVisibleTabs}
getReinforcementSuggestedBlocks={getReinforcementSuggestedBlocks}
getReinforcementAvailableTabs={getReinforcementAvailableTabs}
onSetActiveTab={setActiveTab}
onApplyAdditionalBlock={applyAdditionalBlock}
onOpenAddParticipantDataDialog={() => {
setActiveReinforcementParticipantId(null);
setAddDataOpen(true);
}}
onOpenAddReinforcementParticipantDataDialog={(participantId) => {
setActiveReinforcementParticipantId(participantId);
setAddDataOpen(true);
}}
onAddReinforcementParticipant={handleAddReinforcementParticipant}
onRemoveReinforcementParticipant={
handleRemoveReinforcementParticipant
}
onSetReinforcementTab={handleSetReinforcementTab}
onApplyReinforcementAdditionalBlock={
handleApplyReinforcementAdditionalBlock
}
onRemoveReinforcementTab={handleRemoveReinforcementTab}
onReinforcementParticipantChange={
handleReinforcementParticipantChange
}
onRemoveDcsTab={handleRemoveDcsTab}
onRemoveHpTab={handleRemoveHpTab}
onRemoveInitiativeTab={handleRemoveInitiativeTab}
onRemoveAdjustmentTab={handleRemoveAdjustmentTab}
onRemoveTraitsTab={handleRemoveTraitsTab}
onRemoveCombatReadyTab={handleRemoveCombatReadyTab}
/>

<SlotRowEventFields index={index} slotType={slotType} form={form} />

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
