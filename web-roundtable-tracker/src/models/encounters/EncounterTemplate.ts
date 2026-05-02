import { ExperienceBudget } from '../utility/experienceBudget/ExperienceBudget';
import { Threat } from '../utility/threat/Threat.class';
import { EncounterTemplateDataSchema } from './encounter.schemas';
import type {
	EncounterTemplateData,
	Participant,
	Event,
} from './encounter.types';

/**
 * Pure business logic for encounter math and querying.
 * Operates only on immutable data; never modifies inputs.
 *
 * All methods are pure functions:
 * - No side effects
 * - No external state mutation
 * - Deterministic output for given input
 */
export class EncounterTemplate {
	public readonly data: EncounterTemplateData;

	constructor(data: EncounterTemplateData) {
		// Validate on construction to fail fast
		const validated = EncounterTemplateDataSchema.parse(data);
		this.data = validated;
	}

	/**
	 * Ensure the default variant exists; fall back to first if not found.
	 * Returns the valid variant ID to use.
	 */
	public validateDefaultVariant(): string {
		const variantExists = this.data.variants.some(
			(v) => v.id === this.data.defaultVariantId
		);

		// If default variant doesn't exist, use first
		if (!variantExists) {
			return this.data.variants[0]?.id || this.data.defaultVariantId;
		}

		return this.data.defaultVariantId;
	}

	/**
	 * Calculate the XP budget for a specific variant.
	 * XP budget = sum of all participant XP weighted by role (simple hazards = 1/5).
	 *
	 * Returns total XP needed to challenge the party at the given variant's partySize.
	 */
	public calculateXpBudget(variantId: string): ExperienceBudget {
		const variant = this.data.variants.find((v) => v.id === variantId);

		if (!variant) {
			return new ExperienceBudget(0);
		}

		const totalXp = variant.participants.reduce((sum, participant) => {
			const participantXp = this.calculateParticipantXp(participant);

			return sum + participantXp;
		}, 0);

		return new ExperienceBudget(totalXp);
	}

	/**
	 * Helper: Calculate XP contribution of a single participant,
	 * accounting for count and role-specific multipliers.
	 *
	 * Decision logic:
	 * - Base XP from ExperienceBudget.fromLevel
	 * - Simple hazards: multiply by 1/5
	 * - Complex hazards: multiply by 1
	 * - Creatures: multiply by 1
	 * - Multiple copies (count > 1): multiply by count
	 */
	private calculateParticipantXp(participant: Participant): number {
		const countXp =
			participant.relativeLevel
				.toExperience(
					participant.type !== 'hazard' || participant.role === 'complex'
				)
				.valueOf() * (participant.count ?? 1);

		return countXp;
	}

	/**
	 * Calculate threat level (Trivial, Low, Moderate, Severe, Extreme, Impossible).
	 * Threat is derived from XP budget vs party size and expected encounter range.
	 */
	public calculateThreatLevel(variantId: string): Threat {
		const variant = this.data.variants.find((v) => v.id === variantId);

		if (!variant) {
			return Threat.fromExperienceBudget(new ExperienceBudget(0), 4);
		}

		const xpBudget = this.calculateXpBudget(variantId);
		const threat = Threat.fromExperienceBudget(xpBudget, variant.partySize);

		return threat;
	}

	/**
	 * Calculate the actual XP awarded to the party after the encounter.
	 * Award is portion of budget (typically 10-40% depending on difficulty).
	 */
	public calculateAwardedXp(variantId: string): ExperienceBudget {
		const xpBudget = this.calculateXpBudget(variantId);
		const awarded = ExperienceBudget.budgetToBaseReward(xpBudget, 4); // Use standard party size

		return awarded;
	}

	/**
	 * Build a relational index across all variants.
	 * Useful for cross-variant queries: "find all creatures with tag X".
	 *
	 * Returns maps of:
	 * - creatures: tag → set of participant IDs
	 * - hazards: tag → set of participant IDs
	 * - narrative: tag → set of event IDs
	 * - reinforcement: tag → set of participant IDs from reinforcement events
	 */
	public getRelations(): {
		creatures: Map<string, Set<string>>;
		hazards: Map<string, Set<string>>;
		narrative: Map<string, Set<string>>;
		reinforcement: Map<string, Set<string>>;
	} {
		const creatures = new Map<string, Set<string>>();
		const hazards = new Map<string, Set<string>>();
		const narrative = new Map<string, Set<string>>();
		const reinforcement = new Map<string, Set<string>>();

		// Index all participants
		for (const variant of this.data.variants) {
			for (const participant of variant.participants) {
				const tag = participant.tag || 'untagged';

				if (participant.type === 'creature') {
					if (!creatures.has(tag)) creatures.set(tag, new Set());
					creatures.get(tag)!.add(participant.id);
				} else if (participant.type === 'hazard') {
					if (!hazards.has(tag)) hazards.set(tag, new Set());
					hazards.get(tag)!.add(participant.id);
				}
			}

			// Index events
			for (const event of variant.events) {
				const tag = event.tag || 'untagged';

				if (event.type === 'narrative') {
					if (!narrative.has(tag)) narrative.set(tag, new Set());
					narrative.get(tag)!.add(event.id);
				} else if (event.type === 'reinforcement') {
					if (!reinforcement.has(tag)) reinforcement.set(tag, new Set());
					reinforcement.get(tag)!.add(event.id);
					// Also index participant IDs from reinforcement
					event.reinforcementParticipantIds.forEach((pid) => {
						reinforcement.get(tag)!.add(pid);
					});
				}
			}
		}

		return { creatures, hazards, narrative, reinforcement };
	}

	/**
	 * Find all participants (across variants) matching a given tag.
	 * Useful for: "find all minions" or "find all boss-related creatures".
	 */
	public findByTag(tag: string): Participant[] {
		const matches: Participant[] = [];

		for (const variant of this.data.variants) {
			for (const participant of variant.participants) {
				if (participant.tag === tag) {
					matches.push(participant);
				}
			}
		}

		return matches;
	}

	/**
	 * Find all events (across variants) matching a given tag.
	 * Useful for: "find all reinforcement events" or "find narrative milestones".
	 */
	public findEventsByTag(tag: string): Event[] {
		const matches: Event[] = [];

		for (const variant of this.data.variants) {
			for (const event of variant.events) {
				if (event.tag === tag) {
					matches.push(event);
				}
			}
		}

		return matches;
	}

	/**
	 * Serialize template to JSON.
	 * Uses JSON.stringify for simplicity; no custom serialization needed.
	 */
	public toJSON(): string {
		return JSON.stringify(this.data);
	}

	/**
	 * Deserialize from JSON with validation.
	 * Throws ZodError if JSON is corrupted or invalid shape.
	 */
	public static fromJSON(json: string): EncounterTemplate {
		const data = JSON.parse(json) as unknown;
		const validated = EncounterTemplateDataSchema.parse(data);

		return new EncounterTemplate(validated);
	}

	/**
	 * Create a mutable copy for the builder pattern.
	 * Useful when you need to modify template before saving.
	 */
	public toMutableCopy(): EncounterTemplateData {
		return JSON.parse(JSON.stringify(this.data)) as EncounterTemplateData;
	}
}
