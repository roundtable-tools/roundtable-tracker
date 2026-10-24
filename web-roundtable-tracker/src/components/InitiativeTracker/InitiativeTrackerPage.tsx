import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
import { getTraitBadgeClassName } from '@/utils/traitColors';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import {
	ArrowRight,
	ArrowUpDown,
	EyeOff,
	Heart,
	History,
	Redo2,
	ShieldOff,
	SkipForward,
	Undo2,
} from 'lucide-react';
import { Reorder } from 'motion/react';
import { useNavigate } from '@tanstack/react-router';
import { InitiativeActionCarouselCard } from './InitiativeActionCarouselCard';
import { OpenPlayerViewButton } from './OpenPlayerViewButton';
import { EncounterTimerControls } from './EncounterTimerControls';
import { TurnStatsPanel } from './TurnStatsPanel';
import { ReturnToInitiativeNotice } from './ReturnToInitiativeNotice';
import { TakeOutNotice } from './TakeOutNotice';
import {
	damageDropsToZeroHp,
	disableProgressFillsChecks,
	getTakeOutEffectCommand,
	getTakeOutEffects,
	TAKE_OUT_EFFECT_SHORT_LABEL,
	TAKE_OUT_EFFECT_TEXT,
	type TakeOutEffect,
	withPrecedingCommand,
} from './takeOut';
import { ResumeTimerNotice } from './ResumeTimerNotice';
import { resumeTimer } from '@/store/encounterTimer';
import { getHazardStripe, getSideAccent } from './sideAccent';
import { NextRoundMarkerCard } from './NextRoundMarkerCard';
import { getRoundBoundaryIndex } from './roundBoundary';
import {
	asksToReturnFromDelay,
	closesRound,
	getRoundActionCommand,
	returnPromptEntries,
} from './roundActionCommand';
import {
	getEncounterStore,
	useEncounterStore,
} from '@/store/encounterRuntimeInstance';
import { hasFullDisableChecks } from '@/store/encounterRuntimeStore';
import {
	runtimeToInitiativeQueue,
	runtimeToOutOfInitiativeData,
	narrativeSlotsToTimeline,
	encounterToTrackerHeader,
	historyToPreviewLines,
	getHazardDisableLabel,
	getHealthLabelFromPercentage,
	getOutOfFightNames,
	getParticipantStateLabel,
	hasHpAndDisableProgress,
	showsDisableProgress,
	resolveParticipantSideTheme,
	type TrackerParticipant,
} from '@/store/trackerMappers';
import { orderWithPendingSpots } from '@/store/pendingReinforcements';
import { isDelaying } from '@/store/operations';
import { CommandHistoryContext } from '@/CommandHistory/CommandHistoryContext';
import { GiveAdditionalTurnCommand } from '@/CommandHistory/Commands/GiveAdditionalTurnCommand';
import { TriggerReinforcementEventCommand } from '@/CommandHistory/Commands/TriggerReinforcementEventCommand';
import { ReturnToInitiativeCommand } from '@/CommandHistory/Commands/ReturnToInitiativeCommand';
import { ReorderCharactersCommand } from '@/CommandHistory/Commands/ReorderCharactersCommand';
import { ChangeHealthCommand } from '@/CommandHistory/Commands/ChangeHealthCommand';
import { SetTempHealthCommand } from '@/CommandHistory/Commands/SetTempHealthCommand';
import { ReactivateCharacterCommand } from '@/CommandHistory/Commands/ReactivateCharacterCommand';
import { RemoveCharacterCommand } from '@/CommandHistory/Commands/RemoveCharacterCommand';
import { RecordDisableProgressCommand } from '@/CommandHistory/Commands/RecordDisableProgressCommand';
import { SetShownProgressCommand } from '@/CommandHistory/Commands/SetShownProgressCommand';
import { Input } from '@/components/ui/input';
import { type SwipeAction } from './InitiativeActionCarouselCard';
import { type Command } from '@/CommandHistory/common';

function hasDisableCount(participant: TrackerParticipant) {
	return (participant.disableChecksRequired ?? 0) > 0;
}

type DisableChange = { delta: number } | { value: number };

function DisableQuickActions({
	participant,
	onRecord,
}: {
	participant: TrackerParticipant;
	onRecord: (participantId: string, change: DisableChange) => void;
}) {
	if (!hasDisableCount(participant)) {
		return null;
	}

	const disabled = hasFullDisableChecks(participant);

	return (
		<>
			<Button
				type="button"
				size="sm"
				variant="outline"
				className="h-7 px-2 text-xs"
				title="Disable a Device: success"
				disabled={disabled}
				onClick={(event) => {
					event.stopPropagation();
					onRecord(participant.id, { delta: 1 });
				}}
			>
				+1
			</Button>
			<Button
				type="button"
				size="sm"
				variant="outline"
				className="h-7 px-2 text-xs"
				title="Disable a Device: critical success"
				disabled={disabled}
				onClick={(event) => {
					event.stopPropagation();
					onRecord(participant.id, { delta: 2 });
				}}
			>
				+2
			</Button>
		</>
	);
}

/**
 * K.O. / Disable buttons for a row outside the initiative carousel, one per
 * take-out effect; Reactivate and Slay / Destroy once it is out.
 */
function OutOfFightRowActions({
	participant,
	effects,
	onAction,
}: {
	participant: TrackerParticipant;
	effects: TakeOutEffect[];
	onAction: (
		participantId: string,
		action: SwipeAction,
		effect?: TakeOutEffect
	) => void;
}) {
	const names = getOutOfFightNames(participant);
	const act =
		(action: SwipeAction, effect?: TakeOutEffect) =>
		(event: React.MouseEvent) => {
			event.stopPropagation();
			onAction(participant.id, action, effect);
		};

	if (participant.state === 'knocked-out') {
		return (
			<>
				<Button
					type="button"
					size="sm"
					variant="outline"
					className="h-7 px-2 text-xs"
					title={`Reactivate ${participant.name}`}
					onClick={act('reactivate')}
				>
					Reactivate
				</Button>
				<Button
					type="button"
					size="sm"
					variant="destructive"
					className="h-7 px-2 text-xs"
					title={`${names.remove} ${participant.name}`}
					onClick={act('slay')}
				>
					{names.remove}
				</Button>
			</>
		);
	}

	const shortName = participant.role === 'hazard' ? 'Disable' : 'K.O.';

	return (effects.length > 0 ? effects : [undefined]).map((effect) => (
		<Button
			key={effect ?? 'none'}
			type="button"
			size="sm"
			variant="destructive"
			className="h-7 px-2 text-xs"
			title={`${names.takeOut} ${participant.name}${effect ? `: ${TAKE_OUT_EFFECT_TEXT[effect]}` : ''}`}
			onClick={act('ko', effect)}
		>
			{shortName}
			{effect && ` (${TAKE_OUT_EFFECT_SHORT_LABEL[effect]})`}
		</Button>
	));
}

