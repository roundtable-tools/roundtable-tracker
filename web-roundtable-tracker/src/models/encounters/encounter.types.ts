/**
 * Core types for the refactored encounter system.
 * These are the POJO data structures used throughout.
 */

import { LevelDifference } from '../utility/level/LevelDifference';

// ============================================================================
// Role Literals
// ============================================================================

/**
 * Creature roles define the tactical function of a combatant.
 * Extend with custom string to support homebrew encounters.
 */
export type CreatureRole =
	| 'boss'
	| 'lackey'
	| 'lieutenant'
	| 'opponent'
	| (string & {});

/**
 * Hazard roles determine XP calculation and disable mechanics.
 * Simple hazards (traps, magical effects) count as 1/5th XP.
 * Complex hazards are fully XP-weighted.
 */
export type HazardRole = 'complex' | 'simple';

/**
 * Accomplishment levels map narrative beats to XP awards.
 */
export type AccomplishmentLevel = 'story' | 'minor' | 'moderate' | 'major';

// ============================================================================
// Participant Types
// ============================================================================

/**
 * Base interface for encounter participants (creatures and hazards).
 * All participants have a unique id within the encounter, a count for multiples,
 * and optional relative level/customization fields.
 */
export type ParticipantSide = 0 | 1 | 2;

export interface BaseParticipant {
	id: string; // UUID
	count: number;
	relativeLevel: LevelDifference; // e.g., -4, +2
	side: ParticipantSide; // Matches ALIGNMENT values during transition
	tag?: string; // Semantic label for cross-variant queries
}

/**
 * Creature participants represent NPCs, monsters, and allies.
 */
export interface CreatureParticipant extends BaseParticipant {
	type: 'creature';
	role: CreatureRole;
	maxHealthOverride?: number; // Expert creatures may have non-standard HP
	initiativeModifierOverride?: number; // Allow custom initiative adjustments
}

/**
 * Hazard participants represent environmental challenges.
 */
export interface HazardParticipant extends BaseParticipant {
	type: 'hazard';
	role: HazardRole; // Determines XP multiplier
	successesToDisable: number; // PF2e mechanic: successes needed to end hazard
	hardnessValue?: number; // Hazard hardness reduces damage
}

/**
 * Discriminated union ensures only valid combinations exist at the type level.
 * TypeScript will reject { type: 'creature', successesToDisable: 5 }
 */
export type Participant = CreatureParticipant | HazardParticipant;

// ============================================================================
// Event Types
// ============================================================================

/**
 * Base structure for timeline events in an encounter.
 */
export interface BaseEvent {
	id: string; // UUID
	turnIndex: number; // Turn number when event fires (0-indexed)
	tag?: string; // For cross-variant grouping of related events
}

/**
 * Narrative events are flavor descriptions: defeated boss runs,
 * reinforcement message, or environmental change.
 */
export interface NarrativeEvent extends BaseEvent {
	type: 'narrative';
	description: string;
	accomplishmentLevel?: AccomplishmentLevel; // Ties to XP award
	repeatInterval?: number; // Repeat every N turns (optional)
}

/**
 * Reinforcement events inject new participants mid-encounter.
 * References participant IDs for type safety.
 */
export interface ReinforcementEvent extends BaseEvent {
	type: 'reinforcement';
	/** Array of participant IDs to add at this turn. */
	reinforcementParticipantIds: string[];
	description?: string; // "Goblins arrive from the north"
}

/**
 * Discriminated union prevents invalid transitions
 * (e.g., narrative events cannot reference participant IDs).
 */
export type Event = NarrativeEvent | ReinforcementEvent;

// ============================================================================
// Variant and Template
// ============================================================================

/**
 * A variant tailors an encounter to a specific party composition.
 */
export interface EncounterVariant {
	id: string; // UUID
	partySize: number; // Expected party member count
	partyLevel?: number; // Optional: override global party level
	participants: Participant[];
	events: Event[];
	description?: string; // "For a party of 3 characters"
	notes?: string; // "Boss has 20 additional HP in this variant"
}

/**
 * Template groups multiple variants of the same strategic encounter.
 * Always has at least one variant; defaultVariantId ensures a fallback.
 */
export interface EncounterTemplateData {
	id: string; // UUID
	name: string; // "Kobold Warren"
	description: string; // Campaign/module context
	defaultVariantId: string; // Refs a variantId (validated by schema)
	variants: EncounterVariant[]; // At least one
	tags?: string[]; // "desert", "kobolds", "level-3" for discovery
	createdAt?: Date;
	updatedAt?: Date;
}
