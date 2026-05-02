import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import { getAdjustedLevel } from '@/models/utility/level/Level';
import { Threat } from '@/models/utility/threat/Threat.class';
import type { LevelAdjustment } from '@/models/utility/level/Level';
import type { AccomplishmentLevel } from '@/models/encounters/encounter.types';
import type { ParticipantDcEntry } from '@/store/data';

export type SlotType = 'creature' | 'hazard' | 'reinforcement' | 'narrative';

export type CanonicalSideType = 'opponent' | 'ally' | 'other';

export type SideType = CanonicalSideType | 'enemy' | 'neutral';

export function normalizeSideType(side: SideType): CanonicalSideType {
	if (side === 'enemy') {
		return 'opponent';
	}

	if (side === 'neutral') {
		return 'other';
	}

	return side;
}

export interface BuilderReinforcementParticipant {
	id: string;
	type: 'creature' | 'hazard';
	name: string;
	side: SideType;
	level: number;
	count: number;
	maxHealth?: number;
	hardness?: number;
	initiativeBonus?: number;
	initiativeDescription?: string;
	dcs?: ParticipantDcEntry[];
	successesToDisable: number;
	adjustment: LevelAdjustment | 'none';
	adjustmentDescription?: string;
	adjustmentLevelModifier?: number;
	isSimpleHazard: boolean;
	traits?: string[];
	combatReadyState?: 'active' | 'delayed' | 'knocked-out';
	initiativeModifier?: number;
	hiddenFromPlayers?: boolean;
}

export interface BuilderSlot {
	id: string;
	type: SlotType;
	name: string;
	description: string;
	side: SideType;
	level: number;
	count: number;
	maxHealth?: number;
	hardness?: number;
	initiativeBonus?: number;
	initiativeDescription?: string;
	dcs?: ParticipantDcEntry[];
	successesToDisable: number;
	adjustment: LevelAdjustment | 'none';
	adjustmentDescription?: string;
	adjustmentLevelModifier?: number;
	isSimpleHazard: boolean;
	reinforcementRound: number;
	reinforcementParticipants?: BuilderReinforcementParticipant[];
	eventRound: number;
	repeatInterval?: number;
	accomplishmentLevel?: AccomplishmentLevel;
	traits?: string[];
	combatReadyState?: 'active' | 'delayed' | 'knocked-out';
	initiativeModifier?: number;
	hiddenFromPlayers?: boolean;
}

export interface DelayedReinforcementConfig {
	attritionRate?: number;
	maxRounds?: number;
	basePartyOutputPerRound?: number;
}

export interface ReinforcementWaveBreakdown {
	round: number;
	rawXp: ExperienceBudget;
	delayFactor: number;
	attritionFactor: number;
	effectiveXp: ExperienceBudget;
}

export interface WaveThreatData {
	rawThreat: Threat;
	rawXp: ExperienceBudget;
	adjustedThreat: Threat;
	adjustedXp: ExperienceBudget;
	adjustmentFactor: number;
	adjustmentPercent: number;
}

export interface EncounterWaveInteraction {
	wave0: WaveThreatData;
	wave1: WaveThreatData | null;
	roundDiff: number;
	roundDiffThreshold: number;
	affectsOtherWave: boolean;
	effectiveThreat: Threat;
}

export interface SimulationRoundPoint {
	round: number;
	wave0: number;
	wave1: number;
	attrition: number;
	totalExact: number;
	totalDisplay: number;
}

export interface EncounterThreatSimulation {
	maxThreatDisplayXp: number;
	maxThreatExactXp: number;
	history: SimulationRoundPoint[];
}

export interface EncounterXpUsage {
	rawXp: ExperienceBudget;
	immediateXp: ExperienceBudget;
	rawReinforcementXp: ExperienceBudget;
	effectiveReinforcementXp: ExperienceBudget;
	effectiveXp: ExperienceBudget;
	config: Required<DelayedReinforcementConfig>;
	waves: ReinforcementWaveBreakdown[];
	waveInteraction: EncounterWaveInteraction;
	simulation: EncounterThreatSimulation | null;
}

const DEFAULT_DELAYED_REINFORCEMENT_CONFIG: Required<DelayedReinforcementConfig> =
	{
		attritionRate: 0.05,
		maxRounds: 20,
		basePartyOutputPerRound: 20,
	};

