import { describe, expect, it } from 'vitest';
import {
	challengePointsFromLevelDelta,
	challengePointsToXp,
	computeChallengePointBudgetForLevels,
	deriveChallengePointBasisFromLowestLevel,
	inferPartyFromChallengePointBudget,
	normalizePartySetup,
	toChallengePointTierStart,
} from './challengePoints';

describe('challengePoints conversion rules', () => {
	it('clamps level deltas below 0 before applying challenge point table', () => {
		expect(challengePointsFromLevelDelta(-3)).toBe(2);
		expect(challengePointsFromLevelDelta(-2)).toBe(2);
		expect(challengePointsFromLevelDelta(-1)).toBe(2);
		expect(challengePointsFromLevelDelta(0)).toBe(2);
		expect(challengePointsFromLevelDelta(1)).toBe(3);
		expect(challengePointsFromLevelDelta(2)).toBe(4);
		expect(challengePointsFromLevelDelta(3)).toBe(6);
	});

	it('converts challenge points to XP with 20 XP scale', () => {
		expect(challengePointsToXp(0)).toBe(0);
		expect(challengePointsToXp(8)).toBe(160);
		expect(challengePointsToXp(13)).toBe(260);
	});

	it('computes challenge point budget for a specific party', () => {
		const budget = computeChallengePointBudgetForLevels([5, 5, 6, 8], 5);
		expect(budget).toBe(13);
	});

	it('derives basis from the highest odd level not above lowest party level', () => {
		expect(deriveChallengePointBasisFromLowestLevel(1)).toBe(1);
		expect(deriveChallengePointBasisFromLowestLevel(2)).toBe(1);
		expect(deriveChallengePointBasisFromLowestLevel(8)).toBe(7);
		expect(deriveChallengePointBasisFromLowestLevel(20)).toBe(17);
	});

	it('normalizes challenge point tier values to odd-tier starts', () => {
		expect(toChallengePointTierStart(1)).toBe(1);
		expect(toChallengePointTierStart(2)).toBe(1);
		expect(toChallengePointTierStart(10)).toBe(9);
		expect(toChallengePointTierStart(21)).toBe(17);
	});
});

