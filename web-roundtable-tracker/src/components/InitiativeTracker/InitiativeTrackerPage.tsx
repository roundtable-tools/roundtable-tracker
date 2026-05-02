import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { type TrackerParticipant } from './mockData';
import Timeline from '@/components/InitiativeList/Timeline';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
	type CarouselApi,
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
	ArrowRight,
	ArrowUpDown,
	History,
	Redo2,
	ShieldOff,
	SkipForward,
	Undo2,
} from 'lucide-react';
import { Reorder } from 'motion/react';
import { InitiativeActionCarouselCard } from './InitiativeActionCarouselCard';
import {
	getEncounterStore,
	useEncounterStore,
} from '@/store/encounterRuntimeInstance';
import {
	runtimeToInitiativeQueue,
	runtimeToInitiativeQueueWithPending,
	runtimeToOutOfInitiativeData,
	narrativeSlotsToTimeline,
	encounterToTrackerHeader,
	historyToPreviewLines,
} from '@/store/trackerMappers';
import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { type Command } from '@/CommandHistory/common';
import { DelayCharacterCommand } from '@/CommandHistory/Commands/DelayCharacterCommand';
import { EndTurnCommand } from '@/CommandHistory/Commands/EndTurnCommand';
import { FinalizeTurnAndAdvanceRoundCommand } from '@/CommandHistory/Commands/FinalizeTurnAndAdvanceRoundCommand';
import { FinalizeTurnAndReturnToInitiativeCommand } from '@/CommandHistory/Commands/FinalizeTurnAndReturnToInitiativeCommand';
import { KnockOutCharacterCommand } from '@/CommandHistory/Commands/KnockOutCharacterCommand';
import { TriggerReinforcementEventCommand } from '@/CommandHistory/Commands/TriggerReinforcementEventCommand';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { ReorderCharactersCommand } from '@/CommandHistory/Commands/ReorderCharactersCommand';
import { ChangeHealthCommand } from '@/CommandHistory/Commands/ChangeHealthCommand';
import { SetTempHealthCommand } from '@/CommandHistory/Commands/SetTempHealthCommand';
import { ReactivateCharacterCommand } from '@/CommandHistory/Commands/ReactivateCharacterCommand';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { Input } from '@/components/ui/input';
import { type SwipeAction } from './InitiativeActionCarouselCard';

function logTrackerButton(action: string, details?: Record<string, unknown>) {
	if (details) {
		console.log('[InitiativeTrackerPage]', action, details);

		return;
	}

	console.log('[InitiativeTrackerPage]', action);
}

const HAZARD_DISABLE_CHECK_NAMES = [
	'Disrupted',
	'Compromised',
	'Fracturing',
	'Critical',
	'Disabled',
] as const;

function getHealthLabelFromPercentage(healthPercentage: number) {
	if (healthPercentage <= 0) {
		return 'Unconscious';
	}

	if (healthPercentage >= 100) {
		return 'Uninjured';
	}

	if (healthPercentage >= 85) {
		return 'Barely Injured';
	}

	if (healthPercentage >= 65) {
		return 'Injured';
	}

	if (healthPercentage >= 35) {
		return 'Badly Injured';
	}

	return 'Near Death';
	}

function getHazardDisableStageNames(requiredChecks: number) {
	const clampedRequiredChecks = Math.min(Math.max(requiredChecks, 1), 5);

	if (clampedRequiredChecks === 5) {
		return [...HAZARD_DISABLE_CHECK_NAMES];
	}

	if (clampedRequiredChecks === 4) {
		return [
			HAZARD_DISABLE_CHECK_NAMES[0],
			HAZARD_DISABLE_CHECK_NAMES[1],
			HAZARD_DISABLE_CHECK_NAMES[3],
			HAZARD_DISABLE_CHECK_NAMES[4],
		];
	}

	if (clampedRequiredChecks === 3) {
		return [
			HAZARD_DISABLE_CHECK_NAMES[0],
			HAZARD_DISABLE_CHECK_NAMES[2],
			HAZARD_DISABLE_CHECK_NAMES[4],
		];
	}

	if (clampedRequiredChecks === 2) {
		return [HAZARD_DISABLE_CHECK_NAMES[0], HAZARD_DISABLE_CHECK_NAMES[4]];
	}

	return [HAZARD_DISABLE_CHECK_NAMES[4]];
}

function getHazardDisableLabel(participant: TrackerParticipant) {
	const requiredChecks = participant.disableChecksRequired ?? 5;
	const successfulChecks = participant.disableChecksSucceeded ?? 0;

	if (successfulChecks <= 0) {
		return 'Stable';
	}

	const stageNames = getHazardDisableStageNames(requiredChecks);
	const stageIndex = Math.min(Math.max(successfulChecks, 1), requiredChecks) - 1;

	return stageNames[Math.min(stageIndex, stageNames.length - 1)] ?? 'Disabled';
}

function getParticipantIndicatorLabel(participant: TrackerParticipant) {
	if (participant.role === 'hazard') {
		return getHazardDisableLabel(participant);
	}

	if (typeof participant.maxHp !== 'number' || typeof participant.currentHp !== 'number') {
		return 'No HP Data';
	}

	const maxHp = participant.maxHp ?? 1;
	const currentHp = participant.currentHp ?? maxHp;
	const healthPercentage = (currentHp / maxHp) * 100;

	return getHealthLabelFromPercentage(healthPercentage);
}

function getParticipantRoleLabel(participant: TrackerParticipant) {
	if (participant.role === 'neutral') {
		return 'Other';
	}

	if (participant.role === 'opponent') {
		return 'Opponents';
	}

	if (participant.role === 'pc') {
		return 'PCs';
	}

	if (participant.role === 'ally') {
		return 'Allies';
	}

	if (participant.role === 'hazard') {
		return 'Hazard';
	}

	if (participant.role === 'reinforcement') {
		return 'Reinforcement';
	}

	return participant.role;
}

function getDcName(dc: NonNullable<TrackerParticipant['dcs']>[number]) {
	return dc.name ?? dc.inline ?? 'DC';
}

type SideTheme = 'pc' | 'opponent' | 'ally' | 'other';

function resolveParticipantSideTheme(participant: TrackerParticipant): SideTheme {
	if (participant.sideTheme === 'pc') {
		return 'pc';
	}

	if (participant.sideTheme === 'ally') {
		return 'ally';
	}

	if (participant.sideTheme === 'other' || participant.sideTheme === 'neutral') {
		return 'other';
	}

	if (participant.sideTheme === 'opponent') {
		return 'opponent';
	}

	if (participant.role === 'pc') {
		return 'pc';
	}

	if (participant.role === 'ally') {
		return 'ally';
	}

	if (participant.role === 'neutral') {
		return 'other';
	}

	return 'opponent';
}

function getSideAccent(sideTheme: SideTheme) {
	switch (sideTheme) {
		case 'pc':
			return {
				badge: 'bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-sky-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-sky-400',
				name: 'text-sky-200',
				activeCard:
					'border-sky-300 bg-sky-600 text-sky-50 shadow-lg shadow-sky-950/30',
				delayedCard: 'border-sky-500/50 bg-sky-500/10 text-sky-200',
			};

		case 'opponent':
			return {
				badge: 'bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-rose-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-rose-400',
				name: 'text-rose-200',
				activeCard:
					'border-rose-300 bg-rose-700 text-rose-50 shadow-lg shadow-rose-950/30',
				delayedCard: 'border-rose-500/50 bg-rose-500/10 text-rose-200',
			};

		case 'other':
			return {
				badge: 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-violet-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-violet-400',
				name: 'text-violet-200',
				activeCard:
					'border-violet-300 bg-violet-700 text-violet-50 shadow-lg shadow-violet-950/30',
				delayedCard: 'border-violet-500/50 bg-violet-500/10 text-violet-200',
			};

		case 'ally':

		default:
			return {
				badge: 'bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/40',
				inactiveCard: 'border-slate-800 bg-slate-950/95 text-slate-50 hover:border-emerald-500/60 hover:bg-slate-900/95',
				inactiveMarker: 'border-l-4 border-l-emerald-400',
				name: 'text-emerald-200',
				activeCard:
					'border-emerald-300 bg-emerald-600 text-emerald-50 shadow-lg shadow-emerald-950/30',
				delayedCard: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200',
			};
	}
}