function getParticipantIndicatorLabel(participant: TrackerParticipant) {
	if (showsDisableProgress(participant)) {
		return getHazardDisableLabel(participant);
	}

	if (
		typeof participant.maxHp !== 'number' ||
		typeof participant.currentHp !== 'number'
	) {
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

function getParticipantAccent(participant: TrackerParticipant) {
	const sideTheme = resolveParticipantSideTheme(participant);
	const baseAccent = getSideAccent(sideTheme);

	if (participant.role !== 'hazard') {
		return baseAccent;
	}

	const hazardStripe = getHazardStripe(sideTheme);

	return {
		...baseAccent,
		inactiveCard: `${baseAccent.inactiveCard} ${hazardStripe}`,
		activeCard: `${baseAccent.activeCard} ${hazardStripe}`,
		delayedCard: `${baseAccent.delayedCard} ${hazardStripe}`,
	};
}

const hasTraitBadges = (participant: TrackerParticipant) =>
	(participant.traits?.length ?? 0) > 0 ||
	participant.hiddenUntilFirstTurn === true ||
	participant.hiddenUntilArrival === true;

function TraitBadges({ participant }: { participant: TrackerParticipant }) {
	return (
		<>
			{participant.hiddenUntilArrival && (
				<Badge variant="outline" className="gap-1 text-[10px]">
					<EyeOff className="size-3" />
					Hidden until arrival
				</Badge>
			)}
			{participant.hiddenUntilFirstTurn && (
				<Badge variant="outline" className="gap-1 text-[10px]">
					<EyeOff className="size-3" />
					Hidden until first turn
				</Badge>
			)}
			{participant.traits?.map((trait, index) => (
				<Badge
					key={`${participant.id}-trait-${index}`}
					variant="outline"
					className={`text-[10px] ${getTraitBadgeClassName(trait)}`}
				>
					{trait}
				</Badge>
			))}
		</>
	);
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
				onSelect(participant.id);
			}}
			className={[
				'flex w-full items-center justify-between rounded-md border px-3 py-2 text-left transition-colors',
				selected
					? 'border-primary bg-primary/10'
					: 'border-border hover:bg-accent',
			].join(' ')}
		>
			<div>
				<p className="text-sm font-semibold">{participant.name}</p>
				<p className="text-xs text-muted-foreground">
					{getParticipantStateLabel(participant)}
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
					<TraitBadges participant={participant} />
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
	onGiveTurnBack?: () => void;
	onRecordDisableProgress?: (change: DisableChange) => void;
	onSetShownProgress?: (shownProgress: 'hp' | 'disable') => void;
};