const ROUND_DIFF_THRESHOLD_BY_THREAT: Record<number, number> = {
	0: 3,
	1: 3,
	2: 2,
	3: 2,
	4: 2,
	5: 1,
	6: 1,
	7: 1,
	8: 1,
	9: 1,
	10: 0,
};

const ACCOMPLISHMENT_XP_AWARD: Record<AccomplishmentLevel, number> = {
	story: 0,
	minor: 10,
	moderate: 30,
	major: 80,
};

function roundUpToNearestFive(value: number): number {
	return Math.ceil(value / 5) * 5;
}

function getRoundDiffThreshold(threatKey: number): number {
	return ROUND_DIFF_THRESHOLD_BY_THREAT[Math.min(10, Math.max(0, threatKey))];
}

function sanitizeConfig(
	config?: DelayedReinforcementConfig
): Required<DelayedReinforcementConfig> {
	const merged = {
		...DEFAULT_DELAYED_REINFORCEMENT_CONFIG,
		...config,
	};

	return {
		attritionRate: Math.max(0, merged.attritionRate),
		maxRounds: Math.max(1, Math.floor(merged.maxRounds)),
		basePartyOutputPerRound: Math.max(0, merged.basePartyOutputPerRound),
	};
}

function resolveCombatValuesBaseXp(
	values: {
		side: SideType;
		level: number;
		count: number;
		adjustment: LevelAdjustment | 'none';
		adjustmentLevelModifier?: number;
		isSimpleHazard: boolean;
		type: SlotType;
	},
	partyLevel: number
): ExperienceBudget | null {
	const side = normalizeSideType(values.side);

	if (side === 'other') {
		return null;
	}

	if (
		values.level === undefined ||
		values.level === null ||
		isNaN(values.level)
	) {
		return null;
	}

	const countValue =
		typeof values.count === 'number' && Number.isFinite(values.count)
			? values.count
			: 1;
	const count = Math.max(0, countValue);

	const adjustment: LevelAdjustment | undefined =
		values.type === 'hazard' || values.adjustment === 'none'
			? undefined
			: values.adjustment;

	const adjustedLevel = getAdjustedLevel(values.level, adjustment);
	const levelWithCustomAdjustment =
		typeof values.adjustmentLevelModifier === 'number' &&
		Number.isFinite(values.adjustmentLevelModifier)
			? adjustedLevel + values.adjustmentLevelModifier
			: adjustedLevel;
	const diff = new LevelDifference(levelWithCustomAdjustment - partyLevel);
	const xp = diff.toExperience(!values.isSimpleHazard);
	const contribution =
		side === 'ally' ? -xp.valueOf() * count : xp.valueOf() * count;

	return new ExperienceBudget(contribution);
}

function resolveSlotBaseXp(
	slot: BuilderSlot,
	partyLevel: number
): ExperienceBudget | null {
	return resolveCombatValuesBaseXp(
		{
			side: slot.side,
			level: slot.level,
			count: slot.count,
			adjustment: slot.adjustment,
			adjustmentLevelModifier: slot.adjustmentLevelModifier,
			isSimpleHazard: slot.isSimpleHazard,
			type: slot.type,
		},
		partyLevel
	);
}

function resolveReinforcementParticipantXp(
	participant: BuilderReinforcementParticipant,
	partyLevel: number
): ExperienceBudget | null {
	return resolveCombatValuesBaseXp(
		{
			side: participant.side,
			level: participant.level,
			count: participant.count,
			adjustment: participant.adjustment,
			adjustmentLevelModifier: participant.adjustmentLevelModifier,
			isSimpleHazard: participant.isSimpleHazard,
			type: participant.type,
		},
		partyLevel
	);
}

function resolveNarrativeAccomplishmentXp(slot: BuilderSlot): ExperienceBudget {
	const accomplishmentLevel = slot.accomplishmentLevel ?? 'story';
	const award = ACCOMPLISHMENT_XP_AWARD[accomplishmentLevel] ?? 0;

	return new ExperienceBudget(award);
}