function getParticipantAccent(participant: TrackerParticipant) {
	const sideTheme = resolveParticipantSideTheme(participant);
	const baseAccent = getSideAccent(sideTheme);

	if (participant.role !== 'hazard') {
		return baseAccent;
	}

	const hazardStripeBySide: Record<SideTheme, string> = {
		pc: 'bg-[repeating-linear-gradient(135deg,rgba(56,189,248,0.14)_0_6px,rgba(56,189,248,0)_6px_12px)]',
		opponent:
			'bg-[repeating-linear-gradient(135deg,rgba(251,113,133,0.14)_0_6px,rgba(251,113,133,0)_6px_12px)]',
		ally:
			'bg-[repeating-linear-gradient(135deg,rgba(52,211,153,0.14)_0_6px,rgba(52,211,153,0)_6px_12px)]',
		other:
			'bg-[repeating-linear-gradient(135deg,rgba(167,139,250,0.14)_0_6px,rgba(167,139,250,0)_6px_12px)]',
	};

	const hazardStripe = hazardStripeBySide[sideTheme];

	return {
		...baseAccent,
		inactiveCard: `${baseAccent.inactiveCard} ${hazardStripe}`,
		activeCard: `${baseAccent.activeCard} ${hazardStripe}`,
		delayedCard: `${baseAccent.delayedCard} ${hazardStripe}`,
	};
}

function ParticipantRow({
	participant,
	onSelect,
	selected,
	actionSlot,
}: {
	participant: TrackerParticipant;
	onSelect: (id: string) => void;
	selected: boolean;
	actionSlot?: React.ReactNode;
}) {
	const indicatorLabel = getParticipantIndicatorLabel(participant);

	return (
		<button
			type="button"
			onClick={() => {
				logTrackerButton('Participant row selected', {
					participantId: participant.id,
					participantName: participant.name,
				});
				onSelect(participant.id);
			}}
			className={[
				'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
				selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent',
			].join(' ')}
		>
			<div>
				<p className="text-sm font-semibold">{participant.name}</p>
				<p className="text-xs text-muted-foreground">
					{participant.state}
					{typeof participant.initiative === 'number'
						? ` | Init ${participant.initiative}`
						: ''}
				</p>
				<div className="mt-1 flex flex-wrap gap-1">
					{typeof participant.initiativeBonus === 'number' && (
						<Badge variant="outline" className="text-[10px]">
							Init +{participant.initiativeBonus}
						</Badge>
					)}
					{typeof participant.hardness === 'number' && (
						<Badge variant="outline" className="text-[10px]">
							Hardness {participant.hardness}
						</Badge>
					)}
					{(participant.dcs?.length ?? 0) > 0 && (
						<Badge variant="outline" className="text-[10px]">
							{participant.dcs?.length} DCs
						</Badge>
					)}
				</div>
			</div>
			<div className="flex items-center gap-2">
				<Badge variant="secondary">{indicatorLabel}</Badge>
				{actionSlot}
			</div>
		</button>
	);
}

type ParticipantDetailsProps = {
	participant: TrackerParticipant | null;
	onHeal?: (amount: number) => void;
	onDamage?: (amount: number) => void;
	onSetTempHp?: (amount: number, description: string) => void;
};

function ParticipantDetails({ participant, onHeal, onDamage, onSetTempHp }: ParticipantDetailsProps) {
	const [hpAmount, setHpAmount] = useState('');
	const [tempHpAmount, setTempHpAmount] = useState('');
	const [tempHpDescription, setTempHpDescription] = useState('');

	if (!participant) {
		return (
			<div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
				Select a participant trigger to view details here.
			</div>
		);
	}

	const indicatorLabel = getParticipantIndicatorLabel(participant);
	const isHazard = participant.role === 'hazard';
	const showHpControls = (onHeal || onDamage || onSetTempHp);
	const hasHpData = typeof participant.currentHp === 'number' && typeof participant.maxHp === 'number';

	const handleHeal = () => {
		const amount = parseInt(hpAmount, 10);

		if (!Number.isFinite(amount) || amount <= 0) return;
		onHeal?.(amount);
		setHpAmount('');
	};

	const handleDamage = () => {
		const amount = parseInt(hpAmount, 10);

		if (!Number.isFinite(amount) || amount <= 0) return;
		onDamage?.(amount);
		setHpAmount('');
	};

	const handleSetTempHp = () => {
		const amount = parseInt(tempHpAmount, 10);

		if (!Number.isFinite(amount) || amount < 0) return;
		onSetTempHp?.(amount, tempHpDescription);
		setTempHpAmount('');
		setTempHpDescription('');
	};

	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<h3 className="text-lg font-semibold">{participant.name}</h3>
				<Badge>{getParticipantRoleLabel(participant)}</Badge>
				<Badge variant="secondary">{participant.state}</Badge>
			</div>
			{isHazard && (
				<p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
					<ShieldOff className="h-4 w-4" /> {indicatorLabel}
				</p>
			)}
			{hasHpData && (<>
				<p className="text-sm text-muted-foreground">
					Health:{' '} 
					<span className="text-foreground">
						{participant.currentHp} / {participant.maxHp}
						{(participant.tempHp ?? 0) > 0 && (
							<span className="ml-1 text-sky-400"> +{participant.tempHp} temp</span>
						)}
						<span className="ml-1 text-muted-foreground">({indicatorLabel})</span>
					</span>
				</p>
				{typeof participant.hardness === 'number' && (
					<p className="text-sm text-muted-foreground">
						Hardness: <span className="text-foreground">{participant.hardness}</span>
					</p>
				)}
				</>
			)}
			{(participant.tempHp ?? 0) > 0 && participant.tempHpDescription && (
				<p className="text-xs text-muted-foreground">
					Temp HP source: <span className="text-foreground">{participant.tempHpDescription}</span>
				</p>
			)}
			{showHpControls && hasHpData && (
				<div className="space-y-2 rounded-md border p-3">
					<h4 className="text-sm font-medium">HP</h4>
					<div className="flex gap-2">
						<Input
							type="number"
							min={1}
							placeholder="Amount"
							value={hpAmount}
							onChange={(e) => setHpAmount(e.target.value)}
							className="h-8 text-sm"
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleHeal();
							}}
						/>
						<Button size="sm" variant="outline" className="shrink-0 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" onClick={handleHeal}>
							Heal
						</Button>
						<Button size="sm" variant="outline" className="shrink-0 border-rose-500/50 text-rose-400 hover:bg-rose-500/10" onClick={handleDamage}>
							Damage
						</Button>
					</div>
					<div className="space-y-1.5">
						<div className="flex gap-2">
							<Input
								type="number"
								min={0}
								placeholder="Temp HP"
								value={tempHpAmount}
								onChange={(e) => setTempHpAmount(e.target.value)}
								className="h-8 text-sm"
							/>
							<Input
								placeholder="Source / duration"
								value={tempHpDescription}
								onChange={(e) => setTempHpDescription(e.target.value)}
								className="h-8 text-sm"
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleSetTempHp();
								}}
							/>
						</div>
						<Button size="sm" variant="outline" className="w-full border-sky-500/50 text-sky-400 hover:bg-sky-500/10" onClick={handleSetTempHp}>
							Set Temp HP
						</Button>
					</div>
				</div>
			)}
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{typeof participant.initiative === 'number' && (
					<p className="text-sm text-muted-foreground">
						Initiative: <span className="text-foreground">{participant.initiative}</span>
					</p>
				)}
				{typeof participant.initiativeBonus === 'number' && (
					<p className="text-sm text-muted-foreground">
						Initiative Bonus:{' '}
						<span className="text-foreground">+{participant.initiativeBonus}</span>
					</p>
				)}
				{typeof participant.adjustmentLevelModifier === 'number' && (
					<p className="text-sm text-muted-foreground">
						Custom Level Modifier:{' '}
						<span className="text-foreground">{participant.adjustmentLevelModifier}</span>
					</p>
				)}
			</div>
			{participant.adjustmentDescription && (
				<p className="text-sm text-muted-foreground">
					Adjustment Notes: <span className="text-foreground">{participant.adjustmentDescription}</span>
				</p>
			)}
			{(participant.dcs?.length ?? 0) > 0 && (
				<div className="space-y-2 rounded-md border p-3">
					<h4 className="text-sm font-medium">DCs</h4>
					{participant.dcs?.map((dc, index) => (
						<div key={`${participant.id}-dc-${index}`} className="rounded-md border p-2 text-sm">
							<p className="font-medium">
								{getDcName(dc)}: {dc.value}
							</p>
							<p className="text-xs text-muted-foreground">
								{dc.icon ? `Icon: ${dc.icon}` : 'No icon'}
								{typeof dc.disableSuccesses === 'number'
									? ` | Disable successes: ${dc.disableSuccesses}`
									: ''}
							</p>
						</div>
					))}
				</div>
			)}
			<p className="text-sm">{participant.notes}</p>
		</div>
	);
}

