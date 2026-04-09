import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { LevelDifference } from '@/models/utility/level/LevelDifference';
import { getAdjustedLevel } from '@/models/utility/level/Level';
import { Threat } from '@/models/utility/threat/Threat.class';
import type { LevelAdjustment } from '@/models/utility/level/Level';

export type SlotType =
	| 'creature'
	| 'hazard'
	| 'reinforcement'
	| 'narrative'
	| 'aura';

export type SideType = 'enemy' | 'ally' | 'neutral';

export interface BuilderSlot {
	id: string;
	type: SlotType;
	name: string;
	description: string;
	side: SideType;
	level: number;
	count: number;
	maxHealth?: number;
	successesToDisable: number;
	adjustment: LevelAdjustment | 'none';
	isSimpleHazard: boolean;
	reinforcementRound: number;
	eventRound: number;
	auraCycle: number;
}

/**
 * Computes the cumulative XP budget for all creature slots in the encounter.
 *
 * Rules:
 * - Only 'creature' type slots contribute (reinforcement/narrative/aura: excluded for now).
 * - 'neutral' side: no contribution.
 * - 'enemy' side: positive XP contribution.
 * - 'ally' side: negative XP contribution (they help the party).
 * - count multiplies the per-slot XP.
 * - isSimpleHazard halves the XP (passed as isComplexHazard=false to LevelDifference).
 * - adjustment (weak/elite/etc.) shifts the effective creature level before computing diff.
 */
export function computeBuilderXP(
	slots: BuilderSlot[],
	partyLevel: number
): ExperienceBudget {
	let total = new ExperienceBudget(0);
	// console.log('Computing XP for slots:', slots, 'with party level:', partyLevel);
	for (const slot of slots) {
		// console.log(`Processing slot: ${slot.id} (type: ${slot.type}, side: ${slot.side})`);

		if (slot.type !== 'creature' && slot.type !== 'hazard') {
			// console.log(`  Skipping: type is ${slot.type}, not creature or hazard`);
			continue;
		}

		if (slot.side === 'neutral') {
			// console.log(`  Skipping: side is neutral`);
			continue;
		}

		if (slot.level === undefined || slot.level === null || isNaN(slot.level)) {
			// console.log(`  Skipping: level is invalid (${slot.level})`);
			continue;
		}

		const countValue =
			typeof slot.count === 'number' && Number.isFinite(slot.count)
				? slot.count
				: 1;
		const count = Math.max(0, countValue);
		// console.log(`  Count: ${count}`);

		const adjustment: LevelAdjustment | undefined =
			slot.type === 'hazard' || slot.adjustment === 'none'
				? undefined
				: slot.adjustment;
		// console.log(`  Adjustment: ${adjustment || 'none'}`);

		const adjustedLevel = getAdjustedLevel(slot.level, adjustment);
		// console.log(`  Base level: ${slot.level}, Adjusted level: ${adjustedLevel}`);

		const diff = new LevelDifference(adjustedLevel - partyLevel);
		// console.log(`  Level difference: ${adjustedLevel - partyLevel}`);

		const xp = diff.toExperience(!slot.isSimpleHazard);
		// console.log(`  XP per unit: ${xp.valueOf()} (isSimpleHazard: ${slot.isSimpleHazard})`);

		const contribution =
			slot.side === 'ally' ? -xp.valueOf() * count : xp.valueOf() * count;
		// console.log(`  Contribution (${slot.side}): ${contribution}`);

		total = total.sum(new ExperienceBudget(contribution));
		// console.log(`  Running total: ${total.valueOf()}`);
	}

	// console.log(`Final XP total: ${total.valueOf()}`);
	return total;
}

export function computeThreat(xp: ExperienceBudget, partySize: number): Threat {
	return Threat.fromExperienceBudget(xp, partySize);
}