function ParticipantDetails({
	participant,
	onHeal,
	onDamage,
	onSetTempHp,
	onGiveTurnBack,
	onRecordDisableProgress,
	onSetShownProgress,
}: ParticipantDetailsProps) {
	const [hpAmount, setHpAmount] = useState('');
	const [disableSuccesses, setDisableSuccesses] = useState('');
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
	const showHpControls = onHeal || onDamage || onSetTempHp;
	const hasHpData =
		typeof participant.currentHp === 'number' &&
		typeof participant.maxHp === 'number';

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

	const handleSetDisableSuccesses = () => {
		const value = parseInt(disableSuccesses, 10);

		if (!Number.isFinite(value) || value < 0) return;
		onRecordDisableProgress?.({ value });
		setDisableSuccesses('');
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
				<Badge variant="secondary">
					{getParticipantStateLabel(participant)}
				</Badge>
			</div>
			{hasTraitBadges(participant) && (
				<div className="flex flex-wrap gap-1">
					<TraitBadges participant={participant} />
				</div>
			)}
			{onSetShownProgress && hasHpAndDisableProgress(participant) && (
				<div className="flex items-center justify-between gap-2 rounded-md border p-3">
					<p className="text-sm text-muted-foreground">
						Shown in the list and to players
					</p>
					<div
						role="group"
						aria-label="Shown progress"
						className="flex shrink-0 gap-1"
					>
						{(
							[
								['hp', 'HP', Heart],
								['disable', 'Disable checks', ShieldOff],
							] as const
						).map(([value, label, Icon]) => {
							const pressed =
								showsDisableProgress(participant) === (value === 'disable');

							return (
								<Button
									key={value}
									size="sm"
									variant={pressed ? 'secondary' : 'outline'}
									aria-pressed={pressed}
									onClick={() => {
										if (!pressed) onSetShownProgress(value);
									}}
								>
									<Icon className="h-4 w-4" /> {label}
								</Button>
							);
						})}
					</div>
				</div>
			)}
			{onGiveTurnBack && (
				<div className="flex items-center justify-between gap-2 rounded-md border p-3">
					<p className="text-sm text-muted-foreground">
						Already acted this round.
					</p>
					<Button
						size="sm"
						variant="outline"
						className="shrink-0"
						onClick={onGiveTurnBack}
					>
						Give Turn Back
					</Button>
				</div>
			)}
			{(isHazard || hasDisableCount(participant)) && (
				<p className="inline-flex items-center gap-1 text-sm text-muted-foreground">
					<ShieldOff className="h-4 w-4" /> {getHazardDisableLabel(participant)}
					{hasDisableCount(participant) && (
						<span className="ml-1">
							({participant.disableChecksSucceeded ?? 0} /{' '}
							{participant.disableChecksRequired} successes)
						</span>
					)}
				</p>
			)}
			{onRecordDisableProgress && hasDisableCount(participant) && (
				<div className="space-y-2 rounded-md border p-3">
					<h4 className="text-sm font-medium">Disable a Device</h4>
					<div className="flex gap-2">
						<Button
							size="sm"
							variant="outline"
							className="flex-1"
							disabled={hasFullDisableChecks(participant)}
							onClick={() => onRecordDisableProgress({ delta: 1 })}
						>
							Success +1
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="flex-1"
							disabled={hasFullDisableChecks(participant)}
							onClick={() => onRecordDisableProgress({ delta: 2 })}
						>
							Critical +2
						</Button>
					</div>
					<div className="flex gap-2">
						<Input
							type="number"
							min={0}
							max={participant.disableChecksRequired}
							placeholder="Successes"
							value={disableSuccesses}
							onChange={(e) => setDisableSuccesses(e.target.value)}
							className="h-8 text-sm"
							onKeyDown={(e) => {
								if (e.key === 'Enter') handleSetDisableSuccesses();
							}}
						/>
						<Button
							size="sm"
							variant="outline"
							className="shrink-0"
							onClick={handleSetDisableSuccesses}
						>
							Set
						</Button>
					</div>
				</div>
			)}
			{hasHpData && (
				<>
					<p className="text-sm text-muted-foreground">
						Health:{' '}
						<span className="text-foreground">
							{participant.currentHp} / {participant.maxHp}
							{(participant.tempHp ?? 0) > 0 && (
								<span className="ml-1 text-sky-400">
									{' '}
									+{participant.tempHp} temp
								</span>
							)}
							<span className="ml-1 text-muted-foreground">
								({indicatorLabel})
							</span>
						</span>
					</p>
					{typeof participant.hardness === 'number' && (
						<p className="text-sm text-muted-foreground">
							Hardness:{' '}
							<span className="text-foreground">{participant.hardness}</span>
						</p>
					)}
				</>
			)}
			{(participant.tempHp ?? 0) > 0 && participant.tempHpDescription && (
				<p className="text-xs text-muted-foreground">
					Temp HP source:{' '}
					<span className="text-foreground">
						{participant.tempHpDescription}
					</span>
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
						<Button
							size="sm"
							variant="outline"
							className="shrink-0 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10"
							onClick={handleHeal}
						>
							Heal
						</Button>
						<Button
							size="sm"
							variant="outline"
							className="shrink-0 border-rose-500/50 text-rose-400 hover:bg-rose-500/10"
							onClick={handleDamage}
						>
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
						<Button
							size="sm"
							variant="outline"
							className="w-full border-sky-500/50 text-sky-400 hover:bg-sky-500/10"
							onClick={handleSetTempHp}
						>
							Set Temp HP
						</Button>
					</div>
				</div>
			)}
			<div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
				{typeof participant.initiative === 'number' && (
					<p className="text-sm text-muted-foreground">
						Initiative:{' '}
						<span className="text-foreground">{participant.initiative}</span>
					</p>
				)}
				{typeof participant.initiativeBonus === 'number' && (
					<p className="text-sm text-muted-foreground">
						Initiative Bonus:{' '}
						<span className="text-foreground">
							+{participant.initiativeBonus}
						</span>
					</p>
				)}
				{typeof participant.adjustmentLevelModifier === 'number' && (
					<p className="text-sm text-muted-foreground">
						Custom Level Modifier:{' '}
						<span className="text-foreground">
							{participant.adjustmentLevelModifier}
						</span>
					</p>
				)}
			</div>
			{participant.adjustmentDescription && (
				<p className="text-sm text-muted-foreground">
					Adjustment Notes:{' '}
					<span className="text-foreground">
						{participant.adjustmentDescription}
					</span>
				</p>
			)}
			{(participant.dcs?.length ?? 0) > 0 && (
				<div className="space-y-2 rounded-md border p-3">
					<h4 className="text-sm font-medium">DCs</h4>
					{participant.dcs?.map((dc, index) => (
						<div
							key={`${participant.id}-dc-${index}`}
							className="rounded-md border p-2 text-sm"
						>
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
		return (
			<p className="text-muted-foreground">No encounter notes available.</p>
		);
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

// A dashed row in the initiative list for a participant that holds a spot
// without acting there: one delaying, or a reinforcement that hasn't arrived.
function DelayedMarkerCard({
	participant,
	label = `${participant.name} is delaying`,
	compact = false,
}: {
	participant: TrackerParticipant;
	label?: string;
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
			<p
				className={[
					'relative truncate bg-background px-2 text-left text-xs font-medium',
					theme.label,
				].join(' ')}
			>
				{label}
			</p>
		</div>
	);
}

type InitiativeCarouselItemData =
	| {
			key: string;
			type: 'marker';
	  }
	| {
			key: string;
			type: 'participant' | 'arrival';
			participant: TrackerParticipant;
	  };

type InitiativeListEntry = {
	type: 'participant' | 'arrival';
	participant: TrackerParticipant;
};

const arrivalLabel = ({ name, eventRound }: TrackerParticipant) =>
	`${name} arrives${eventRound === undefined ? '' : ` · round ${eventRound}`}`;

// Delaying participants and pending arrivals take the slim marker row.
const isMarkerRow = (item: InitiativeCarouselItemData) =>
	item.type === 'arrival' ||
	(item.type === 'participant' && item.participant.state === 'delayed');

// `markerIndex` counts only the participants in the order, not the arrivals:
// the next-round marker goes right before the participant at that index.
function buildInitiativeCarouselItems(
	entries: InitiativeListEntry[],
	markerIndex: number,
	nextRound: number
): InitiativeCarouselItemData[] {
	const participantCount = entries.filter(
		({ type }) => type === 'participant'
	).length;

	if (participantCount === 0) {
		return [];
	}

	const clampedMarkerIndex = Math.min(
		Math.max(markerIndex, 0),
		participantCount
	);
	const items: InitiativeCarouselItemData[] = [];
	let participantIndex = 0;

	entries.forEach(({ type, participant }) => {
		if (type === 'participant') {
			if (participantIndex === clampedMarkerIndex) {
				items.push({
					key: `next-round-marker-${nextRound}`,
					type: 'marker',
				});
			}

			participantIndex += 1;
		}

		items.push({ key: participant.id, type, participant });
	});

	if (clampedMarkerIndex === participantCount) {
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
	const { executeCommand, undo, redo, canUndo, canRedo } = useContext(
		CommandHistoryContext
	);
	const charactersOrder = useEncounterStore((state) => state.charactersOrder);
	const timer = useEncounterStore((state) => state.timer);
	const setTimer = useEncounterStore((state) => state.setTimer);
	const charactersMap = useEncounterStore((state) => state.charactersMap);
	const charactersWithTurn = useEncounterStore(
		(state) => state.charactersWithTurn
	);
	const trackerMetaMap = useEncounterStore((state) => state.trackerMetaMap);
	const encounterData = useEncounterStore((state) => state.encounterData);
	const partyLevel = useEncounterStore((state) => state.partyLevel);
	const pendingReinforcements = useEncounterStore(
		(state) => state.pendingReinforcements
	);
	const round = useEncounterStore((state) => state.round);
	const history = useEncounterStore((state) => state.history);
	const redoStack = useEncounterStore((state) => state.redoStack);
	const startEncounter = useEncounterStore((state) => state.startEncounter);
	const navigate = useNavigate();
	const [endEncounterOpen, setEndEncounterOpen] = useState(false);

	// Clears the running initiative but keeps the loaded encounter, so it can
	// be started again from its preview. Clearing after leaving the page keeps
	// the tracker from rendering an empty order.
	const endEncounter = () => {
		setEndEncounterOpen(false);
		void navigate({ to: '/encounters' }).then(() => startEncounter([]));
	};

	const storeInitiativeParticipants = useMemo(
		() =>
			runtimeToInitiativeQueue({
				charactersOrder,
				charactersMap,
				trackerMetaMap,
			}),
		[charactersOrder, charactersMap, trackerMetaMap]
	);

	const outOfInitiative = useMemo(
		() =>
			runtimeToOutOfInitiativeData({
				charactersOrder,
				charactersMap,
				trackerMetaMap,
				encounterData,
				partyLevel,
				pendingReinforcements,
			}),
		[
			charactersOrder,
			charactersMap,
			trackerMetaMap,
			encounterData,
			partyLevel,
			pendingReinforcements,
		]
	);

	const trackerHeader = useMemo(
		() =>
			encounterData
				? encounterToTrackerHeader(encounterData, partyLevel, round)
				: null,
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
					.map((meta) => meta.reinforcementSlotId)
					.filter((slotId): slotId is string => Boolean(slotId))
			),
		[trackerMetaMap]
	);

	const pendingReinforcementParticipants = useMemo(
		() =>
			outOfInitiative.reinforcements.filter(
				(participant) =>
					participant.eventId &&
					!triggeredReinforcementSlotIds.has(participant.eventId)
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

	const historyPreview = useMemo(
		() => historyToPreviewLines(history),
		[history]
	);

	const [initiativeCarouselApi, setInitiativeCarouselApi] =
		useState<CarouselApi>();
	const initiativeParticipants = storeInitiativeParticipants;
	const [selectedParticipantId, setSelectedParticipantId] = useState<
		string | null
	>(storeInitiativeParticipants[0]?.id ?? null);
	const [reorderOpen, setReorderOpen] = useState(false);
	const [nextRoundAnnouncement, setNextRoundAnnouncement] =
		useState<RoundAnnouncementState | null>(null);
	const [pinnedMarkerRound, setPinnedMarkerRound] = useState<number | null>(
		null
	);
	type ReturnPromptState = {
		participantId: string;
		action: 'end-turn' | 'delay' | 'ko';
		focusCurrentOnSuccess: boolean;
		/** Runs in the same undo step, e.g. the damage that caused a K.O. */
		before?: Command;
	};
	// A participant dropped to 0 HP or had its disable checks filled; `before`
	// is that change, run together with the GM's answer.
	type TakeOutPromptState = {
		participantId: string;
		reason: TakeOutEffect;
		before: Command;
	};
	const [takeOutPrompt, setTakeOutPrompt] = useState<TakeOutPromptState | null>(
		null
	);
	const [returnPrompt, setReturnPrompt] = useState<ReturnPromptState | null>(
		null
	);
	// Whose turn and which round the timer is on; when a new command (not an
	// undo or redo) moves it on while the timer is paused, the GM is asked
	// whether to resume it.
	const timerPosition = timer
		? `${timer.round}:${timer.turnParticipantId ?? ''}`
		: null;
	const isTimerPaused = timer?.pausedAt != null;
	const lastTimerPositionRef = useRef(timerPosition);
	const lastCommand = history.at(-1);
	const lastCommandRef = useRef(lastCommand);
	// A redo moves the head of the redo stack back to the history.
	const redoHeadRef = useRef(redoStack[0]);
	const [resumePrompt, setResumePrompt] = useState<string | null>(null);

	useEffect(() => {
		const isNewCommand =
			lastCommand !== undefined &&
			lastCommand !== lastCommandRef.current &&
			lastCommand !== redoHeadRef.current;
		lastCommandRef.current = lastCommand;
		redoHeadRef.current = redoStack[0];

		if (timerPosition === lastTimerPositionRef.current) return;

		lastTimerPositionRef.current = timerPosition;

		if (isNewCommand && isTimerPaused && timerPosition) {
			setResumePrompt(timerPosition);
		}
	}, [timerPosition, isTimerPaused, lastCommand, redoStack]);

	// A timer resumed some other way (e.g. the toolbar) answers the prompt.
	useEffect(() => {
		if (!isTimerPaused) setResumePrompt(null);
	}, [isTimerPaused]);
	const [reorderDraftParticipants, setReorderDraftParticipants] = useState<
		TrackerParticipant[]
	>(storeInitiativeParticipants);
	const currentInitiativeParticipantId = charactersOrder[0] ?? null;
	const nextTurnTimeoutRef = useRef<number | null>(null);
	const reorderScrollContainerRef = useRef<HTMLDivElement | null>(null);
	const reorderAutoScrollVelocityRef = useRef(0);
	const reorderAutoScrollFrameRef = useRef<number | null>(null);
	// Who the user dragged in the reorder draft: pending reinforcements stick
	// to the participant below them unless that one is dragged.
	const reorderDraggedIdsRef = useRef(new Set<string>());
	const delayedSectionParticipants = outOfInitiative.delayed;
	const returnPromptState = useMemo(() => {
		const names = new Map(
			delayedSectionParticipants.map(({ id, name }) => [id, name])
		);

		return {
			asks: asksToReturnFromDelay({ charactersOrder, charactersMap }),
			participants: returnPromptEntries({ charactersOrder, charactersMap })
				.filter((entry) => names.has(entry.id))
				.map((entry) => ({ ...entry, name: names.get(entry.id) ?? '' })),
		};
	}, [charactersOrder, charactersMap, delayedSectionParticipants]);
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

		// A store change discards the draft, and with it what was dragged
		setReorderDraftParticipants(storeInitiativeParticipants);
		reorderDraggedIdsRef.current = new Set();
	}, [storeInitiativeParticipants, reorderOpen]);

	const focusCurrentParticipant = () => {
		if (!initiativeCarouselApi) {
			return;
		}

		initiativeCarouselApi.scrollTo(0);
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

		if (announcement.focusCurrentOnClose) {
			queueFocusCurrentParticipant();
		}
	};

	const clearPinnedMarkerForCurrentRound = () => {
		if (pinnedMarkerRound === round) {
			setPinnedMarkerRound(null);
		}
	};

	const executeRoundAction = ({
		participantId,
		action,
		focusCurrentOnSuccess = false,
		before,
	}: {
		participantId: string;
		action: 'end-turn' | 'delay' | 'ko';
		focusCurrentOnSuccess?: boolean;
		before?: Command;
	}) => {
		clearPinnedMarkerForCurrentRound();

		const roundState = {
			charactersOrder,
			charactersMap,
			trackerMetaMap,
			charactersWithTurn,
		};
		const shouldAdvanceRound = closesRound(participantId, roundState);
		const command = withPrecedingCommand(
			before,
			getRoundActionCommand(participantId, action, roundState)
		);

		try {
			executeCommand(command);

			if (shouldAdvanceRound) {
				const nextRoundState = getEncounterStore().getState();

				setPinnedMarkerRound(nextRoundState.round);
				setNextRoundAnnouncement({
					round: nextRoundState.round,
					focusCurrentOnClose: true,
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
			return;
		}

		if (!charactersWithTurn.has(currentParticipantId)) {
			if (isDelaying(charactersMap, currentParticipantId)) {
				setReturnPrompt({
					participantId: currentParticipantId,
					action: 'end-turn',
					focusCurrentOnSuccess: true,
				});

				return;
			}

			// Already acted this round (e.g. moved up by a manual reorder before
			// this fix): skip it. The reorder command rotates the queue to the next
			// participant that still has a turn.
			try {
				executeCommand(
					new ReorderCharactersCommand({ newOrder: charactersOrder })
				);
				queueFocusCurrentParticipant();
			} catch (error) {
				console.error('Failed to skip participant without a turn', error);
			}

			return;
		}

		if (returnPromptState.asks) {
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
	};

	const resetReorderDraft = () => {
		setReorderDraftParticipants(storeInitiativeParticipants);
		reorderDraggedIdsRef.current = new Set();
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
		reorderAutoScrollFrameRef.current = window.requestAnimationFrame(
			stepReorderAutoScroll
		);
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
			reorderAutoScrollFrameRef.current = window.requestAnimationFrame(
				stepReorderAutoScroll
			);
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
		if (
			reorderDraftParticipants.length !== storeInitiativeParticipants.length
		) {
			return true;
		}

		return reorderDraftParticipants.some(
			(participant, index) =>
				participant.id !== storeInitiativeParticipants[index]?.id
		);
	}, [reorderDraftParticipants, storeInitiativeParticipants]);

	const handleReorderSave = () => {
		const draftOrderedIds = reorderDraftParticipants.map(
			(participant) => participant.id
		);
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

		const orderDidChange = newOrder.some(
			(participantId, index) => participantId !== charactersOrder[index]
		);

		if (!orderDidChange) {
			handleReorderOpenChange(false);

			return;
		}

		try {
			executeCommand(
				new ReorderCharactersCommand({
					newOrder,
					movedIds: [...reorderDraggedIdsRef.current],
				})
			);
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
			? allParticipants.some(
					(participant) => participant.id === selectedParticipantId
				)
			: false;

		if (!selectedStillExists) {
			setSelectedParticipantId(allParticipants[0]?.id ?? null);
		}
	}, [allParticipants, selectedParticipantId]);

	const handleParticipantSwipeAction = (
		participantId: string,
		action: SwipeAction,
		effect?: TakeOutEffect
	) => {
		const before =
			action === 'ko' && effect
				? getTakeOutEffectCommand(participantId, effect, {
						charactersMap,
						trackerMetaMap,
					})
				: null;

		if (action === 'ko') {
			takeOutParticipant(participantId, before ?? undefined);

			return;
		}

		if (action === 'reactivate') {
			try {
				executeCommand(new ReactivateCharacterCommand({ uuid: participantId }));
				queueFocusCurrentParticipant();
			} catch (error) {
				console.error('Failed to reactivate participant', error);
			}

			return;
		}

		if (action === 'slay') {
			removeParticipant(participantId);

			return;
		}

		takeOutParticipant(participantId, undefined, action);
	};

	// Slay, or Destroy for a hazard: the participant leaves the initiative.
	const removeParticipant = (participantId: string, before?: Command) => {
		try {
			executeCommand(
				withPrecedingCommand(
					before,
					new RemoveCharacterCommand({ uuid: participantId })
				)
			);
		} catch (error) {
			console.error('Failed to slay participant', error);
		}
	};

	// K.O., or Disable for a hazard (and Delay, which ends the turn the same
	// way). `before` runs in the same undo step.
	const takeOutParticipant = (
		participantId: string,
		before?: Command,
		action: 'ko' | 'delay' = 'ko'
	) => {
		const isCurrentActive =
			participantId === currentInitiativeParticipantId &&
			charactersWithTurn.has(participantId);

		if (isCurrentActive && returnPromptState.asks) {
			setReturnPrompt({
				participantId,
				action,
				focusCurrentOnSuccess: true,
				before,
			});

			return;
		}

		executeRoundAction({ participantId, action, before });
	};

	// A PC at 0 HP is knocked out; anyone else is asked about.
	const handleTakeOutTrigger = (
		participantId: string,
		reason: TakeOutEffect,
		before: Command
	) => {
		if (trackerMetaMap[participantId]?.role === 'pc') {
			takeOutParticipant(participantId, before);

			return;
		}

		setTakeOutPrompt({ participantId, reason, before });
	};

	const handleTakeOutPromptAnswer = (answer: 'take-out' | 'remove') => {
		if (!takeOutPrompt) {
			return;
		}

		const { participantId, before } = takeOutPrompt;
		setTakeOutPrompt(null);

		if (answer === 'take-out') {
			takeOutParticipant(participantId, before);
		} else {
			removeParticipant(participantId, before);
		}
	};

	const handleReturnPromptSelect = (returningParticipantId: string) => {
		if (!returnPrompt) {
			return;
		}

		const { participantId, action, before } = returnPrompt;
		setReturnPrompt(null);
		clearPinnedMarkerForCurrentRound();

		try {
			executeCommand(
				withPrecedingCommand(
					before,
					new ReturnToInitiativeCommand({
						activeUuid: participantId,
						returningUuid: returningParticipantId,
						action,
					})
				)
			);
			queueFocusCurrentParticipant();
		} catch (error) {
			console.error('Failed to return to initiative', error);
		}
	};

	const handleReturnPromptSkip = () => {
		if (!returnPrompt) {
			return;
		}

		const { participantId, action, focusCurrentOnSuccess, before } =
			returnPrompt;
		setReturnPrompt(null);

		executeRoundAction({
			participantId,
			action,
			focusCurrentOnSuccess,
			before,
		});
	};

	const triggerReinforcementEvent = (slotId: string) => {
		try {
			executeCommand(new TriggerReinforcementEventCommand({ slotId }));
			queueFocusCurrentParticipant();
		} catch (error) {
			console.error('Failed to trigger reinforcement event', error);
		}
	};

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
					executeCommand(
						new ChangeHealthCommand({
							uuid: selectedParticipantId,
							delta: amount,
						})
					);
				} catch (error) {
					console.error('Failed to heal', error);
				}
			}
		: undefined;

	const handleSelectedDamage = selectedParticipantId
		? (amount: number) => {
				const command = new ChangeHealthCommand({
					uuid: selectedParticipantId,
					delta: -amount,
				});

				if (
					damageDropsToZeroHp(selectedParticipantId, amount, {
						charactersMap,
						trackerMetaMap,
					})
				) {
					handleTakeOutTrigger(selectedParticipantId, 'hp', command);

					return;
				}

				try {
					executeCommand(command);
				} catch (error) {
					console.error('Failed to apply damage', error);
				}
			}
		: undefined;

	const recordDisableProgress = (
		participantId: string,
		change: DisableChange
	) => {
		const command = new RecordDisableProgressCommand({
			uuid: participantId,
			...change,
		});

		if (
			disableProgressFillsChecks(participantId, change, {
				charactersMap,
				trackerMetaMap,
			})
		) {
			handleTakeOutTrigger(participantId, 'checks', command);

			return;
		}

		try {
			executeCommand(command);
		} catch (error) {
			console.error('Failed to record hazard disable progress', error);
		}
	};

	const handleSelectedRecordDisableProgress = selectedParticipantId
		? (change: DisableChange) =>
				recordDisableProgress(selectedParticipantId, change)
		: undefined;

	const handleSelectedSetShownProgress = selectedParticipantId
		? (shownProgress: 'hp' | 'disable') => {
				try {
					executeCommand(
						new SetShownProgressCommand({
							uuid: selectedParticipantId,
							shownProgress,
						})
					);
				} catch (error) {
					console.error('Failed to set the shown progress', error);
				}
			}
		: undefined;

	const handleSelectedSetTempHp = selectedParticipantId
		? (amount: number, description: string) => {
				try {
					executeCommand(
						new SetTempHealthCommand({
							uuid: selectedParticipantId,
							tempHealth: amount,
							description,
						})
					);
				} catch (error) {
					console.error('Failed to set temp HP', error);
				}
			}
		: undefined;

	const canGiveSelectedTurnBack =
		selectedParticipantId !== null &&
		charactersOrder.includes(selectedParticipantId) &&
		!isDelaying(charactersMap, selectedParticipantId) &&
		!charactersWithTurn.has(selectedParticipantId);

	const handleSelectedGiveTurnBack =
		selectedParticipantId && canGiveSelectedTurnBack
			? () => {
					try {
						executeCommand(
							new GiveAdditionalTurnCommand({ uuid: selectedParticipantId })
						);
					} catch (error) {
						console.error('Failed to give turn back', error);
					}
				}
			: undefined;

	const nextRound = (trackerHeader?.currentRound ?? round) + 1;
	const nextRoundMarkerIndex =
		pinnedMarkerRound === round
			? initiativeParticipants.length
			: activeRoundBoundaryIndex;
	// Reinforcements given a spot in the preview show where they will arrive.
	const initiativeListEntries = useMemo(() => {
		const inOrder = new Map(
			initiativeParticipants.map((participant) => [participant.id, participant])
		);
		const arriving = new Map(
			pendingReinforcementParticipants.map((participant) => [
				participant.id,
				participant,
			])
		);

		return orderWithPendingSpots(
			{ charactersOrder, charactersWithTurn, charactersMap },
			pendingReinforcements
		).flatMap((id): InitiativeListEntry[] => {
			const participant = inOrder.get(id);

			if (participant) return [{ type: 'participant', participant }];

			const arrival = arriving.get(id);

			return arrival ? [{ type: 'arrival', participant: arrival }] : [];
		});
	}, [
		initiativeParticipants,
		pendingReinforcementParticipants,
		charactersOrder,
		charactersWithTurn,
		charactersMap,
		pendingReinforcements,
	]);
	const initiativeCarouselItems = useMemo(
		() =>
			buildInitiativeCarouselItems(
				initiativeListEntries,
				nextRoundMarkerIndex,
				nextRound
			),
		[initiativeListEntries, nextRoundMarkerIndex, nextRound]
	);

	// Not memoised: it calls triggerReinforcementEvent, which is recreated every
	// render, and Timeline isn't memoised either.
	const timelineEvents = timeline.map((event) => {
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
			reinforcementEvents.find((slot) => slot.id === event.id)?.participants
				?.length ?? 0;

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
	});

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
											onClick={() => setEndEncounterOpen(true)}
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
												setReorderOpen(true);
											}}
										>
											<ArrowUpDown className="h-4 w-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent side="bottom">Manual Reorder</TooltipContent>
								</Tooltip>
								<OpenPlayerViewButton />
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
													redo();
												}}
											>
												<Redo2 className="h-4 w-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent side="bottom">Redo</TooltipContent>
									</Tooltip>
								</div>
								<EncounterTimerControls />
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

				<div
					className={[
						'grid h-full min-h-0 min-w-0 gap-4',
						hasOutOfInitiativePanel
							? 'lg:grid-rows-[minmax(0,2fr)_minmax(0,1fr)]'
							: 'lg:grid-rows-[minmax(0,1fr)]',
					].join(' ')}
				>
					<Card className="flex min-h-0 min-w-0 flex-col overflow-hidden gap-0 p-4">
						<div className="min-h-0 min-w-0 flex-1 overflow-hidden">
							<Carousel
								setApi={setInitiativeCarouselApi}
								orientation="vertical"
								opts={{ align: 'start', dragFree: true }}
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
													: isMarkerRow(item)
														? 'basis-[2.5rem]'
														: 'basis-[5rem]',
											].join(' ')}
										>
											{item.type === 'marker' ? (
												<NextRoundMarkerCard nextRound={nextRound} />
											) : item.type === 'arrival' ? (
												<DelayedMarkerCard
													participant={item.participant}
													label={arrivalLabel(item.participant)}
												/>
											) : item.participant.state === 'delayed' ? (
												<DelayedMarkerCard participant={item.participant} />
											) : (
												<InitiativeActionCarouselCard
													participant={item.participant}
													selected={
														item.participant.id === selectedParticipantId
													}
													onSelect={setSelectedParticipantId}
													isCurrent={
														item.participant.id ===
														currentInitiativeParticipantId
													}
													onSwipeAction={handleParticipantSwipeAction}
													takeOutEffects={getTakeOutEffects(
														item.participant.id,
														{
															trackerMetaMap,
														}
													)}
													density="desktop"
													accent={getParticipantAccent(item.participant)}
													turnTimer={timer}
													indicatorLabel={getParticipantIndicatorLabel(
														item.participant
													)}
												/>
											)}
										</CarouselItem>
									))}
								</CarouselContent>
								<CarouselPrevious />
								<CarouselNext className="-mb-4" />
							</Carousel>
						</div>
					</Card>

					{hasOutOfInitiativePanel && (
						<Card className="flex min-h-0 min-w-0 flex-col p-4">
							<Tabs
								defaultValue={outOfInitiativePanelDefault}
								className="flex min-h-0 flex-1 flex-col"
							>
								<TabsList className="w-full h-auto">
									{hasReinforcements && (
										<TabsTrigger
											value="reinforcements"
											className="whitespace-normal"
										>
											Reinforcements
										</TabsTrigger>
									)}
									{hasDelayed && (
										<TabsTrigger value="delaying" className="whitespace-normal">
											Delaying
										</TabsTrigger>
									)}
									{hasHazards && (
										<TabsTrigger value="hazards" className="whitespace-normal">
											Hazards
										</TabsTrigger>
									)}
								</TabsList>
								{hasReinforcements && (
									<TabsContent
										value="reinforcements"
										className="mt-3 min-h-0 flex-1"
									>
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
																		triggerReinforcementEvent(
																			participant.eventId as string
																		);
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
															<OutOfFightRowActions
																participant={participant}
																effects={getTakeOutEffects(participant.id, {
																	trackerMetaMap,
																})}
																onAction={handleParticipantSwipeAction}
															/>
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
														actionSlot={
															<>
																<DisableQuickActions
																	participant={participant}
																	onRecord={recordDisableProgress}
																/>
																<OutOfFightRowActions
																	participant={participant}
																	effects={getTakeOutEffects(participant.id, {
																		trackerMetaMap,
																	})}
																	onAction={handleParticipantSwipeAction}
																/>
															</>
														}
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
						<Tabs
							defaultValue="description"
							className="flex min-h-0 flex-1 flex-col"
						>
							<TabsList className="w-full h-auto">
								<TabsTrigger value="description" className="whitespace-normal">
									Description
								</TabsTrigger>
								{hasNarrativeEvents && (
									<TabsTrigger value="events" className="whitespace-normal">
										Narrative Events
									</TabsTrigger>
								)}
								<TabsTrigger value="history" className="whitespace-normal">
									Command History
								</TabsTrigger>
								<TabsTrigger value="stats" className="whitespace-normal">
									Turn Stats
								</TabsTrigger>
							</TabsList>
							<TabsContent
								value="description"
								className="mt-3 min-h-0 flex-1 text-sm"
							>
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
							<TabsContent
								value="stats"
								className="mt-3 min-h-0 flex-1 text-sm"
							>
								<ScrollArea className="h-full pr-3">
									<TurnStatsPanel />
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
								onGiveTurnBack={handleSelectedGiveTurnBack}
								onRecordDisableProgress={handleSelectedRecordDisableProgress}
								onSetShownProgress={handleSelectedSetShownProgress}
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
							<p className="text-sm text-muted-foreground">
								{trackerHeader?.threatLevel}
							</p>
						</div>
						<div className="ml-auto flex flex-col items-end gap-2">
							<div className="flex items-center gap-2">
								<Button
									aria-label="Next Turn"
									variant="secondary"
									size="icon"
									onClick={() => {
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
									onClick={() => setEndEncounterOpen(true)}
								>
									<ArrowRight className="h-4 w-4" />
								</Button>
							</div>
							<div className="flex items-right gap-2 pr-1">
								<OpenPlayerViewButton />
								<Button
									aria-label="Manual Reorder"
									size="icon"
									onClick={() => {
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
											redo();
										}}
									>
										<Redo2 className="h-4 w-4" />
									</Button>
								</div>
							</div>
						</div>
						<EncounterTimerControls />
					</div>
				</Card>

				<Tabs defaultValue="carousel" className="space-y-3">
					<TabsList className="grid w-full">
						<TabsTrigger value="carousel">Horizontal Carousel</TabsTrigger>
						{hasOutOfInitiativePanel && (
							<TabsTrigger value="inactive">Inactive Participants</TabsTrigger>
						)}
					</TabsList>
					{hasOutOfInitiativePanel && (
						<TabsContent value="inactive" className="mt-0">
							<Card className="p-4">
								<Tabs
									defaultValue={outOfInitiativePanelDefault}
									className="space-y-3"
								>
									<TabsList className="grid w-full h-auto">
										{hasReinforcements && (
											<TabsTrigger
												value="reinforcements"
												className="whitespace-normal"
											>
												Reinforcements
											</TabsTrigger>
										)}
										{hasDelayed && (
											<TabsTrigger
												value="delaying"
												className="whitespace-normal"
											>
												Delaying
											</TabsTrigger>
										)}
										{hasHazards && (
											<TabsTrigger value="hazards">Hazards</TabsTrigger>
										)}
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
																		triggerReinforcementEvent(
																			participant.eventId as string
																		);
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
															<OutOfFightRowActions
																participant={participant}
																effects={getTakeOutEffects(participant.id, {
																	trackerMetaMap,
																})}
																onAction={handleParticipantSwipeAction}
															/>
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
														actionSlot={
															<>
																<DisableQuickActions
																	participant={participant}
																	onRecord={recordDisableProgress}
																/>
																<OutOfFightRowActions
																	participant={participant}
																	effects={getTakeOutEffects(participant.id, {
																		trackerMetaMap,
																	})}
																	onAction={handleParticipantSwipeAction}
																/>
															</>
														}
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
													: isMarkerRow(item)
														? 'h-full min-w-24 basis-[30%] pl-2'
														: 'h-full min-w-30 basis-[41%] pl-2',
											].join(' ')}
										>
											{item.type === 'marker' ? (
												<NextRoundMarkerCard nextRound={nextRound} compact />
											) : item.type === 'arrival' ? (
												<DelayedMarkerCard
													participant={item.participant}
													label={arrivalLabel(item.participant)}
													compact
												/>
											) : item.participant.state === 'delayed' ? (
												<DelayedMarkerCard
													participant={item.participant}
													compact
												/>
											) : (
												<InitiativeActionCarouselCard
													participant={item.participant}
													selected={
														item.participant.id === selectedParticipantId
													}
													onSelect={setSelectedParticipantId}
													isCurrent={
														item.participant.id ===
														currentInitiativeParticipantId
													}
													onSwipeAction={handleParticipantSwipeAction}
													takeOutEffects={getTakeOutEffects(
														item.participant.id,
														{
															trackerMetaMap,
														}
													)}
													density="mobile"
													accent={getParticipantAccent(item.participant)}
													turnTimer={timer}
													indicatorLabel={getParticipantIndicatorLabel(
														item.participant
													)}
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
									<TabsTrigger
										value="description"
										className="whitespace-normal"
									>
										Description
									</TabsTrigger>
									{hasNarrativeEvents && (
										<TabsTrigger value="events" className="whitespace-normal">
											Narrative Events
										</TabsTrigger>
									)}
									<TabsTrigger value="history" className="whitespace-normal">
										Command History
									</TabsTrigger>
									<TabsTrigger value="stats" className="whitespace-normal">
										Turn Stats
									</TabsTrigger>
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
									<TurnStatsPanel />
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
								onGiveTurnBack={handleSelectedGiveTurnBack}
								onRecordDisableProgress={handleSelectedRecordDisableProgress}
								onSetShownProgress={handleSelectedSetShownProgress}
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
							The next round is ready. Review this round's events before
							continuing.
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
										<p className="mt-1 text-xs text-muted-foreground">
											{event.detail}
										</p>
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

			<Dialog open={endEncounterOpen} onOpenChange={setEndEncounterOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>End Encounter?</DialogTitle>
						<DialogDescription>
							This clears the initiative order, health changes and undo history,
							and returns to Encounters.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEndEncounterOpen(false)}
						>
							Cancel
						</Button>
						<Button variant="destructive" onClick={endEncounter}>
							End Encounter
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{resumePrompt && isTimerPaused && !returnPrompt && !takeOutPrompt && (
				<ResumeTimerNotice
					key={resumePrompt}
					onStayPaused={() => setResumePrompt(null)}
					onResume={() => {
						setResumePrompt(null);
						setTimer((current) => current && resumeTimer(current, Date.now()));
					}}
				/>
			)}

			{takeOutPrompt && charactersMap[takeOutPrompt.participantId] && (
				<TakeOutNotice
					key={`${takeOutPrompt.participantId}-${takeOutPrompt.reason}`}
					participant={{
						name: charactersMap[takeOutPrompt.participantId].name,
						role:
							trackerMetaMap[takeOutPrompt.participantId]?.role ?? 'opponent',
					}}
					reason={takeOutPrompt.reason}
					onTakeOut={() => handleTakeOutPromptAnswer('take-out')}
					onRemove={() => handleTakeOutPromptAnswer('remove')}
				/>
			)}

			{returnPrompt && !takeOutPrompt && (
				<ReturnToInitiativeNotice
					key={`${returnPrompt.participantId}-${returnPrompt.action}`}
					participants={returnPromptState.participants}
					onReturn={handleReturnPromptSelect}
					onDismiss={handleReturnPromptSkip}
				/>
			)}

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
					<div
						ref={reorderScrollContainerRef}
						className="min-h-0 flex-1 overflow-y-auto px-6 py-4 sm:px-0 sm:py-0"
					>
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
										reorderDraggedIdsRef.current.add(participant.id);
										handleReorderDrag(info.point.y);
									}}
									onDrag={(_, info) => {
										handleReorderDrag(info.point.y);
									}}
									onDragEnd={() => {
										stopReorderAutoScroll();
									}}
									className="cursor-grab rounded-md border p-2 text-sm active:cursor-grabbing"
								>
									<span>{participant.name}</span>
								</Reorder.Item>
							))}
						</Reorder.Group>
					</div>
					<DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 sm:static sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
						<Button
							variant="outline"
							onClick={() => {
								handleReorderOpenChange(false);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={!hasReorderChanges}
							onClick={() => {
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