describe('normalizePartySetup', () => {
	it('normalizes simple mode to fixed level-size party and derived challenge points', () => {
		const normalized = normalizePartySetup({
			mode: 'simple',
			simplePartyLevel: 5,
			simplePartySize: 4,
		});

		expect(normalized.effectivePartyLevel).toBe(5);
		expect(normalized.effectivePartySize).toBe(4);
		expect(normalized.challengePointBasisLevel).toBe(5);
		expect(normalized.challengePointTierLabel).toBe('5-8');
		expect(normalized.challengePointBudget).toBe(8);
		expect(normalized.challengePointPerCharacter).toEqual([2, 2, 2, 2]);
		expect(normalized.inferredChallengePointPartySize).toBe(4);
		expect(normalized.inferredChallengePointPerCharacter).toEqual([2, 2, 2, 2]);
		expect(normalized.xpBudgetEquivalent).toBe(160);
	});

	it('applies +50% challenge-point valuation for simple even-level parties', () => {
		const normalized = normalizePartySetup({
			mode: 'simple',
			simplePartyLevel: 2,
			simplePartySize: 4,
		});

		expect(normalized.effectivePartyLevel).toBe(2);
		expect(normalized.challengePointBasisLevel).toBe(1);
		expect(normalized.challengePointBudget).toBe(12);
		expect(normalized.challengePointPerCharacter).toEqual([3, 3, 3, 3]);
	});

	it('normalizes specific mode using provided member levels', () => {
		const levels = [8, 9, 8, 8];
		const normalized = normalizePartySetup({
			mode: 'specific',
			simplePartyLevel: 1,
			simplePartySize: 4,
			specificPartyLevels: levels,
		});
		const lowestLevel = Math.min(...levels);

		expect(normalized.effectivePartyLevel).toBe(8);
		expect(normalized.effectivePartySize).toBe(4);
		expect(normalized.challengePointBasisLevel).toBe(7);
		expect(normalized.challengePointBasisLevel).toBeLessThanOrEqual(lowestLevel);
		expect(normalized.challengePointBudget).toBe(13);
		expect(normalized.challengePointPerCharacter).toEqual([3, 4, 3, 3]);
		expect(normalized.xpBudgetEquivalent).toBe(260);
	});

	it('keeps challenge-point budget bound to inferred odd-tier basis for shifted party shapes', () => {
		const lowerShape = normalizePartySetup({
			mode: 'specific',
			simplePartyLevel: 1,
			simplePartySize: 4,
			specificPartyLevels: [1, 1, 2, 3],
		});
		const higherShape = normalizePartySetup({
			mode: 'specific',
			simplePartyLevel: 1,
			simplePartySize: 4,
			specificPartyLevels: [2, 2, 3, 4],
		});

		expect(lowerShape.challengePointBasisLevel).toBe(1);
		expect(higherShape.challengePointBasisLevel).toBe(1);
		expect(lowerShape.challengePointPerCharacter).toEqual([2, 2, 3, 4]);
		expect(higherShape.challengePointPerCharacter).toEqual([3, 3, 4, 6]);
		expect(higherShape.challengePointBudget).toBeGreaterThan(
			lowerShape.challengePointBudget
		);
		expect(higherShape.xpBudgetEquivalent).toBeGreaterThan(
			lowerShape.xpBudgetEquivalent
		);
	});

	it('normalizes challenge-points mode as basis-level budget context', () => {
		const normalized = normalizePartySetup({
			mode: 'challenge-points',
			simplePartyLevel: 12,
			simplePartySize: 6,
			challengePointTierStart: 9,
			challengePointBudget: 15,
		});

		expect(normalized.effectivePartyLevel).toBe(10);
		expect(normalized.effectivePartySize).toBe(4);
		expect(normalized.partyLevels).toEqual([10, 11, 11, 11]);
		expect(normalized.challengePointBasisLevel).toBe(9);
		expect(normalized.challengePointTierLabel).toBe('9-12');
		expect(normalized.challengePointBudget).toBe(15);
		expect(normalized.inferredChallengePointPartySize).toBe(4);
		expect(normalized.inferredChallengePointPerCharacter).toEqual([3, 4, 4, 4]);
		expect(normalized.xpBudgetEquivalent).toBe(300);
	});

	it('enforces minimum challenge-point budget of 2 in challenge-points mode', () => {
		const normalized = normalizePartySetup({
			mode: 'challenge-points',
			simplePartyLevel: 1,
			simplePartySize: 4,
			challengePointTierStart: 1,
			challengePointBudget: 0,
		});

		expect(normalized.challengePointBudget).toBe(2);
		expect(normalized.effectivePartyLevel).toBe(1);
		expect(normalized.effectivePartySize).toBe(1);
		expect(normalized.partyLevels).toEqual([1]);
		expect(normalized.xpBudgetEquivalent).toBe(40);
		expect(normalized.inferredChallengePointPartySize).toBe(1);
		expect(normalized.inferredChallengePointPerCharacter).toEqual([2]);
	});

	it('changes challenge-point basis metadata when selected tier changes', () => {
		const lowerTier = normalizePartySetup({
			mode: 'challenge-points',
			simplePartyLevel: 8,
			simplePartySize: 4,
			challengePointTierStart: 5,
			challengePointBudget: 13,
		});
		const higherTier = normalizePartySetup({
			mode: 'challenge-points',
			simplePartyLevel: 8,
			simplePartySize: 4,
			challengePointTierStart: 9,
			challengePointBudget: 13,
		});

		expect(lowerTier.challengePointBasisLevel).toBe(5);
		expect(higherTier.challengePointBasisLevel).toBe(9);
		expect(lowerTier.challengePointTierLabel).toBe('5-8');
		expect(higherTier.challengePointTierLabel).toBe('9-12');
		expect(lowerTier.challengePointBudget).toBe(higherTier.challengePointBudget);
		expect(lowerTier.xpBudgetEquivalent).toBe(higherTier.xpBudgetEquivalent);
	});
});

describe('inferPartyFromChallengePointBudget', () => {
	it('picks an exact budget with party size closest to 4', () => {
		const inferred = inferPartyFromChallengePointBudget(13);

		expect(inferred.partySize).toBe(4);
		expect(inferred.perCharacter).toEqual([3, 3, 3, 4]);
		expect(inferred.totalChallengePoints).toBe(13);
	});

	it('uses the published lookup assumptions through 72 ChP', () => {
		expect(inferPartyFromChallengePointBudget(29)).toEqual({
			partySize: 5,
			perCharacter: [4, 4, 6, 6, 9],
			totalChallengePoints: 29,
		});

		expect(inferPartyFromChallengePointBudget(38)).toEqual({
			partySize: 6,
			perCharacter: [4, 4, 6, 6, 9, 9],
			totalChallengePoints: 38,
		});

		expect(inferPartyFromChallengePointBudget(63)).toEqual({
			partySize: 9,
			perCharacter: [4, 4, 4, 6, 9, 9, 9, 9, 9],
			totalChallengePoints: 63,
		});

		expect(inferPartyFromChallengePointBudget(72)).toEqual({
			partySize: 8,
			perCharacter: [9, 9, 9, 9, 9, 9, 9, 9],
			totalChallengePoints: 72,
		});
	});

	it('still returns a valid exact budget for small totals', () => {
		const inferred = inferPartyFromChallengePointBudget(2);

		expect(inferred.partySize).toBe(1);
		expect(inferred.perCharacter).toEqual([2]);
		expect(inferred.totalChallengePoints).toBe(2);
	});
});