function calculateWaveInteractionThreat(
	wave0Threat: Threat,
	wave1Threat: Threat | null,
	roundDiff: number,
	partySizeForCalc: number,
	effectiveXp: ExperienceBudget
): {
	wave0Adjusted: WaveThreatData;
	wave1Adjusted: WaveThreatData | null;
	roundDiffThreshold: number;
	affectsOtherWave: boolean;
	effectiveThreat: Threat;
} {
	const wave0RawXp = wave0Threat.toExpBudget(partySizeForCalc);
	const roundDiffThreshold = getRoundDiffThreshold(wave0Threat.threat);
	const affectsOtherWave =
		Boolean(wave1Threat) && roundDiff <= roundDiffThreshold;

	if (!wave1Threat) {
		return {
			wave0Adjusted: {
				rawThreat: wave0Threat,
				rawXp: wave0RawXp,
				adjustedThreat: wave0Threat,
				adjustedXp: wave0RawXp,
				adjustmentFactor: 1,
				adjustmentPercent: 0,
			},
			wave1Adjusted: null,
			roundDiffThreshold,
			affectsOtherWave: false,
			effectiveThreat: Threat.fromExperienceBudget(
				effectiveXp,
				partySizeForCalc
			),
		};
	}

	const wave1RawXp = wave1Threat.toExpBudget(partySizeForCalc);

	return {
		wave0Adjusted: {
			rawThreat: wave0Threat,
			rawXp: wave0RawXp,
			adjustedThreat: wave0Threat,
			adjustedXp: wave0RawXp,
			adjustmentFactor: 1,
			adjustmentPercent: 0,
		},
		wave1Adjusted: {
			rawThreat: wave1Threat,
			rawXp: wave1RawXp,
			adjustedThreat: wave1Threat,
			adjustedXp: wave1RawXp,
			adjustmentFactor: 1,
			adjustmentPercent: 0,
		},
		roundDiffThreshold,
		affectsOtherWave,
		effectiveThreat: Threat.fromExperienceBudget(effectiveXp, partySizeForCalc),
	};
}

function simulateEncounterThreat(
	wave0Xp: number,
	wave1Xp: number,
	arrivalRound: number,
	partySize: number,
	config: Required<DelayedReinforcementConfig>
): EncounterThreatSimulation {
	let currentWave0 = Math.max(0, wave0Xp);
	let currentWave1 = 0;
	let accumulatedAttrition = 0;
	let pendingAttrition = 0;
	let round = 1;
	let maxThreatDisplayXp = 0;
	let maxThreatExactXp = 0;
	const history: SimulationRoundPoint[] = [];

	const normalizedArrivalRound = Math.max(1, Math.floor(arrivalRound || 1));
	const partyReductionPerRound =
		config.basePartyOutputPerRound * (Math.max(1, partySize) / 4);

	while (
		currentWave0 > 0 ||
		currentWave1 > 0 ||
		round <= normalizedArrivalRound
	) {
		if (round === normalizedArrivalRound) {
			currentWave1 = Math.max(0, wave1Xp);
		}

		accumulatedAttrition += pendingAttrition;

		const currentBaseThreat = currentWave0 + currentWave1;

		if (currentBaseThreat === 0 && accumulatedAttrition < 5) {
			accumulatedAttrition = 0;
		}

		const newAttrition =
			(currentBaseThreat + accumulatedAttrition) * config.attritionRate;
		pendingAttrition = newAttrition;

		const totalExact = currentBaseThreat + accumulatedAttrition;
		const totalDisplay = roundUpToNearestFive(totalExact);
		maxThreatDisplayXp = Math.max(maxThreatDisplayXp, totalDisplay);
		maxThreatExactXp = Math.max(maxThreatExactXp, totalExact);

		history.push({
			round,
			wave0: currentWave0,
			wave1: currentWave1,
			attrition: accumulatedAttrition,
			totalExact,
			totalDisplay,
		});

		let damageToDeal = partyReductionPerRound;

		if (currentWave0 >= damageToDeal) {
			currentWave0 -= damageToDeal;
			damageToDeal = 0;
		} else {
			damageToDeal -= currentWave0;
			currentWave0 = 0;
		}

		if (currentWave1 >= damageToDeal) {
			currentWave1 -= damageToDeal;
			damageToDeal = 0;
		} else {
			damageToDeal -= currentWave1;
			currentWave1 = 0;
		}

		if (damageToDeal > 0) {
			accumulatedAttrition = Math.max(0, accumulatedAttrition - damageToDeal);
		}

		if (round >= config.maxRounds) {
			break;
		}

		round++;
	}

	return {
		maxThreatDisplayXp,
		maxThreatExactXp,
		history,
	};
}

/**
 * Computes cumulative XP budget for all wave-0 slots (creature + hazard).
 */