function TrackerDescriptionSections({
	sections,
}: {
	sections: Array<{ label: string; content: string }>;
}) {
	if (sections.length === 0) {
		return <p className="text-muted-foreground">No encounter notes available.</p>;
	}

	return (
		<div className="space-y-4">
			{sections.map((section) => (
				<section key={section.label} className="space-y-1">
					<h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
						{section.label}
					</h3>
					<p className="whitespace-pre-wrap">{section.content}</p>
				</section>
			))}
		</div>
	);
}

function NextRoundMarkerCard({
	nextRound,
	compact = false,
}: {
	nextRound: number;
	compact?: boolean;
}) {
	return (
		<div
			className={[
				'flex w-full min-w-0 items-center justify-center rounded-xl text-center',
				compact ? 'h-full min-h-0 px-3 py-4' : 'min-h-15 px-4 py-4',
			].join(' ')}
		>
			<div className="space-y-1">
				<p className="text-xs font-medium uppercase tracking-[0.24em] text-primary/80">
					Next Round
				</p>
				<p className="text-xl font-semibold tabular-nums text-primary">{nextRound}</p>
			</div>
		</div>
	);
}

function DelayedMarkerCard({
	participant,
	compact = false,
}: {
	participant: TrackerParticipant;
	compact?: boolean;
}) {
	const sideTheme = resolveParticipantSideTheme(participant);
	const theme = {
		pc: {
			line: 'border-sky-400/70',
			label: 'text-sky-200',
		},
		opponent: {
			line: 'border-rose-400/70',
			label: 'text-rose-200',
		},
		ally: {
			line: 'border-emerald-400/70',
			label: 'text-emerald-200',
		},
		other: {
			line: 'border-violet-400/70',
			label: 'text-violet-200',
		},
	}[sideTheme];

	return (
		<div
			className={[
				'relative flex w-full min-w-0 items-center rounded-md bg-transparent',
				compact ? 'h-full min-h-0 px-1' : 'h-full min-h-0 px-1',
			].join(' ')}
		>
			<div
				className={[
					'absolute left-0 right-0 top-4/7 -translate-y-1/2 border-t border-dashed',
					theme.line,
				].join(' ')}
			/>
			<p className={['relative truncate bg-background px-2 text-left text-xs font-medium', theme.label].join(' ')}>
				{participant.name} is delaying
			</p>
		</div>
	);
}

function getRoundBoundaryIndex(
	participants: TrackerParticipant[],
	charactersWithTurn: Set<string>
) {
	return participants.filter(
		(participant) =>
			participant.state !== 'delayed' && charactersWithTurn.has(participant.id)
	).length;
}

type InitiativeCarouselItemData =
	| {
		key: string;
		type: 'marker';
	}
	| {
		key: string;
		type: 'participant';
		participant: TrackerParticipant;
	};

function buildInitiativeCarouselItems(
	participants: TrackerParticipant[],
	markerIndex: number,
	nextRound: number
): InitiativeCarouselItemData[] {
	if (participants.length === 0) {
		return [];
	}

	const clampedMarkerIndex = Math.min(
		Math.max(markerIndex, 0),
		participants.length
	);
	const items: InitiativeCarouselItemData[] = [];

	participants.forEach((participant, index) => {
		if (index === clampedMarkerIndex) {
			items.push({
				key: `next-round-marker-${nextRound}`,
				type: 'marker',
			});
		}

		items.push({
			key: participant.id,
			type: 'participant',
			participant,
		});
	});

	if (clampedMarkerIndex === participants.length) {
		items.push({
			key: `next-round-marker-${nextRound}`,
			type: 'marker',
		});
	}

	return items;
}

type RoundAnnouncementState = {
	round: number;
	focusCurrentOnClose: boolean;
};

