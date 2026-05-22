/**
 * Skill Challenge event types and interfaces.
 * Skill challenges are ongoing events that track successes and failures
 * over the course of an initiative encounter.
 */

import type { AccomplishmentLevel } from './encounter.types';
import type { ParticipantDcIconKey } from '@/store/data';

/**
 * A DC entry specific to skill challenges.
 * Extends the basic DC concept with name and icon for display.
 */
export interface SkillChallengeDC {
	name: string;
	value: number;
	icon?: ParticipantDcIconKey | string;
}

/**
 * A reward or penalty that can be granted during a skill challenge.
 */
export interface ChallengeRewardOption {
	id: string; // UUID
	name: string;
	description: string;
	multipleTimesAllowed: boolean; // If false, can only be awarded once per character
}

/**
 * Base interface for skill challenge events in the model layer.
 * Extends BaseEvent for model consistency.
 */
export interface SkillChallengeEvent {
	type: 'skillChallenge';
	id: string; // UUID
	turnIndex: number; // Turn number when event fires (0-indexed)
	tag?: string; // For cross-variant grouping
	description: string;
	accomplishmentLevel?: AccomplishmentLevel;

	// Configuration
	shared: boolean; // true = party shares progress, false = each PC tracks independently
	dcs: SkillChallengeDC[];
	successesRequired: number;
	finishWhenMaxSuccesses: boolean; // Auto-end challenge when reaching max successes
	rewards: ChallengeRewardOption[];

	failuresRequired: number;
	penalties: ChallengeRewardOption[]; // Same structure as rewards
	name: string;
	finishWhenMaxFailures: boolean; // Auto-end challenge when reaching max failures
}

/**
 * Progress tracking for a single participant in a shared or individual challenge.
 */
export interface SkillChallengeProgress {
	successCount: number;
	failureCount: number;
	awardedRewardIds: string[]; // Track which rewards have been awarded
	awardedPenaltyIds: string[]; // Track which penalties have been awarded
}

/**
 * Runtime skill challenge slot with progress tracking.
 * Used during initiative to track state and progression.
 */
export interface SkillChallengeSlot extends SkillChallengeEvent {
	trigger: {
		round: number;
		frequency?: number;
	};

	// Progress tracking
	shared: boolean;
	progressByParticipant?: Record<string, SkillChallengeProgress>; // When shared=false
	progressShared?: SkillChallengeProgress; // When shared=true

	// State tracking
	isActive: boolean;
	endedAt?: number; // Round when challenge ended (if applicable)
}

/**
 * Result of ending a skill challenge - determines which side "won".
 */
export type SkillChallengeOutcome = {
	type: 'success' | 'failure';
	successCount: number;
	failureCount: number;
	reason: 'max_reached' | 'manual_end'; // Why did it end?
};