export function computeBuilderXP(
	slots: BuilderSlot[],
	partyLevel: number
): ExperienceBudget {
	let total = new ExperienceBudget(0);

	for (const slot of slots) {
		if (slot.type === 'narrative') {
			total = total.sum(resolveNarrativeAccomplishmentXp(slot));
			continue;
		}

		if (slot.type !== 'creature' && slot.type !== 'hazard') {
			continue;
		}

		const contribution = resolveSlotBaseXp(slot, partyLevel);

		if (!contribution) {
			continue;
		}

		total = total.sum(contribution);
	}

	return total;
}

export function computeEncounterXpUsage(
	slots: BuilderSlot[],
	partyLevel: number,
	partySizeOrConfig?: number | DelayedReinforcementConfig,
	config?: DelayedReinforcementConfig
): EncounterXpUsage {
	const partySize =
		typeof partySizeOrConfig === 'number' && Number.isFinite(partySizeOrConfig)
			? Math.max(1, partySizeOrConfig)
			: 4;
	const normalizedConfig = sanitizeConfig(
		typeof partySizeOrConfig === 'object' ? partySizeOrConfig : config
	);

	const immediateSlots = slots.filter((slot) => slot.type !== 'reinforcement');
	const immediateXp = computeBuilderXP(immediateSlots, partyLevel);

	const reinforcementSlots = slots.filter(
		(slot) => slot.type === 'reinforcement'
	);
	const rawReinforcementXp = reinforcementSlots.reduce((sum, slot) => {
		const hasParticipantList = Array.isArray(slot.reinforcementParticipants);
		const slotParticipants = hasParticipantList
			? slot.reinforcementParticipants
			: [];

		if (!hasParticipantList) {
			const legacyContribution =
				resolveSlotBaseXp(slot, partyLevel) ?? new ExperienceBudget(0);

			return sum.sum(legacyContribution);
		}

		const slotContribution = slotParticipants.reduce(
			(participantSum, participant) => {
				const contribution =
					resolveReinforcementParticipantXp(participant, partyLevel) ??
					new ExperienceBudget(0);

				return participantSum.sum(contribution);
			},
			new ExperienceBudget(0)
		);

		return sum.sum(slotContribution);
	}, new ExperienceBudget(0));

	const rawXp = immediateXp.sum(rawReinforcementXp);
	const hasSimulatedReinforcement = rawReinforcementXp.valueOf() > 0;
	const reinforcementRound = reinforcementSlots.length
		? Math.min(
				...reinforcementSlots.map((slot) => slot.reinforcementRound || 1)
			)
		: 1;

	const simulation = hasSimulatedReinforcement
		? simulateEncounterThreat(
				immediateXp.valueOf(),
				rawReinforcementXp.valueOf(),
				reinforcementRound,
				partySize,
				normalizedConfig
			)
		: null;

	const effectiveXp = simulation
		? new ExperienceBudget(simulation.maxThreatExactXp)
		: immediateXp;

	const effectiveReinforcementXp = hasSimulatedReinforcement
		? rawReinforcementXp
		: new ExperienceBudget(0);

	const waves: ReinforcementWaveBreakdown[] =
		reinforcementSlots.length > 0
			? [
					{
						round: Math.max(1, Math.floor(reinforcementRound || 1)),
						rawXp: rawReinforcementXp,
						delayFactor: 1,
						attritionFactor: 1,
						effectiveXp: effectiveReinforcementXp,
					},
				]
			: [];

	const wave0Threat = Threat.fromExperienceBudget(immediateXp, partySize);
	const wave1Threat =
		rawReinforcementXp.valueOf() !== 0
			? Threat.fromExperienceBudget(rawReinforcementXp, partySize)
			: null;
	const roundDiff = Math.max(0, reinforcementRound - 1 || 0);
	const waveInteractionData = calculateWaveInteractionThreat(
		wave0Threat,
		wave1Threat,
		roundDiff,
		partySize,
		effectiveXp
	);

	return {
		rawXp,
		immediateXp,
		rawReinforcementXp,
		effectiveReinforcementXp,
		effectiveXp,
		config: normalizedConfig,
		waves,
		waveInteraction: {
			wave0: waveInteractionData.wave0Adjusted,
			wave1: waveInteractionData.wave1Adjusted,
			roundDiff,
			roundDiffThreshold: waveInteractionData.roundDiffThreshold,
			affectsOtherWave: waveInteractionData.affectsOtherWave,
			effectiveThreat: waveInteractionData.effectiveThreat,
		},
		simulation,
	};
}

export function computeThreat(xp: ExperienceBudget, partySize: number): Threat {
	return Threat.fromExperienceBudget(xp, partySize);
}