export function InitiativeTrackerPage() {
	const { executeCommand, undo, redo, canUndo, canRedo } =
		useContext(CommandHistoryContext);
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);
	const delayedOrder = useEncounterStore((state) => state.delayedOrder);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const charactersWithTurn = useEncounterStore((state) => state.charactersWithTurn);
	const trackerMetaMap = useEncounterStore((state) => state.trackerMetaMap);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const round = useEncounterStore((state) => state.round);
	const history = useEncounterStore((state) => state.history);

	const storeInitiativeParticipants = useMemo(
		() => runtimeToInitiativeQueue({ charactersOrder, delayedOrder, charactersMap, trackerMetaMap }),
		[charactersOrder, delayedOrder, charactersMap, trackerMetaMap]
	);

	const storeAllInitiativeParticipants = useMemo(
		() => runtimeToInitiativeQueueWithPending({ charactersOrder, delayedOrder, charactersMap, trackerMetaMap }),
		[charactersOrder, delayedOrder, charactersMap, trackerMetaMap]
	);

	const outOfInitiative = useMemo(
		() => runtimeToOutOfInitiativeData({ charactersOrder, delayedOrder, charactersMap, trackerMetaMap, encounterData, partyLevel }),
		[charactersOrder, delayedOrder, charactersMap, trackerMetaMap, encounterData, partyLevel]
	);

	const trackerHeader = useMemo(
		() => encounterData ? encounterToTrackerHeader(encounterData, partyLevel, round) : null,
		[encounterData, partyLevel, round]
	);

	const timeline = useMemo(
		() => narrativeSlotsToTimeline(encounterData?.narrativeSlots),
		[encounterData]
	);

	const triggeredReinforcementSlotIds = useMemo(
		() =>
			new Set(
				Object.values(trackerMetaMap)
					.filter((meta) => meta.reinforcementSlotId && meta.reinforcementPending !== true)
					.filter((meta) => meta.reinforcementSlotId && meta.reinforcementPending !== true)
					.map((meta) => meta.reinforcementSlotId)
					.filter((slotId): slotId is string => Boolean(slotId))
			),
		[trackerMetaMap]
	);

	const pendingReinforcementParticipants = useMemo(
		() =>
			outOfInitiative.reinforcements.filter(
				(participant) =>
					participant.eventId && !triggeredReinforcementSlotIds.has(participant.eventId)
			),
		[outOfInitiative.reinforcements, triggeredReinforcementSlotIds]
	);

	const reinforcementEvents = useMemo(
		() =>
			(encounterData?.narrativeSlots ?? []).filter(
				(slot) => slot.type === 'reinforcement'
			),
		[encounterData]
	);

	const historyPreview = useMemo(() => historyToPreviewLines(history), [history]);

	const [initiativeCarouselApi, setInitiativeCarouselApi] = useState<CarouselApi>();
	const initiativeParticipants = storeInitiativeParticipants;
	const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(
		storeInitiativeParticipants[0]?.id ?? null
	);
	const [reorderOpen, setReorderOpen] = useState(false);
	const [nextRoundAnnouncement, setNextRoundAnnouncement] =
		useState<RoundAnnouncementState | null>(null);
	const [pinnedMarkerRound, setPinnedMarkerRound] = useState<number | null>(null);
	type ReturnPromptState = {
		participantId: string;
		action: 'end-turn' | 'delay' | 'ko';
		focusCurrentOnSuccess: boolean;
	};
	const [returnPrompt, setReturnPrompt] = useState<ReturnPromptState | null>(null);
	const [reorderDraftParticipants, setReorderDraftParticipants] = useState<TrackerParticipant[]>(
		storeInitiativeParticipants
	);
	const currentInitiativeParticipantId = charactersOrder[0] ?? null;
	const nextTurnTimeoutRef = useRef<number | null>(null);
	const reorderScrollContainerRef = useRef<HTMLDivElement | null>(null);
	const reorderAutoScrollVelocityRef = useRef(0);
	const reorderAutoScrollFrameRef = useRef<number | null>(null);
	const delayedSectionParticipants = outOfInitiative.delayed;
	const hasReinforcements = pendingReinforcementParticipants.length > 0;
	const hasDelayed = delayedSectionParticipants.length > 0;
	const hasHazards = outOfInitiative.hazards.length > 0;
	const hasOutOfInitiativePanel = hasReinforcements || hasDelayed || hasHazards;
	const hasNarrativeEvents = (trackerHeader?.narrativeDetails?.length ?? 0) > 0;
	const outOfInitiativePanelDefault = hasReinforcements
		? 'reinforcements'
		: hasDelayed
		? 'delaying'
		: 'hazards';
	const activeRoundBoundaryIndex = useMemo(
		() => getRoundBoundaryIndex(initiativeParticipants, charactersWithTurn),
		[initiativeParticipants, charactersWithTurn]
	);

	useEffect(() => {
		return () => {
			if (nextTurnTimeoutRef.current !== null) {
				window.clearTimeout(nextTurnTimeoutRef.current);
			}

			if (reorderAutoScrollFrameRef.current !== null) {
				window.cancelAnimationFrame(reorderAutoScrollFrameRef.current);
				reorderAutoScrollFrameRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		if (!reorderOpen) {
			return;
		}

		setReorderDraftParticipants(storeAllInitiativeParticipants);
	}, [storeAllInitiativeParticipants, reorderOpen]);

	const focusCurrentParticipant = () => {
		if (!initiativeCarouselApi) {
			logTrackerButton('Focus Current attempted before carousel API ready');

			return;
		}

		initiativeCarouselApi.scrollTo(0);
		logTrackerButton('Focus Current scrolled to top initiative element');
	};

	const queueFocusCurrentParticipant = () => {
		if (nextTurnTimeoutRef.current !== null) {
			window.clearTimeout(nextTurnTimeoutRef.current);
		}

		nextTurnTimeoutRef.current = window.setTimeout(() => {
			focusCurrentParticipant();
			nextTurnTimeoutRef.current = null;
		}, 20);
	};

	const handleNextRoundAnnouncementChange = (open: boolean) => {
		if (open || nextRoundAnnouncement === null) {
			return;
		}

		const announcement = nextRoundAnnouncement;

		setNextRoundAnnouncement(null);
		logTrackerButton('Next Round announcement closed', {
			round: announcement.round,
		});

		if (announcement.focusCurrentOnClose) {
			queueFocusCurrentParticipant();
		}
	};

	const clearPinnedMarkerForCurrentRound = () => {
		if (pinnedMarkerRound === round) {
			setPinnedMarkerRound(null);
		}
	};

	const isFinalActiveParticipant = (participantId: string) =>
		activeRoundBoundaryIndex === 1 && charactersWithTurn.has(participantId);

	const isNextParticipantDelayed = () => {
		return charactersOrder.length > 1 && delayedOrder.includes(charactersOrder[1]);
	};
	const executeRoundAction = ({
		participantId,
		action,
		focusCurrentOnSuccess = false,
	}: {
		participantId: string;
		action: 'end-turn' | 'delay' | 'ko';
		focusCurrentOnSuccess?: boolean;
	}) => {
		clearPinnedMarkerForCurrentRound();

		const shouldReturnToInitiative = isNextParticipantDelayed();
		const shouldAdvanceRound = isFinalActiveParticipant(participantId);
		const returningParticipantId = charactersOrder[1];

		const command: Command =
			shouldAdvanceRound && shouldReturnToInitiative && returningParticipantId
				? new FinalizeTurnAndReturnToInitiativeCommand({
						activeUuid: participantId,
						returningUuid: returningParticipantId,
						action,
					})
				: shouldAdvanceRound
					? new FinalizeTurnAndAdvanceRoundCommand({
							uuid: participantId,
							action,
						})
					: shouldReturnToInitiative && returningParticipantId
						? new ReturnToInitiativeCommand({
								activeUuid: participantId,
								returningUuid: returningParticipantId,
								action,
							})
						: action === 'delay'
							? new DelayCharacterCommand({ uuid: participantId })
							: action === 'ko'
								? new KnockOutCharacterCommand({ uuid: participantId })
								: new EndTurnCommand({ uuid: participantId });

		try {
			executeCommand(command);

			if (shouldAdvanceRound) {
				const nextRoundState = getEncounterStore().getState();

				setPinnedMarkerRound(nextRoundState.round);
				setNextRoundAnnouncement({
					round: nextRoundState.round,
					focusCurrentOnClose: true,
				});
				logTrackerButton('Next Round announcement opened', {
					round: nextRoundState.round,
					action,
					participantId,
				});

				return;
			}

			if (focusCurrentOnSuccess) {
				queueFocusCurrentParticipant();
			}
		} catch (error) {
			console.error('Failed to progress turn', error);
		}
	};

	const handleNextTurn = () => {
		const currentParticipantId = charactersOrder[0];

		if (!currentParticipantId) {
			logTrackerButton('Next Turn ignored because initiative queue is empty');

			return;
		}

		// Auto-skip pending reinforcement participants — they are in the order but
		// shouldn't take a turn until their slot is triggered.
		const currentMeta = trackerMetaMap[currentParticipantId];

		if (currentMeta?.reinforcementPending === true) {
			logTrackerButton('Next Turn skipping pending reinforcement', {
				participantId: currentParticipantId,
			});

			try {
				const newOrder = charactersOrder
					.filter((id) => id !== currentParticipantId)
					.concat(currentParticipantId);

				executeCommand(new ReorderCharactersCommand({ newOrder }));
				queueFocusCurrentParticipant();
			} catch (error) {
				console.error('Failed to skip pending reinforcement', error);
			}

			return;
		}

		if (!charactersWithTurn.has(currentParticipantId)) {
			const currentCharacter = charactersMap[currentParticipantId];

			if (currentCharacter?.turnState === 'delayed') {
				logTrackerButton('Next Turn opening return-to-initiative prompt for delaying participant', {
					participantId: currentParticipantId,
				});
				setReturnPrompt({
					participantId: currentParticipantId,
					action: 'end-turn',
					focusCurrentOnSuccess: true,
				});

				return;
			}

			logTrackerButton('Next Turn ignored because current participant has no turn', {
				participantId: currentParticipantId,
			});

			return;
		}

		if (delayedSectionParticipants.length > 0) {
			logTrackerButton('Next Turn paused for return-to-initiative prompt', {
				participantId: currentParticipantId,
			});
			setReturnPrompt({
				participantId: currentParticipantId,
				action: 'end-turn',
				focusCurrentOnSuccess: true,
			});

			return;
		}

		executeRoundAction({
			participantId: currentParticipantId,
			action: 'end-turn',
			focusCurrentOnSuccess: true,
		});
		logTrackerButton('Next Turn rotation queued after focus animation');
	};

	const resetReorderDraft = () => {
		setReorderDraftParticipants(storeAllInitiativeParticipants);
	};

	const stopReorderAutoScroll = () => {
		reorderAutoScrollVelocityRef.current = 0;

		if (reorderAutoScrollFrameRef.current !== null) {
			window.cancelAnimationFrame(reorderAutoScrollFrameRef.current);
			reorderAutoScrollFrameRef.current = null;
		}
	};

	const stepReorderAutoScroll = () => {
		const container = reorderScrollContainerRef.current;
		const velocity = reorderAutoScrollVelocityRef.current;

		if (!container || velocity === 0) {
			reorderAutoScrollFrameRef.current = null;

			return;
		}

		container.scrollTop += velocity;
		reorderAutoScrollFrameRef.current = window.requestAnimationFrame(stepReorderAutoScroll);
	};

	const setReorderAutoScrollVelocity = (velocity: number) => {
		if (velocity === reorderAutoScrollVelocityRef.current) {
			return;
		}

		reorderAutoScrollVelocityRef.current = velocity;

		if (velocity === 0) {
			if (reorderAutoScrollFrameRef.current !== null) {
				window.cancelAnimationFrame(reorderAutoScrollFrameRef.current);
				reorderAutoScrollFrameRef.current = null;
			}

			return;
		}

		if (reorderAutoScrollFrameRef.current === null) {
			reorderAutoScrollFrameRef.current = window.requestAnimationFrame(stepReorderAutoScroll);
		}
	};

	const handleReorderDrag = (pointerY: number) => {
		const container = reorderScrollContainerRef.current;

		if (!container) {
			return;
		}

		const rect = container.getBoundingClientRect();
		const edgeThreshold = 72;
		const maxVelocity = 16;
		const distanceFromTop = pointerY - rect.top;
		const distanceFromBottom = rect.bottom - pointerY;

		if (distanceFromTop < edgeThreshold) {
			const topRatio = Math.max(0, distanceFromTop) / edgeThreshold;
			setReorderAutoScrollVelocity(-maxVelocity * (1 - topRatio));

			return;
		}

		if (distanceFromBottom < edgeThreshold) {
			const bottomRatio = Math.max(0, distanceFromBottom) / edgeThreshold;
			setReorderAutoScrollVelocity(maxVelocity * (1 - bottomRatio));

			return;
		}

		setReorderAutoScrollVelocity(0);
	};

	const hasReorderChanges = useMemo(() => {
		if (reorderDraftParticipants.length !== storeAllInitiativeParticipants.length) {
			return true;
		}

		return reorderDraftParticipants.some(
			(participant, index) => participant.id !== storeAllInitiativeParticipants[index]?.id
		);
	}, [reorderDraftParticipants, storeAllInitiativeParticipants]);

	const handleReorderSave = () => {
		const draftOrderedIds = reorderDraftParticipants.map((participant) => participant.id);
		const draftIdSet = new Set(draftOrderedIds);
		let reorderedVisibleIndex = 0;

		const newOrder = charactersOrder.map((participantId) => {
			if (!draftIdSet.has(participantId)) {
				return participantId;
			}

			const nextId = draftOrderedIds[reorderedVisibleIndex];
			reorderedVisibleIndex += 1;

			return nextId ?? participantId;
		});

		const orderDidChange = newOrder.some((participantId, index) => participantId !== charactersOrder[index]);

		if (!orderDidChange) {
			logTrackerButton('Manual reorder save ignored because order is unchanged');
			handleReorderOpenChange(false);

			return;
		}

		try {
			executeCommand(new ReorderCharactersCommand({ newOrder }));
			logTrackerButton('Manual reorder save applied', {
				newOrderLength: newOrder.length,
			});
			handleReorderOpenChange(false);
		} catch (error) {
			console.error('Failed to save manual reorder', error);
		}
	};

	const handleReorderOpenChange = (open: boolean) => {
		if (!open) {
			stopReorderAutoScroll();
			resetReorderDraft();
		}

		setReorderOpen(open);
	};

	const allParticipants = useMemo(
		() => [
			...initiativeParticipants,
			...outOfInitiative.reinforcements,
			...delayedSectionParticipants,
			...outOfInitiative.hazards,
		],
		[initiativeParticipants, outOfInitiative, delayedSectionParticipants]
	);

	useEffect(() => {
		if (allParticipants.length === 0) {
			if (selectedParticipantId !== null) {
				setSelectedParticipantId(null);
			}

			return;
		}

		const selectedStillExists = selectedParticipantId
			? allParticipants.some((participant) => participant.id === selectedParticipantId)
			: false;

		if (!selectedStillExists) {
			setSelectedParticipantId(allParticipants[0]?.id ?? null);
		}
	}, [allParticipants, selectedParticipantId]);

	const handleParticipantSwipeAction = (
		participantId: string,
		action: SwipeAction
	) => {
		if (action === 'reactivate') {
			try {
				executeCommand(new ReactivateCharacterCommand({ uuid: participantId }));
				queueFocusCurrentParticipant();
				logTrackerButton('Participant reactivated via swipe action', {
					participantId,
				});
			} catch (error) {
				console.error('Failed to reactivate participant', error);
			}

			return;
		}

		if (action === 'slay') {
			try {
				executeCommand(new RemoveCharacterCommand({ uuid: participantId }));
				logTrackerButton('Participant slain via swipe action', {
					participantId,
				});
			} catch (error) {
				console.error('Failed to slay participant', error);
			}

			return;
		}

		const isCurrentActive =
			participantId === currentInitiativeParticipantId &&
			charactersWithTurn.has(participantId);

		if (isCurrentActive && delayedSectionParticipants.length > 0) {
			logTrackerButton('Swipe action paused for return-to-initiative prompt', {
				participantId,
				action,
			});
			setReturnPrompt({
				participantId,
				action,
				focusCurrentOnSuccess: true,
			});

			return;
		}

		executeRoundAction({ participantId, action });
	};

	const handleReturnPromptSelect = (returningParticipantId: string) => {
		if (!returnPrompt) {
			return;
		}

		const { participantId, action } = returnPrompt;
		setReturnPrompt(null);
		clearPinnedMarkerForCurrentRound();

		try {
			executeCommand(
				new ReturnToInitiativeCommand({
					activeUuid: participantId,
					returningUuid: returningParticipantId,
					action,
				})
			);
			logTrackerButton('Return to initiative executed', {
				participantId,
				returningParticipantId,
				action,
			});
			queueFocusCurrentParticipant();
		} catch (error) {
			console.error('Failed to return to initiative', error);
		}
	};

	const handleReturnPromptSkip = () => {
		if (!returnPrompt) {
			return;
		}

		const { participantId, action, focusCurrentOnSuccess } = returnPrompt;
		setReturnPrompt(null);

		executeRoundAction({ participantId, action, focusCurrentOnSuccess });
		logTrackerButton('Return to initiative skipped, normal round action', {
			participantId,
			action,
		});
	};

	const triggerReinforcementEvent = (slotId: string) => {
		try {
			executeCommand(new TriggerReinforcementEventCommand({ slotId }));
			queueFocusCurrentParticipant();
			logTrackerButton('Reinforcement event triggered', { slotId });
		} catch (error) {
			console.error('Failed to trigger reinforcement event', error);
		}
	};

	const reinforcementEventsByRound = useMemo(
		() =>
			reinforcementEvents.reduce(
				(acc, slot) => {
					if (!acc[slot.trigger.round]) {
						acc[slot.trigger.round] = [];
					}

					acc[slot.trigger.round].push(slot);

					return acc;
				},
				{} as Record<number, typeof reinforcementEvents>
			),
		[reinforcementEvents]
	);

	const roundAnnouncementEvents = useMemo(() => {
		if (!nextRoundAnnouncement || !encounterData) {
			return [] as Array<{
				id: string;
				title: string;
				detail: string;
				type: 'default' | 'reinforcement' | 'ongoing';
				canTriggerReinforcement: boolean;
			}>;
		}

		return narrativeSlotsToTimeline(encounterData.narrativeSlots)
			.filter((event) => event.round === nextRoundAnnouncement.round)
			.map((event) => ({
				id: event.id ?? `${event.round}-${event.title}`,
				title: event.title,
				detail: event.detail,
				type: event.type ?? 'default',
				canTriggerReinforcement:
					event.type === 'reinforcement' &&
					typeof event.id === 'string' &&
					!triggeredReinforcementSlotIds.has(event.id),
			}));
	}, [encounterData, nextRoundAnnouncement, triggeredReinforcementSlotIds]);

	const selectedParticipant =
		allParticipants.find((p) => p.id === selectedParticipantId) ?? null;

	const handleSelectedHeal = selectedParticipantId
		? (amount: number) => {
				try {
					executeCommand(new ChangeHealthCommand({ uuid: selectedParticipantId, delta: amount }));
				} catch (error) {
					console.error('Failed to heal', error);
				}
			}
		: undefined;

	const handleSelectedDamage = selectedParticipantId
		? (amount: number) => {
				try {
					executeCommand(new ChangeHealthCommand({ uuid: selectedParticipantId, delta: -amount }));
				} catch (error) {
					console.error('Failed to apply damage', error);
				}
			}
		: undefined;

	const handleSelectedSetTempHp = selectedParticipantId
		? (amount: number, description: string) => {
				try {
					executeCommand(new SetTempHealthCommand({ uuid: selectedParticipantId, tempHealth: amount, description }));
				} catch (error) {
					console.error('Failed to set temp HP', error);
				}
			}
		: undefined;

	const nextRound = (trackerHeader?.currentRound ?? round) + 1;
	const nextRoundMarkerIndex =
		pinnedMarkerRound === round
			? initiativeParticipants.length
			: activeRoundBoundaryIndex;
	const initiativeCarouselItems = useMemo(
		() =>
			buildInitiativeCarouselItems(
				initiativeParticipants,
				nextRoundMarkerIndex,
				nextRound
			),
		[initiativeParticipants, nextRoundMarkerIndex, nextRound]
	);

	const timelineEvents = useMemo(
		() =>
			timeline.map((event) => {
				if (event.type !== 'reinforcement' || !event.id) {
					return {
						round: event.round,
						label: event.title,
						description: event.detail,
					};
				}

				const isTriggered = triggeredReinforcementSlotIds.has(event.id);
				const canTrigger = event.round <= round && !isTriggered;
				const participantCount =
					reinforcementEventsByRound[event.round]?.find((slot) => slot.id === event.id)
						?.participants?.length ?? 0;

				return {
					id: event.id,
					round: event.round,
					label: event.title,
					description:
						event.detail ||
						(participantCount > 0
							? `${participantCount} reinforcement participant${
								participantCount === 1 ? '' : 's'
							}`
							: undefined),
					actionLabel: isTriggered
						? 'Triggered'
						: canTrigger
							? 'Trigger Now'
							: undefined,
					actionDisabled: isTriggered,
					onAction: canTrigger
						? () => triggerReinforcementEvent(event.id as string)
						: undefined,
				};
			}),
		[timeline, triggeredReinforcementSlotIds, round, reinforcementEventsByRound]
	);

	return (
		<main className="mx-auto w-full max-w-7xl space-y-4 p-4 lg:p-6">
			<section className="hidden lg:grid lg:h-[calc(100vh-8rem)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:grid-rows-[auto_minmax(0,1fr)] lg:gap-4">
				<Card className="min-w-0 p-4 lg:col-span-2">
					<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
						<div className="min-w-0 space-y-3">
							<div className="flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Next Turn"
											variant="secondary"
											size="icon"
											onClick={() => {
												logTrackerButton('Next Turn button clicked');
												handleNextTurn();
											}}
										>
											<SkipForward className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Next Turn</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Focus Current"
											variant="secondary"
											size="icon"
											className="border border-sky-500/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
											onClick={() => {
												logTrackerButton('Focus Current button clicked');
												focusCurrentParticipant();
											}}
										>
											<History className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Focus Current</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="End Encounter"
											variant="secondary"
											size="icon"
											className="border border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
											onClick={() => logTrackerButton('End Encounter button clicked')}
										>
											<ArrowRight className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">End Encounter</TooltipContent>
								</Tooltip>
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											aria-label="Manual Reorder"
											size="icon"
											onClick={() => {
												logTrackerButton('Manual Reorder button clicked');
												setReorderOpen(true);
											}}
										>
											<ArrowUpDown className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Manual Reorder</TooltipContent>
								</Tooltip>
								<div className="inline-flex items-center overflow-hidden rounded-md border border-input">
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												aria-label="Undo"
												variant="ghost"
												size="icon"
												className="rounded-none border-0"
												disabled={!canUndo}
												onClick={() => {
													logTrackerButton('Undo button clicked');
													undo();
												}}
											>
												<Undo2 className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">Undo</TooltipContent>
									</Tooltip>
									<div className="h-6 w-px bg-border" />
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												aria-label="Redo"
												variant="ghost"
												size="icon"
												className="rounded-none border-0"
												disabled={!canRedo}
												onClick={() => {
													logTrackerButton('Redo button clicked');
													redo();
												}}
											>
												<Redo2 className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">Redo</TooltipContent>
									</Tooltip>
								</div>
							</div>
						</div>

						<div className="min-w-0 space-y-3 pl-4">
							<Timeline
								currentTurn={trackerHeader?.currentRound ?? round}
								events={timelineEvents}
								futureTurns={5}
							/>
						</div>
					</div>
				</Card>

				<div className={['grid h-full min-h-0 min-w-0 gap-4', hasOutOfInitiativePanel ? 'lg:grid-rows-[minmax(0,2fr)_minmax(0,1fr)]' : 'lg:grid-rows-[minmax(0,1fr)]'].join(' ')}>
					<Card className="flex min-h-0 min-w-0 flex-col overflow-hidden gap-0 p-4">
						<div className="min-h-0 min-w-0 flex-1 overflow-hidden">
							<Carousel
								setApi={setInitiativeCarouselApi}
      							orientation="vertical"
								opts={{ align: "start", dragFree: true }}
								className="h-[calc(100%-3rem)] pt-4 mt-4"
							>
								<CarouselContent className="-mt-2 h-full pt-3 gap-1">
									{initiativeCarouselItems.map((item) => (
										<CarouselItem
											key={item.key}
											className={[
												'min-w-0 pt-2 -mb-3',
												item.type === 'marker'
													? 'basis-[2rem]'
													: item.participant.state === 'delayed'
														? 'basis-[2.5rem]'
														: 'basis-[5rem]',
											].join(' ')}
										>
											{item.type === 'marker' ? (
												<NextRoundMarkerCard nextRound={nextRound} />
											) : item.participant.state === 'delayed' ? (
												<DelayedMarkerCard
													participant={item.participant}
												/>
											) : (
												<InitiativeActionCarouselCard
													participant={item.participant}
													selected={item.participant.id === selectedParticipantId}
													onSelect={setSelectedParticipantId}
													isCurrent={item.participant.id === currentInitiativeParticipantId}
													onSwipeAction={handleParticipantSwipeAction}
													density="desktop"
													accent={getParticipantAccent(item.participant)}
													indicatorLabel={getParticipantIndicatorLabel(item.participant)}
													logAction={logTrackerButton}
												/>
											)}
										</CarouselItem>
									))}
								</CarouselContent>
								<CarouselPrevious />
								<CarouselNext
									className="-mb-4"
								/>
							</Carousel>
						</div>
					</Card>

					{hasOutOfInitiativePanel && (
					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<Tabs defaultValue={outOfInitiativePanelDefault} className="flex min-h-0 flex-1 flex-col">
							<TabsList className="w-full h-auto">
								{hasReinforcements && <TabsTrigger value="reinforcements" className="whitespace-normal">Reinforcements</TabsTrigger>}
								{hasDelayed && <TabsTrigger value="delaying" className="whitespace-normal">Delaying</TabsTrigger>}
								{hasHazards && <TabsTrigger value="hazards" className="whitespace-normal">Hazards</TabsTrigger>}
							</TabsList>
							{hasReinforcements && (
								<TabsContent value="reinforcements" className="mt-3 min-h-0 flex-1">
									<ScrollArea className="h-full pr-3">
										<div className="space-y-2">
											{pendingReinforcementParticipants.map((participant) => (
												<ParticipantRow
													key={participant.id}
													participant={participant}
													onSelect={setSelectedParticipantId}
													selected={participant.id === selectedParticipantId}
													actionSlot={
														participant.eventId ? (
															<Button
																type="button"
																size="sm"
																className="h-7 px-2 text-xs"
																onClick={(event) => {
																	event.stopPropagation();
																	triggerReinforcementEvent(participant.eventId as string);
																}}
															>
																Trigger
															</Button>
														) : undefined
													}
												/>
											))}
										</div>
									</ScrollArea>
								</TabsContent>
							)}
							{hasDelayed && (
								<TabsContent value="delaying" className="mt-3 min-h-0 flex-1">
									<ScrollArea className="h-full pr-3">
										<div className="space-y-2">
											{delayedSectionParticipants.map((participant) => (
												<ParticipantRow
													key={participant.id}
													participant={participant}
													onSelect={setSelectedParticipantId}
													selected={participant.id === selectedParticipantId}
													actionSlot={
														<Button
															size="sm"
															variant="destructive"
															onClick={(e) => {
																e.stopPropagation();
																handleParticipantSwipeAction(participant.id, 'ko');
															}}
														>
															K.O.
														</Button>
													}
												/>
											))}
										</div>
									</ScrollArea>
								</TabsContent>
							)}
							{hasHazards && (
								<TabsContent value="hazards" className="mt-3 min-h-0 flex-1">
									<ScrollArea className="h-full pr-3">
										<div className="space-y-2">
											{outOfInitiative.hazards.map((participant) => (
												<ParticipantRow
													key={participant.id}
													participant={participant}
													onSelect={setSelectedParticipantId}
													selected={participant.id === selectedParticipantId}
												/>
											))}
										</div>
									</ScrollArea>
								</TabsContent>
							)}
						</Tabs>
					</Card>
				)}
				</div>

				<div className="grid h-full min-h-0 min-w-0 gap-4 lg:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">

					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<Tabs defaultValue="description" className="flex min-h-0 flex-1 flex-col">
							<TabsList className="w-full h-auto">
								<TabsTrigger value="description" className="whitespace-normal">Description</TabsTrigger>
								{hasNarrativeEvents && <TabsTrigger value="events" className="whitespace-normal">Narrative Events</TabsTrigger>}
								<TabsTrigger value="history" className="whitespace-normal">Command History</TabsTrigger>
								<TabsTrigger value="stats" className="whitespace-normal">Turn Stats</TabsTrigger>
							</TabsList>
							<TabsContent value="description" className="mt-3 min-h-0 flex-1 text-sm">
								<ScrollArea className="h-full pr-3">
									<TrackerDescriptionSections
										sections={trackerHeader?.descriptionSections ?? []}
									/>
								</ScrollArea>
							</TabsContent>
							{hasNarrativeEvents && (
								<TabsContent value="events" className="mt-3 min-h-0 flex-1">
									<ScrollArea className="h-full pr-3">
										<ul className="space-y-2 text-sm">
											{(trackerHeader?.narrativeDetails ?? []).map((event) => (
												<li key={event} className="rounded-md border p-2">
													{event}
												</li>
											))}
										</ul>
									</ScrollArea>
								</TabsContent>
							)}
							<TabsContent value="history" className="mt-3 min-h-0 flex-1">
								<ScrollArea className="h-full pr-3">
									<ul className="space-y-2 text-sm">
										{historyPreview.map((entry, index) => (
											<li key={index} className="rounded-md border p-2">
												{entry}
											</li>
										))}
									</ul>
								</ScrollArea>
							</TabsContent>
							<TabsContent value="stats" className="mt-3 min-h-0 flex-1 text-sm">
								<ScrollArea className="h-full pr-3">
									<p>Average turn duration data will be connected in MVP.</p>
								</ScrollArea>
							</TabsContent>
						</Tabs>
					</Card>

					<Card className="flex min-h-0 min-w-0 flex-col p-4">
						<ScrollArea className="h-full pr-3">
							<ParticipantDetails
								participant={selectedParticipant}
								onHeal={handleSelectedHeal}
								onDamage={handleSelectedDamage}
								onSetTempHp={handleSelectedSetTempHp}
							/>
						</ScrollArea>
					</Card>
				</div>
			</section>

			<section className="space-y-4 lg:hidden">
				<Card className="p-4">
					<div className="flex items-start gap-3">
						<div className="min-w-0">
							<h2 className="text-base font-semibold break-words">
								{trackerHeader?.encounterTitle}
							</h2>
							<p className="text-sm text-muted-foreground">{trackerHeader?.threatLevel}</p>
						</div>
						<div className="ml-auto flex flex-col items-end gap-2">
							<div className="flex items-center gap-2">
								<Button
									aria-label="Next Turn"
									variant="secondary"
									size="icon"
									onClick={() => {
										logTrackerButton('Mobile Next Turn button clicked');
										handleNextTurn();
									}}
								>
									<SkipForward className="h-4 w-4" />
								</Button>
								<Button
									aria-label="Focus Current"
									variant="secondary"
									size="icon"
									className="border border-sky-500/50 bg-sky-500/15 text-sky-200 hover:bg-sky-500/25"
									onClick={() => {
										logTrackerButton('Focus Current button clicked');
										focusCurrentParticipant();
									}}
								>
									<History className="h-4 w-4" />
								</Button>
								<Button
									aria-label="End Encounter"
									variant="secondary"
									size="icon"
									className="border border-amber-500/50 bg-amber-500/15 text-amber-200 hover:bg-amber-500/25"
									onClick={() => logTrackerButton('End Encounter button clicked')}
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex items-right gap-2 pr-1">
								<Button
									aria-label="Manual Reorder"
									size="icon"
									onClick={() => {
										logTrackerButton('Mobile Reorder button clicked');
										setReorderOpen(true);
									}}
								>
									<ArrowUpDown className="h-4 w-4" />
								</Button>
								<div className="inline-flex items-center overflow-hidden rounded-md border border-input">
									<Button
										aria-label="Undo"
										variant="ghost"
										size="icon"
										className="rounded-none border-0"
										disabled={!canUndo}
										onClick={() => {
											logTrackerButton('Mobile Undo button clicked');
											undo();
										}}
									>
										<Undo2 className="h-4 w-4" />
									</Button>
									<div className="h-6 w-px bg-border" />
									<Button
										aria-label="Redo"
										variant="ghost"
										size="icon"
										className="rounded-none border-0"
										disabled={!canRedo}
										onClick={() => {
											logTrackerButton('Mobile Redo button clicked');
											redo();
										}}
									>
										<Redo2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
					</div>
				</Card>

				<Tabs defaultValue="carousel" className="space-y-3">
					<TabsList className="grid w-full">
						<TabsTrigger value="carousel">Horizontal Carousel</TabsTrigger>
						{hasOutOfInitiativePanel && <TabsTrigger value="inactive">Inactive Participants</TabsTrigger>}
					</TabsList>
					{hasOutOfInitiativePanel && (
						<TabsContent value="inactive" className="mt-0">
							<Card className="p-4">
								<Tabs defaultValue={outOfInitiativePanelDefault} className="space-y-3">
									<TabsList className="grid w-full h-auto">
										{hasReinforcements && <TabsTrigger value="reinforcements" className="whitespace-normal">Reinforcements</TabsTrigger>}
										{hasDelayed && <TabsTrigger value="delaying" className="whitespace-normal">Delaying</TabsTrigger>}
										{hasHazards && <TabsTrigger value="hazards">Simple Hazards</TabsTrigger>}
									</TabsList>
									{hasReinforcements && (
										<TabsContent value="reinforcements" className="mt-0">
											<div className="space-y-2">
												{pendingReinforcementParticipants.map((participant) => (
													<ParticipantRow
														key={participant.id}
														participant={participant}
														onSelect={setSelectedParticipantId}
														selected={participant.id === selectedParticipantId}
														actionSlot={
															participant.eventId ? (
																<Button
																	type="button"
																	size="sm"
																	className="h-7 px-2 text-xs"
																	onClick={(event) => {
																		event.stopPropagation();
																		triggerReinforcementEvent(participant.eventId as string);
																	}}
																>
																	Trigger
																</Button>
															) : undefined
														}
													/>
												))}
											</div>
										</TabsContent>
									)}
									{hasDelayed && (
										<TabsContent value="delaying" className="mt-0">
											<div className="space-y-2">
												{delayedSectionParticipants.map((participant) => (
													<ParticipantRow
														key={participant.id}
														participant={participant}
														onSelect={setSelectedParticipantId}
														selected={participant.id === selectedParticipantId}
														actionSlot={
															<Button
																size="sm"
																variant="destructive"
																onClick={(e) => {
																	e.stopPropagation();
																	handleParticipantSwipeAction(participant.id, 'ko');
																}}
															>
																K.O.
															</Button>
														}
													/>
												))}
											</div>
										</TabsContent>
									)}
									{hasHazards && (
										<TabsContent value="hazards" className="mt-0">
											<div className="space-y-2">
												{outOfInitiative.hazards.map((participant) => (
													<ParticipantRow
														key={participant.id}
														participant={participant}
														onSelect={setSelectedParticipantId}
														selected={participant.id === selectedParticipantId}
													/>
												))}
											</div>
										</TabsContent>
									)}
								</Tabs>
							</Card>
						</TabsContent>
					)}
					<TabsContent value="carousel" className="mt-0">
						<Card className="p-4">
							<Carousel
								opts={{ align: 'start', dragFree: true }}
								className="w-full"
							>
								<CarouselContent className="-ml-2 h-60 pl-1">
									{initiativeCarouselItems.map((item) => (
										<CarouselItem
											key={item.key}
											className={[
												item.type === 'marker'
													? 'h-full min-w-20 basis-[28%] pl-2'
													: item.participant.state === 'delayed'
														? 'h-full min-w-24 basis-[30%] pl-2'
														: 'h-full min-w-30 basis-[41%] pl-2',
											].join(' ')}
										>
											{item.type === 'marker' ? (
												<NextRoundMarkerCard nextRound={nextRound} compact />
											) : item.participant.state === 'delayed' ? (
												<DelayedMarkerCard
													participant={item.participant}
													compact
												/>
											) : (
												<InitiativeActionCarouselCard
													participant={item.participant}
													selected={item.participant.id === selectedParticipantId}
													onSelect={setSelectedParticipantId}
													isCurrent={item.participant.id === currentInitiativeParticipantId}
													onSwipeAction={handleParticipantSwipeAction}
													density="mobile"
													accent={getParticipantAccent(item.participant)}
													indicatorLabel={getParticipantIndicatorLabel(item.participant)}
													logAction={logTrackerButton}
												/>
											)}
										</CarouselItem>
									))}
								</CarouselContent>
							</Carousel>
						</Card>
					</TabsContent>
				</Tabs>

				<Tabs defaultValue="general" className="space-y-3">
					<TabsList className="w-full">
						<TabsTrigger value="general">General Info</TabsTrigger>
						<TabsTrigger value="selected">Selected Participant</TabsTrigger>
					</TabsList>
					<TabsContent value="general" className="mt-0">
						<Card className="p-4">
							<Tabs defaultValue="description" className="space-y-3">
								<TabsList className="w-full h-auto">
									<TabsTrigger value="description" className="whitespace-normal">Description</TabsTrigger>
									{hasNarrativeEvents && <TabsTrigger value="events" className="whitespace-normal">Narrative Events</TabsTrigger>}
									<TabsTrigger value="history" className="whitespace-normal">Command History</TabsTrigger>
									<TabsTrigger value="stats" className="whitespace-normal">Turn Stats</TabsTrigger>
								</TabsList>
								<TabsContent value="description" className="mt-0 text-sm">
										<TrackerDescriptionSections
											sections={trackerHeader?.descriptionSections ?? []}
										/>
								</TabsContent>
								{hasNarrativeEvents && (
									<TabsContent value="events" className="mt-0">
										<ul className="space-y-2 text-sm">
											{(trackerHeader?.narrativeDetails ?? []).map((event) => (
												<li key={event} className="rounded-md border p-2">
													{event}
												</li>
											))}
										</ul>
									</TabsContent>
								)}
								<TabsContent value="history" className="mt-0">
									<ul className="space-y-2 text-sm">
										{historyPreview.map((entry, index) => (
											<li key={index} className="rounded-md border p-2">
												{entry}
											</li>
										))}
									</ul>
								</TabsContent>
								<TabsContent value="stats" className="mt-0 text-sm">
									<p>Average turn duration data will be connected in MVP.</p>
								</TabsContent>
							</Tabs>
						</Card>
					</TabsContent>
					<TabsContent value="selected" className="mt-0">
						<Card className="p-4">
							<ParticipantDetails
								participant={selectedParticipant}
								onHeal={handleSelectedHeal}
								onDamage={handleSelectedDamage}
								onSetTempHp={handleSelectedSetTempHp}
							/>
						</Card>
					</TabsContent>
				</Tabs>
			</section>

			<Dialog
				open={nextRoundAnnouncement !== null}
				onOpenChange={handleNextRoundAnnouncementChange}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Round {nextRoundAnnouncement?.round}</DialogTitle>
						<DialogDescription>
							The next round is ready. Review this round's events before continuing.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						{roundAnnouncementEvents.length === 0 ? (
							<p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
								No events scheduled for this round.
							</p>
						) : (
							roundAnnouncementEvents.map((event) => (
								<div key={event.id} className="rounded-md border p-3">
									<div className="flex items-center justify-between gap-2">
										<p className="text-sm font-semibold">{event.title}</p>
										{event.canTriggerReinforcement && (
											<Button
												type="button"
												size="sm"
												onClick={() => triggerReinforcementEvent(event.id)}
											>
												Trigger Reinforcements
											</Button>
										)}
									</div>
									{event.detail && (
										<p className="mt-1 text-xs text-muted-foreground">{event.detail}</p>
									)}
								</div>
							))
						)}
					</div>
					<DialogFooter>
						<Button onClick={() => handleNextRoundAnnouncementChange(false)}>
							Continue
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={returnPrompt !== null} onOpenChange={(open) => { if (!open) handleReturnPromptSkip(); }}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>Return to Initiative?</DialogTitle>
						<DialogDescription>
							Before ending this turn, does any delayed participant want to return to initiative?
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-2">
						{delayedSectionParticipants.map((participant) => (
							<div key={participant.id} className="flex items-center justify-between gap-2 rounded-md border p-3">
								<p className="text-sm font-semibold">{participant.name}</p>
								<Button
									size="sm"
									onClick={() => handleReturnPromptSelect(participant.id)}
								>
									Return
								</Button>
							</div>
						))}
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handleReturnPromptSkip}>
							Nobody returns
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={reorderOpen} onOpenChange={handleReorderOpenChange}>
				<DialogContent
					className={[
						'left-auto right-0 top-0 h-dvh w-full max-w-[92vw] translate-x-0 translate-y-0 rounded-none border-l p-0',
						'flex flex-col gap-0',
						'data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right',
						'sm:left-[50%] sm:right-auto sm:top-[50%] sm:h-auto sm:max-w-lg sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-lg sm:border sm:p-6',
						'sm:grid sm:gap-4 sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95 sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0',
					].join(' ')}
				>
					<DialogHeader className="border-b px-6 py-4 sm:border-0 sm:px-0 sm:py-0">
						<DialogTitle>Manual Reorder Draft</DialogTitle>
						<DialogDescription>
							Drag participants to set initiative order, then save to apply it.
						</DialogDescription>
					</DialogHeader>
					<div ref={reorderScrollContainerRef} className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-0 sm:py-0">
						<Reorder.Group
							axis="y"
							layoutScroll
							values={reorderDraftParticipants}
							onReorder={setReorderDraftParticipants}
							className="space-y-2"
						>
							{reorderDraftParticipants.map((participant) => (
								<Reorder.Item
									key={participant.id}
									value={participant}
									whileDrag={{ scale: 1.01 }}
									onDragStart={(_, info) => {
										handleReorderDrag(info.point.y);
									}}
									onDrag={(_, info) => {
										handleReorderDrag(info.point.y);
									}}
									onDragEnd={() => {
										stopReorderAutoScroll();
									}}
									className={[
										'cursor-grab rounded-md border p-2 text-sm active:cursor-grabbing',
										participant.state === 'pending-reinforcement'
											? 'border-dashed border-amber-500/40 bg-amber-500/5 text-amber-300 opacity-70'
											: '',
									].join(' ')}
								>
									<span>{participant.name}</span>
									{participant.state === 'pending-reinforcement' && (
										<span className="ml-2 text-xs text-amber-400/70">(pending reinforcement)</span>
									)}
								</Reorder.Item>
							))}
						</Reorder.Group>
					</div>
					<DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
						<Button
							variant="outline"
							onClick={() => {
								logTrackerButton('Manual reorder dialog cancel clicked');
								handleReorderOpenChange(false);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={!hasReorderChanges}
							onClick={() => {
								logTrackerButton('Manual reorder save clicked');
								handleReorderSave();
							}}
						>
							Save Order
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</main>
	);
}
