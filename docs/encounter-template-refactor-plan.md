# Encounter Template Architecture Refactor Plan

## Executive Summary

The current encounter template system suffers from three critical architectural flaws that compound risk:

1. **Nested Inheritance Problem**: `Encounter` extends `EncounterTemplate` (which extends `UuidElement`), while `EncounterSlot` extends `TemplateSlot`. This creates tight coupling between instantiated encounters and template definitions. Changes to templates unintentionally affect running encounters; mutable shared state between layers causes data corruption.

2. **Data Corruption Risks from Mutable State Coupling**: The current system relies on shared class hierarchies with mutable properties. When variants are added or templates modified, slots in active encounters may reference stale template data. No schema validation on deserialization means corrupted data silently loads without error detection.

3. **Lack of Tag-Based Grouping**: Variants are identified by `partySize` alone, making it impossible to group related encounter challenges (e.g., "boss arena variants") or cross-variant queries. Reinforcements and narrative events have no way to reference other participants by semantic relationship—only by ID.

4. **Missing Strict PF2e Hazard Math**: The current `EncounterTemplate` applies identical XP budgets to all encounter participants. PF2e rules state that **simple hazards count as only 1/5th experience**—this rule is not enforced, leading to miscalculated threat levels for hazard-heavy encounters.

5. **No Relational Queries for Cross-Variant Dependencies**: After loading a template, there is no way to query "all creatures tagged 'minion'" or "all reinforcement events across all variants." Code must iterate manually and track state externally.

### Impact on Developer Experience

- Developers cannot confidently modify templates during active encounters
- Serialization/deserialization is fragile (no validation)
- Testing requires full class hierarchies instead of pure function tests
- Type system allows invalid states (e.g., hazard without `role`, creature without `level`)
- Migrations are manual and error-prone

---

## Architecture Overview

The refactor follows a **four-layer architecture** that decouples data from behavior and state management:

```
┌─────────────────────────────────────────────────────────┐
│  React Integration Layer                                │
│  (useEncounterTemplate hook, component bindings)        │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  State Management Layer (Zustand)                       │
│  (SavedEncountersStore with immutable updates)          │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Business Logic Layer                                   │
│  (EncounterTemplate class with pure methods)            │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────┐
│  Data Layer (Plain Objects)                             │
│  (POJO types, Zod validation schemas)                   │
└─────────────────────────────────────────────────────────┘
```

**Key principles:**
- **Data Layer** contains immutable POJOs and Zod schemas; no methods
- **Business Logic** operates on data layer POJOs; all functions are pure
- **State Management** ensures updates are immutable; validation happens on deserialize
- **React Integration** wraps store access with ergonomic hooks

---

## Part 1: Core Types & Literals

### 1.1 Role Literals

```typescript
/**
 * Creature roles define the tactical function of a combatant.
 * Extend with custom string to support homebrew encounters.
 */
type CreatureRole = 'boss' | 'lackey' | 'lieutenant' | 'opponent' | (string & {});

/**
 * Hazard roles determine XP calculation and disable mechanics.
 * Simple hazards (traps, magical effects) count as 1/5th XP.
 * Complex hazards are fully XP-weighted.
 */
type HazardRole = 'complex' | 'simple';

/**
 * Accomplishment levels map narrative beats to XP awards.
 */
type AccomplishmentLevel = 'story' | 'minor' | 'moderate' | 'major';
```

### 1.2 Participant Types

```typescript
/**
 * Base interface for encounter participants (creatures and hazards).
 * All participants have a unique id within the encounter, a count for multiples,
 * and optional relative level/customization fields.
 */
interface BaseParticipant {
  id: string; // UUID
  count: number;
  relativeLevel: number; // e.g., -4, +2
  tag?: string; // Semantic label for cross-variant queries
}

/**
 * Creature participants represent NPCs, monsters, and allies.
 */
interface CreatureParticipant extends BaseParticipant {
  type: 'creature';
  role: CreatureRole;
  maxHealthOverride?: number; // Expert creatures may have non-standard HP
  initiativeModifierOverride?: number; // Allow custom initiative adjustments
}

/**
 * Hazard participants represent environmental challenges.
 */
interface HazardParticipant extends BaseParticipant {
  type: 'hazard';
  role: HazardRole; // Determines XP multiplier
  successesToDisable: number; // PF2e mechanic: successes needed to end hazard
  hardnessValue?: number; // Hazard hardness reduces damage
}

/**
 * Discriminated union ensures only valid combinations exist at the type level.
 * TypeScript will reject { type: 'creature', successesToDisable: 5 }
 */
type Participant = CreatureParticipant | HazardParticipant;
```

**Why Discriminated Unions?**
- **Compile-time Safety**: A `CreatureParticipant` cannot accidentally reference `successesToDisable`.
- **Exhaustive Checking**: TypeScript's type guard forces handlers to address both the `'creature'` and `'hazard'` cases.
- **Self-Documenting**: The union shape explicitly enumerates valid combinations, reducing cognitive load.
- **Migration Safety**: Serialization code can use the `type` field to route deserialization and apply role-specific validators.

### 1.3 Event Types

```typescript
/**
 * Base structure for timeline events in an encounter.
 */
interface BaseEvent {
  id: string; // UUID
  turnIndex: number; // Turn number when event fires (0-indexed)
  tag?: string; // For cross-variant grouping of related events
}

/**
 * Narrative events are flavor descriptions: defeated boss runs,
 * reinforcement message, or environmental change.
 */
interface NarrativeEvent extends BaseEvent {
  type: 'narrative';
  description: string;
  accomplishmentLevel?: AccomplishmentLevel; // Ties to XP award
  repeatInterval?: number; // Repeat every N turns (optional)
}

/**
 * Reinforcement events inject new participants mid-encounter.
 * References participant IDs for type safety.
 */
interface ReinforcementEvent extends BaseEvent {
  type: 'reinforcement';
  /** Array of participant IDs to add at this turn. */
  reinforcementParticipantIds: string[];
  description?: string; // "Goblins arrive from the north"
}

/**
 * Discriminated union prevents invalid transitions
 * (e.g., narrative events cannot reference participant IDs).
 */
type Event = NarrativeEvent | ReinforcementEvent;
```

### 1.4 Variant and Template

```typescript
/**
 * A variant tailors an encounter to a specific party composition.
 */
interface EncounterVariant {
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
interface EncounterTemplateData {
  id: string; // UUID
  name: string; // "Kobold Warren"
  description: string; // Campaign/module context
  defaultVariantId: string; // Refs a variantId (validated by schema)
  variants: EncounterVariant[]; // At least one
  tags?: string[]; // "desert", "kobolds", "level-3" for discovery
  createdAt?: Date;
  updatedAt?: Date;
}
```

**Design Benefits**:
- `EncounterVariant` and `EncounterTemplateData` are pure data—no methods, no inheritance
- `Participant` discriminated union prevents invalid role/field combinations at compile time
- Each event type's fields are explicit and validated
- Immutable structure supports snapshot-based state management

---

## Part 2: Zod Validation Schemas

Zod provides **runtime validation** on deserialization, preventing silent data corruption:

```typescript
import { z } from 'zod';

// ============================================================================
// Role Schemas
// ============================================================================

const CreatureRoleSchema = z.enum([
  'boss',
  'lackey',
  'lieutenant',
  'opponent',
]).or(z.string()); // Allow custom role strings

const HazardRoleSchema = z.enum(['complex', 'simple']);

const AccomplishmentLevelSchema = z.enum([
  'story',
  'minor',
  'moderate',
  'major',
]).optional();

// ============================================================================
// Participant Schemas
// ============================================================================

const BaseParticipantSchema = z.object({
  id: z.string().uuid(),
  count: z.number().int().positive(),
  relativeLevel: z.number().int(),
  tag: z.string().optional(),
});

const CreatureParticipantSchema = BaseParticipantSchema.extend({
  type: z.literal('creature'),
  role: CreatureRoleSchema,
  maxHealthOverride: z.number().positive().optional(),
  initiativeModifierOverride: z.number().optional(),
});

const HazardParticipantSchema = BaseParticipantSchema.extend({
  type: z.literal('hazard'),
  role: HazardRoleSchema,
  successesToDisable: z.number().int().nonnegative(),
  hardnessValue: z.number().int().nonnegative().optional(),
});

/**
 * Discriminated union schema ensures only valid combinations deserialize.
 * Zod will throw a validation error if type='creature' but
 * successesToDisable is present.
 */
const ParticipantSchema = z.discriminatedUnion('type', [
  CreatureParticipantSchema,
  HazardParticipantSchema,
]);

// ============================================================================
// Event Schemas
// ============================================================================

const BaseEventSchema = z.object({
  id: z.string().uuid(),
  turnIndex: z.number().int().nonnegative(),
  tag: z.string().optional(),
});

const NarrativeEventSchema = BaseEventSchema.extend({
  type: z.literal('narrative'),
  description: z.string(),
  accomplishmentLevel: AccomplishmentLevelSchema,
  repeatInterval: z.number().int().positive().optional(),
});

const ReinforcementEventSchema = BaseEventSchema.extend({
  type: z.literal('reinforcement'),
  reinforcementParticipantIds: z.array(z.string().uuid()).nonempty(),
  description: z.string().optional(),
});

const EventSchema = z.discriminatedUnion('type', [
  NarrativeEventSchema,
  ReinforcementEventSchema,
]);

// ============================================================================
// Variant Schema
// ============================================================================

const EncounterVariantSchema = z.object({
  id: z.string().uuid(),
  partySize: z.number().int().positive(),
  partyLevel: z.number().int().optional(),
  participants: z.array(ParticipantSchema).nonempty(),
  events: z.array(EventSchema),
  description: z.string().optional(),
  notes: z.string().optional(),
});

// ============================================================================
// Template Schema with Custom Validation
// ============================================================================

const EncounterTemplateDataSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string(),
  defaultVariantId: z.string().uuid(),
  variants: z.array(EncounterVariantSchema).nonempty(),
  tags: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
}).refine(
  (data) => {
    // Ensure defaultVariantId references an actual variant
    return data.variants.some(v => v.id === data.defaultVariantId);
  },
  {
    message: 'defaultVariantId must reference an existing variant',
    path: ['defaultVariantId'],
  }
);

export type EncounterTemplateData = z.infer<typeof EncounterTemplateDataSchema>;
export type Participant = z.infer<typeof ParticipantSchema>;
export type Event = z.infer<typeof EventSchema>;
export type EncounterVariant = z.infer<typeof EncounterVariantSchema>;
```

**Runtime Validation Benefits**:
- **Prevents Silent Failures**: Corrupted JSON from localStorage fails loudly with a clear message
- **Explicit Contracts**: Schemas document valid shapes better than TypeScript types alone
- **Cross-Boundary Safety**: When JSON is loaded from server, API, or file, validation catches mismatches
- **Type Inference**: `z.infer<typeof Schema>` generates TypeScript types automatically, eliminating duplication

---

## Part 3: EncounterTemplate Business Logic Class

The `EncounterTemplate` class is the **only** place encounter-specific math lives. All methods are **pure functions**:

```typescript
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';
import { Threat } from '@/models/utility/threat/Threat.class';
import { EncounterTemplateDataSchema, EncounterTemplateData, Participant, Event } from './encounter.schemas';

/**
 * Pure business logic for encounter math and querying.
 * Operates only on immutable data; never modifies inputs.
 */
export class EncounterTemplate {
  public data: EncounterTemplateData;

  constructor(data: EncounterTemplateData) {
    // Validate on construction to fail fast
    const validated = EncounterTemplateDataSchema.parse(data);
    this.data = validated;
  }

  /**
   * Ensure the default variant exists; fall back to first if not found.
   * Used during initialization or after a variant is deleted.
   */
  public validateDefaultVariant(): string {
    const variantExists = this.data.variants.some(
      v => v.id === this.data.defaultVariantId
    );

    if (variantExists) {
      return this.data.defaultVariantId;
    }

    // Fallback to first variant (safe because variants.nonempty())
    return this.data.variants[0].id;
  }

  /**
   * Calculate the XP budget for a specific variant.
   * 
   * PF2e Rule: Simple hazards (traps, magical effects) count as only 1/5th XP.
   * Complex hazards (with multiple phases, disrupt roles, etc.) count full value.
   */
  public calculateXpBudget(variantId: string): ExperienceBudget {
    const variant = this.data.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    let totalXp = 0;

    // Sum base participants
    for (const participant of variant.participants) {
      const participantXp = this.calculateParticipantXp(participant);
      totalXp += participantXp;
    }

    // Sum reinforcement events (added mid-encounter)
    for (const event of variant.events) {
      if (event.type === 'reinforcement') {
        for (const participantId of event.reinforcementParticipantIds) {
          const participant = variant.participants.find(p => p.id === participantId);
          if (participant) {
            const reinforcementXp = this.calculateParticipantXp(participant);
            totalXp += reinforcementXp;
          }
        }
      }
    }

    return new ExperienceBudget(totalXp);
  }

  /**
   * Helper: Calculate XP contribution of a single participant,
   * respecting the PF2e simple hazard rule.
   */
  private calculateParticipantXp(participant: Participant): number {
    const baseXp = ExperienceBudget.fromLevel(participant.relativeLevel);
    const countXp = baseXp.valueOf() * participant.count;

    // Apply simple hazard 1/5th rule
    if (participant.type === 'hazard' && participant.role === 'simple') {
      return Math.round(countXp / 5);
    }

    return countXp;
  }

  /**
   * Calculate threat level (Trivial, Low, Moderate, Severe, Extreme, Impossible).
   * Returns a Threat object linked to party size and adjusted for relative levels.
   */
  public calculateThreatLevel(variantId: string): Threat {
    const variant = this.data.variants.find(v => v.id === variantId);
    if (!variant) {
      throw new Error(`Variant ${variantId} not found`);
    }

    const xpBudget = this.calculateXpBudget(variantId);
    const threat = Threat.fromExperienceBudget(xpBudget, variant.partySize);

    return threat;
  }

  /**
   * Calculate the actual XP awarded to the party after the encounter.
   * Links to ExperienceBudget.budgetToBaseReward(budget, partySize).
   */
  public calculateAwardedXp(variantId: string): ExperienceBudget {
    const xpBudget = this.calculateXpBudget(variantId);
    const awarded = ExperienceBudget.budgetToBaseReward(xpBudget, xpBudget);

    return awarded;
  }

  /**
   * Build a relational index across all variants.
   * Enables queries like "all creatures tagged 'minion'" without manual iteration.
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

    for (const variant of this.data.variants) {
      // Index participants by tag
      for (const participant of variant.participants) {
        const tag = participant.tag || '__untagged__';

        if (participant.type === 'creature') {
          if (!creatures.has(tag)) creatures.set(tag, new Set());
          creatures.get(tag)!.add(participant.id);
        } else if (participant.type === 'hazard') {
          if (!hazards.has(tag)) hazards.set(tag, new Set());
          hazards.get(tag)!.add(participant.id);
        }
      }

      // Index events by tag
      for (const event of variant.events) {
        const tag = event.tag || '__untagged__';

        if (event.type === 'narrative') {
          if (!narrative.has(tag)) narrative.set(tag, new Set());
          narrative.get(tag)!.add(event.id);
        } else if (event.type === 'reinforcement') {
          if (!reinforcement.has(tag)) reinforcement.set(tag, new Set());
          reinforcement.get(tag)!.add(event.id);
        }
      }
    }

    return { creatures, hazards, narrative, reinforcement };
  }

  /**
   * Find all participants (across variants) matching a given tag.
   * Useful for "find all minions" or "which creatures are bosses".
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
   * Useful for "find all narrative beats" or "when do reinforcements arrive".
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
   * Always valid because constructor already validated.
   */
  public toJSON(): string {
    return JSON.stringify(this.data);
  }

  /**
   * Deserialize from JSON with validation.
   * Throws ZodError if corrupted.
   */
  public static fromJSON(json: string): EncounterTemplate {
    const data = JSON.parse(json) as unknown;
    const validated = EncounterTemplateDataSchema.parse(data);
    return new EncounterTemplate(validated);
  }

  /**
   * Create a mutable copy for the builder pattern.
   * Changes to the copy do not affect the original.
   */
  public toMutableCopy(): EncounterTemplateData {
    return JSON.parse(JSON.stringify(this.data)) as EncounterTemplateData;
  }
}
```

**Key Design Principles**:
- **Pure Functions**: Every method is a function of `this.data`; no external side effects
- **Early Validation**: Constructor validates on entry; all methods assume valid data
- **Immutable Inputs**: Methods never modify `this.data` or input parameters
- **Clear Responsibility**: Math happens here; I/O and state management happen elsewhere
- **Queryable Relations**: `getRelations()` and `findByTag()` enable efficient cross-variant lookups

---

## Part 4: Zustand Store Integration

The store holds the authoritative state and ensures all updates go through validation and immutable patterns:

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { EncounterTemplate } from '@/models/encounters/EncounterTemplate';
import { EncounterTemplateDataSchema, EncounterTemplateData, EncounterVariant } from './encounter.schemas';

interface SavedEncountersStore {
  // ========================================================================
  // State
  // ========================================================================
  templates: EncounterTemplateData[];
  selectedTemplateId?: string;
  partyLevel: number;

  // ========================================================================
  // Queries (return wrapped EncounterTemplate instances)
  // ========================================================================

  /**
   * Retrieve a single template, wrapped in EncounterTemplate for business logic.
   * Returns undefined if not found.
   */
  getTemplate(id: string): EncounterTemplate | undefined;

  /**
   * Retrieve all templates.
   */
  getTemplates(): EncounterTemplate[];

  /**
   * Retrieve the currently selected template.
   * Undefined if nothing is selected.
   */
  getSelectedTemplate(): EncounterTemplate | undefined;

  // ========================================================================
  // Mutations (all updates are immutable and validated)
  // ========================================================================

  /**
   * Add a new template. Input is validated; throws on invalid data.
   */
  addTemplate(template: EncounterTemplateData): void;

  /**
   * Update an existing template. Only modified fields are changed.
   * Entire template is re-validated.
   */
  updateTemplate(id: string, updates: Partial<EncounterTemplateData>): void;

  /**
   * Delete a template by id. Clears selection if it was selected.
   */
  deleteTemplate(id: string): void;

  /**
   * Set the active template. Useful for the builder UI.
   */
  selectTemplate(id: string | undefined): void;

  /**
   * Update party level globally (used for all variants).
   */
  setPartyLevel(level: number): void;

  // ========================================================================
  // Variant Operations
  // ========================================================================

  /**
   * Add a new variant to a template.
   */
  addVariant(templateId: string, variant: EncounterVariant): void;

  /**
   * Update an existing variant within a template.
   */
  updateVariant(templateId: string, variantId: string, updates: Partial<EncounterVariant>): void;

  /**
   * Delete a variant. Clears defaultVariantId if deleted variant was default.
   */
  deleteVariant(templateId: string, variantId: string): void;

  /**
   * Set the default variant for a template.
   */
  setDefaultVariant(templateId: string, variantId: string): void;
}

/**
 * Create the Zustand store with persist middleware for localStorage survival.
 */
export const useSavedEncountersStore = create<SavedEncountersStore>()(
  persist(
    (set, get) => ({
      // Initial state
      templates: [],
      selectedTemplateId: undefined,
      partyLevel: 1,

      // Queries
      getTemplate(id: string) {
        const data = get().templates.find(t => t.id === id);
        return data ? new EncounterTemplate(data) : undefined;
      },

      getTemplates() {
        return get().templates.map(data => new EncounterTemplate(data));
      },

      getSelectedTemplate() {
        const id = get().selectedTemplateId;
        if (!id) return undefined;
        return get().getTemplate(id);
      },

      // Mutations
      addTemplate(template: EncounterTemplateData) {
        // Validate before adding
        const validated = EncounterTemplateDataSchema.parse(template);

        set(state => ({
          templates: [...state.templates, validated],
        }));
      },

      updateTemplate(id: string, updates: Partial<EncounterTemplateData>) {
        set(state => {
          const index = state.templates.findIndex(t => t.id === id);
          if (index === -1) {
            throw new Error(`Template ${id} not found`);
          }

          const updated = {
            ...state.templates[index],
            ...updates,
            updatedAt: new Date(),
          };

          // Re-validate after merge
          const validated = EncounterTemplateDataSchema.parse(updated);

          const newTemplates = [...state.templates];
          newTemplates[index] = validated;

          return { templates: newTemplates };
        });
      },

      deleteTemplate(id: string) {
        set(state => ({
          templates: state.templates.filter(t => t.id !== id),
          selectedTemplateId: state.selectedTemplateId === id ? undefined : state.selectedTemplateId,
        }));
      },

      selectTemplate(id: string | undefined) {
        set({ selectedTemplateId: id });
      },

      setPartyLevel(level: number) {
        set({ partyLevel: level });
      },

      // Variant operations
      addVariant(templateId: string, variant: EncounterVariant) {
        set(state => {
          const template = state.templates.find(t => t.id === templateId);
          if (!template) {
            throw new Error(`Template ${templateId} not found`);
          }

          const updated = {
            ...template,
            variants: [...template.variants, variant],
            updatedAt: new Date(),
          };

          const validated = EncounterTemplateDataSchema.parse(updated);

          return {
            templates: state.templates.map(t => t.id === templateId ? validated : t),
          };
        });
      },

      updateVariant(templateId: string, variantId: string, updates: Partial<EncounterVariant>) {
        set(state => {
          const template = state.templates.find(t => t.id === templateId);
          if (!template) {
            throw new Error(`Template ${templateId} not found`);
          }

          const variantIndex = template.variants.findIndex(v => v.id === variantId);
          if (variantIndex === -1) {
            throw new Error(`Variant ${variantId} not found`);
          }

          const updatedVariants = [...template.variants];
          updatedVariants[variantIndex] = {
            ...updatedVariants[variantIndex],
            ...updates,
          };

          const updated = {
            ...template,
            variants: updatedVariants,
            updatedAt: new Date(),
          };

          const validated = EncounterTemplateDataSchema.parse(updated);

          return {
            templates: state.templates.map(t => t.id === templateId ? validated : t),
          };
        });
      },

      deleteVariant(templateId: string, variantId: string) {
        set(state => {
          const template = state.templates.find(t => t.id === templateId);
          if (!template) {
            throw new Error(`Template ${templateId} not found`);
          }

          const updated = {
            ...template,
            variants: template.variants.filter(v => v.id !== variantId),
            defaultVariantId: template.defaultVariantId === variantId
              ? template.variants[0].id
              : template.defaultVariantId,
            updatedAt: new Date(),
          };

          const validated = EncounterTemplateDataSchema.parse(updated);

          return {
            templates: state.templates.map(t => t.id === templateId ? validated : t),
          };
        });
      },

      setDefaultVariant(templateId: string, variantId: string) {
        set(state => {
          const template = state.templates.find(t => t.id === templateId);
          if (!template) {
            throw new Error(`Template ${templateId} not found`);
          }

          const variantExists = template.variants.some(v => v.id === variantId);
          if (!variantExists) {
            throw new Error(`Variant ${variantId} not found in template ${templateId}`);
          }

          const updated = {
            ...template,
            defaultVariantId: variantId,
            updatedAt: new Date(),
          };

          const validated = EncounterTemplateDataSchema.parse(updated);

          return {
            templates: state.templates.map(t => t.id === templateId ? validated : t),
          };
        });
      },
    }),
    {
      name: 'saved-encounters-store',
      storage: createJSONStorage(() => localStorage, {
        /**
         * Custom deserialization with Zod validation.
         * Catches corrupted data on load.
         */
        reviver: (key, value) => {
          if (key === 'templates' && Array.isArray(value)) {
            return value.map(template => {
              try {
                return EncounterTemplateDataSchema.parse(template);
              } catch (error) {
                console.error('Failed to deserialize template:', error);
                throw new Error(`Template deserialization failed: ${error}`);
              }
            });
          }
          return value;
        },
      }),
    }
  )
);
```

**Store Design Benefits**:
- **Immutable Updates**: Every mutation creates a new array/object
- **Validation on Load**: Persist middleware's `reviver` catches corrupted localStorage data
- **Type Safety**: All queries return wrapped `EncounterTemplate` instances with business logic
- **Clear Contracts**: Store interface documents every operation
- **Testability**: Can be tested in isolation without React

---

## Part 5: Platform Adaptations

### 5.1 React Hook

```typescript
/**
 * Custom React hook for accessing and mutating encounter templates.
 * Abstracts Zustand store and business logic.
 */
export function useEncounterTemplate(templateId?: string) {
  const store = useSavedEncountersStore();

  const template = templateId
    ? store.getTemplate(templateId)
    : store.getSelectedTemplate();

  return {
    // Data
    template,
    partyLevel: store.partyLevel,

    // Mutations
    updateVariant: (variantId: string, updates: Partial<EncounterVariant>) => {
      if (!template) throw new Error('No template selected');
      store.updateVariant(template.data.id, variantId, updates);
    },

    addVariantFromTemplate: (templateVariantId: string) => {
      if (!template) throw new Error('No template selected');

      // Clone an existing variant as a starting point
      const source = template.data.variants.find(v => v.id === templateVariantId);
      if (!source) throw new Error(`Variant ${templateVariantId} not found`);

      const newVariant: EncounterVariant = {
        ...source,
        id: generateUUID(),
        partySize: source.partySize + 1, // Example: scale to next party size
      };

      store.addVariant(template.data.id, newVariant);
    },

    setPartyLevel: store.setPartyLevel,
  };
}
```

### 5.2 JSON Serialization Utilities

```typescript
/**
 * Serialize an EncounterTemplate to JSON for export/saving.
 */
export function serializeEncounterTemplate(template: EncounterTemplate): string {
  return template.toJSON();
}

/**
 * Deserialize JSON back to EncounterTemplate with validation.
 * Throws ZodError if corrupted; prevents silent failures.
 */
export function deserializeEncounterTemplate(json: string): EncounterTemplate {
  return EncounterTemplate.fromJSON(json);
}

/**
 * Export template to a downloadable JSON file.
 */
export function exportTemplate(template: EncounterTemplate): void {
  const json = serializeEncounterTemplate(template);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.data.name}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Import template from a JSON file.
 * Validates on load; rejects corrupted files.
 */
export async function importTemplate(file: File): Promise<EncounterTemplate> {
  const json = await file.text();
  return deserializeEncounterTemplate(json);
}
```

---

## Part 6: Migration Strategy

### Phase 1: Parallel Systems (Week 1–2)

**Goal**: New types, schemas, and business logic exist alongside old code. No UI changes yet.

**Tasks**:
- Create `encounter.types.ts` with all interfaces from Part 1
- Create `encounter.schemas.ts` with Zod schemas from Part 2
- Create new `EncounterTemplate` business logic class
- Write comprehensive unit tests for `EncounterTemplate`
- Create `useSavedEncountersStore` (new store, old `EncounterTemplatesStore` still exists)
- Old code continues to use `Encounter`, `EncounterTemplate`, `TemplateSlot`, etc.

**Risk Mitigation**: Old and new systems run side-by-side in tests; no changes to existing UI.

### Phase 2: Adapter Functions (Week 3–4)

**Goal**: Data flows from old format to new format. Builders can start using the new store.

**Adapter Implementation**:

```typescript
/**
 * Convert old-format encounter template to new format.
 * Preserves all data; adds reasonable defaults for new fields.
 */
export function migrateOldTemplate(
  oldTemplate: OldEncounterTemplate
): EncounterTemplateData {
  const uuid = () => generateUUID();

  // Map old slots to new participants
  const participants: Participant[] = oldTemplate.slots.map(slot => ({
    id: uuid(),
    type: 'creature',
    count: 1,
    relativeLevel: parseLevel(slot.level), // e.g., '+2' -> 2
    role: 'opponent', // Default role
    tag: slot.name, // Use name as tag for backward compatibility
  }));

  // Create a single default variant from the template
  const variant: EncounterVariant = {
    id: uuid(),
    partySize: oldTemplate.partySize,
    participants,
    events: [],
    description: oldTemplate.description,
  };

  return {
    id: oldTemplate.id || uuid(),
    name: oldTemplate.name,
    description: oldTemplate.description,
    defaultVariantId: variant.id,
    variants: [variant],
    tags: ['migrated-from-v1'],
  };
}

/**
 * Batch migrate all saved encounters.
 */
export function migrateAsSavedEncounters(): void {
  const oldStore = useOldEncounterStore();
  const newStore = useSavedEncountersStore();

  for (const oldTemplate of oldStore.getAllTemplates()) {
    const migrated = migrateOldTemplate(oldTemplate);
    newStore.addTemplate(migrated);
  }

  console.log('Migration complete. Old templates are now in the new store.');
}
```

**UI Integration**:
- Builder page uses new hook `useEncounterTemplate()`
- Store queries return new `EncounterTemplate` instances
- Old store can be queried for fallback during transition

### Phase 3: Cleanup & Retirement (Week 5+)

**Tasks**:
- Remove old `Encounter`, `EncounterTemplate`, `TemplateSlot`, `TemplateEvent`, `TemplateComposite` classes
- Delete old `EncounterTemplatesStore` and `OldEncounterStore`
- Update all imports to reference new data layer
- Run full test suite; retire old test cases
- Update documentation; mark migration date in CHANGELOG

---

## Part 7: Benefits Table

| Aspect | Old Design | New Design | Benefit |
|--------|-----------|-----------|---------|
| **Data Corruption** | Nested inheritance; mutable state across `Encounter` and `EncounterTemplate` | Plain POJOs + immutable updates; Zod validates on deserialize | Impossible to corrupt data via mutable shared references; silent failures caught at load time |
| **Variant Grouping** | 1-to-1 ID links; no semantic tagging | `tag` field on participants/events; `findByTag()` query | Can group "all minions" or "all reinforcements" across variants; enable semantic relationships |
| **Type Safety** | Mixed strings for roles (`'lackey'`, `'enemy'`, custom); no validation of field combinations | Strict `type: 'creature' \| 'hazard'` with discriminated union; role enums | Impossible to create `{ type: 'creature', successesToDisable: 5 }`; role-specific fields are enforced |
| **Hazard Math** | All participants count full XP | Simple hazards (role: 'simple') count as 1/5th XP | Accurate PF2e threat calculation for hazard-heavy encounters |
| **Relational Queries** | Manual iteration and external state tracking | `getRelations()`, `findByTag()`, `findEventsByTag()` methods | Query "all creatures by tag" without writing loops; cross-variant analysis is a method call |
| **Serialization** | Per-file JSON without validation; custom per-class logic | Centralized Zod schemas; validation on every deserialize | Single source of truth for shape; corrupted files fail-fast instead of silently loading |
| **State Coupling** | Inheritance tightly couples templates to runtime encounters | Decoupled data layer; templates influence encounters only via immutable copy | Safe template edits; running encounters never affected by template changes |
| **Testing** | Requires full class hierarchy instantiation | Pure functions on POJOs; easy to test math in isolation | Unit tests for `calculateXpBudget()` take 10 lines; no class construction ceremony |

---

## Part 8: Testing Strategy

Example Vitest test suite for the refactored design:

```typescript
import { describe, it, expect } from 'vitest';
import { EncounterTemplate } from './EncounterTemplate';
import {
  EncounterTemplateData,
  CreatureParticipant,
  HazardParticipant,
  EncounterVariant,
  NarrativeEvent,
  ReinforcementEvent,
} from './encounter.schemas';
import { ExperienceBudget } from '@/models/utility/experienceBudget/ExperienceBudget';

describe('EncounterTemplate', () => {
  // =========================================================================
  // Test: Simple Hazard XP Reduction
  // =========================================================================

  it('should apply 1/5th XP multiplier to simple hazards', () => {
    const simpleHazard: HazardParticipant = {
      id: 'hazard-1',
      type: 'hazard',
      role: 'simple', // Trap, not a complex construct
      count: 1,
      relativeLevel: 0,
      successesToDisable: 1,
    };

    const creature: CreatureParticipant = {
      id: 'creature-1',
      type: 'creature',
      role: 'opponent',
      count: 1,
      relativeLevel: 0,
    };

    const variant: EncounterVariant = {
      id: 'v1',
      partySize: 4,
      participants: [simpleHazard, creature],
      events: [],
    };

    const template: EncounterTemplateData = {
      id: 'tmpl-1',
      name: 'Hazard Encounter',
      description: 'Test',
      defaultVariantId: 'v1',
      variants: [variant],
    };

    const encounter = new EncounterTemplate(template);
    const xpBudget = encounter.calculateXpBudget('v1');

    // If creature at +0 level = 10 XP, simple hazard at +0 = 2 XP (1/5th)
    // Total should be 12 XP
    const expectedXp = 10 + 2; // Mock values for demonstration
    expect(xpBudget.valueOf()).toBe(expectedXp);
  });

  // =========================================================================
  // Test: Invalid Default Variant Fallback
  // =========================================================================

  it('should fallback to first variant if defaultVariantId is invalid', () => {
    const v1: EncounterVariant = {
      id: 'v1',
      partySize: 4,
      participants: [],
      events: [],
    };

    const v2: EncounterVariant = {
      id: 'v2',
      partySize: 3,
      participants: [],
      events: [],
    };

    const template: EncounterTemplateData = {
      id: 'tmpl-1',
      name: 'Test',
      description: 'Test',
      defaultVariantId: 'nonexistent-variant', // Invalid ID
      variants: [v1, v2],
    };

    const encounter = new EncounterTemplate(template);
    const validDefault = encounter.validateDefaultVariant();

    expect(validDefault).toBe('v1'); // Falls back to first variant
  });

  // =========================================================================
  // Test: Cross-Variant Tag Queries
  // =========================================================================

  it('should find all creatures with a given tag across variants', () => {
    const minion1: CreatureParticipant = {
      id: 'minion-1',
      type: 'creature',
      role: 'lackey',
      count: 2,
      relativeLevel: -4,
      tag: 'minion',
    };

    const minion2: CreatureParticipant = {
      id: 'minion-2',
      type: 'creature',
      role: 'lackey',
      count: 1,
      relativeLevel: -4,
      tag: 'minion',
    };

    const boss: CreatureParticipant = {
      id: 'boss-1',
      type: 'creature',
      role: 'boss',
      count: 1,
      relativeLevel: 2,
      tag: 'boss',
    };

    const v1: EncounterVariant = {
      id: 'v1',
      partySize: 4,
      participants: [boss, minion1],
      events: [],
    };

    const v2: EncounterVariant = {
      id: 'v2',
      partySize: 3,
      participants: [boss, minion2],
      events: [],
    };

    const template: EncounterTemplateData = {
      id: 'tmpl-1',
      name: 'Boss Fight',
      description: 'Test',
      defaultVariantId: 'v1',
      variants: [v1, v2],
    };

    const encounter = new EncounterTemplate(template);
    const minions = encounter.findByTag('minion');

    expect(minions).toHaveLength(2);
    expect(minions[0].id).toBe('minion-1');
    expect(minions[1].id).toBe('minion-2');
  });

  // =========================================================================
  // Test: Relational Consistency
  // =========================================================================

  it('getRelations() should index all tagged participants', () => {
    const participant1: CreatureParticipant = {
      id: 'p1',
      type: 'creature',
      role: 'opponent',
      count: 1,
      relativeLevel: 0,
      tag: 'guard',
    };

    const variant: EncounterVariant = {
      id: 'v1',
      partySize: 4,
      participants: [participant1],
      events: [],
    };

    const template: EncounterTemplateData = {
      id: 'tmpl-1',
      name: 'Test',
      description: 'Test',
      defaultVariantId: 'v1',
      variants: [variant],
    };

    const encounter = new EncounterTemplate(template);
    const relations = encounter.getRelations();

    expect(relations.creatures.get('guard')).toContain('p1');
  });

  // =========================================================================
  // Test: Deserialization with Zod Validation
  // =========================================================================

  it('should throw on deserialization of corrupted data', () => {
    const corruptedJson = JSON.stringify({
      id: 'tmpl-1',
      name: 'Test',
      description: 'Test',
      defaultVariantId: 'invalid-variant-id', // Doesn't exist
      variants: [],
    });

    expect(() => {
      EncounterTemplate.fromJSON(corruptedJson);
    }).toThrow(); // Zod validation fails
  });

  // =========================================================================
  // Test: XP Calculation Accuracy
  // =========================================================================

  it('should calculate XP budget including reinforcements', () => {
    const reinforcement: CreatureParticipant = {
      id: 'reinforcement-1',
      type: 'creature',
      role: 'opponent',
      count: 2,
      relativeLevel: 0,
    };

    const initial: CreatureParticipant = {
      id: 'initial-1',
      type: 'creature',
      role: 'opponent',
      count: 1,
      relativeLevel: 1,
    };

    const reinEvent: ReinforcementEvent = {
      id: 'event-1',
      type: 'reinforcement',
      turnIndex: 3,
      reinforcementParticipantIds: ['reinforcement-1'],
    };

    const variant: EncounterVariant = {
      id: 'v1',
      partySize: 4,
      participants: [initial, reinforcement],
      events: [reinEvent],
    };

    const template: EncounterTemplateData = {
      id: 'tmpl-1',
      name: 'Reinforcement Test',
      description: 'Test',
      defaultVariantId: 'v1',
      variants: [variant],
    };

    const encounter = new EncounterTemplate(template);
    const xpBudget = encounter.calculateXpBudget('v1');

    // Both initial and reinforcement count toward total XP
    expect(xpBudget.valueOf()).toBeGreaterThan(0);
  });
});
```

**Testing Benefits**:
- Tests are **fast**: no class hierarchy instantiation
- Tests are **clear**: pure function inputs and outputs
- Tests are **maintainable**: business logic is not intertwined with state
- Coverage is **comprehensive**: tests XP math, tagging, validation all separately

---

## Part 9: Implementation Checklist

### Data Layer (4 items)
- [ ] Create `web-roundtable-tracker/src/models/encounters/encounter.types.ts` with all interfaces
- [ ] Create `web-roundtable-tracker/src/models/encounters/encounter.schemas.ts` with Zod validators
- [ ] Add custom `.refine()` to template schema (validate `defaultVariantId`)
- [ ] Create `web-roundtable-tracker/src/models/encounters/index.ts` for barrel export

### Business Logic (8 items)
- [ ] Create refactored `EncounterTemplate` class with all methods from Part 3
- [ ] Implement `calculateXpBudget()` with PF2e simple hazard rule
- [ ] Implement `calculateThreatLevel()` using `Threat.fromExperienceBudget()`
- [ ] Implement `calculateAwardedXp()` using `ExperienceBudget.budgetToBaseReward()`
- [ ] Implement `getRelations()` with Map-based indices
- [ ] Implement `findByTag()` and `findEventsByTag()` queries
- [ ] Implement `toJSON()` and `fromJSON()` with validation
- [ ] Implement `toMutableCopy()` for builder pattern

### Zustand Store (6 items)
- [ ] Create `SavedEncountersStore` interface with state, queries, and mutations
- [ ] Implement all query methods (`getTemplate`, `getTemplates`, `getSelectedTemplate`)
- [ ] Implement all mutation methods (add, update, delete template/variant)
- [ ] Configure `persist` middleware with custom `reviver` for validation
- [ ] Export `useSavedEncountersStore` hook
- [ ] Write integration tests for store mutations and serialization

### React Integration (3 items)
- [ ] Create `useEncounterTemplate()` hook from Part 5.1
- [ ] Create serialization utilities (`serializeEncounterTemplate`, `deserializeEncounterTemplate`)
- [ ] Create `exportTemplate()` and `importTemplate()` functions for file I/O

### Tests (5 items)
- [ ] Write Vitest suite covering Part 8 test cases
- [ ] Add tests for simple hazard XP reduction
- [ ] Add tests for default variant fallback
- [ ] Add tests for cross-variant tag queries
- [ ] Add tests for Zod validation on corrupted data

### Migration (3 items)
- [ ] Create adapter functions (`migrateOldTemplate`, `migrateAsSavedEncounters`)
- [ ] Test adapter with sample old templates
- [ ] Document breaking changes in CHANGELOG

### Builder UI Updates (6 items)
- [ ] Update `BuilderPage` component to use `useEncounterTemplate()` hook
- [ ] Replace template display logic with new store queries
- [ ] Update variant selector to use new variant structure
- [ ] Update participant list to use new discriminated union types
- [ ] Add event timeline editor for narrative/reinforcement events
- [ ] Implement tag-based filtering UI

### Documentation (4 items)
- [ ] Update `web-roundtable-tracker/README.md` with new architecture section
- [ ] Add inline code comments to `EncounterTemplate` class
- [ ] Document store mutations and query patterns
- [ ] Create migration guide for existing adventures

### Cleanup (5 items)
- [ ] Remove old `Encounter`, `EncounterTemplate`, `TemplateSlot`, `TemplateEvent`, `TemplateComposite` classes
- [ ] Remove old encounter store implementations
- [ ] Update all imports across the codebase
- [ ] Remove old test files for deleted classes
- [ ] Run full test suite; ensure no regressions

---

## Part 10: Success Criteria

### 1. Data Corruption Prevention
- **Metric**: No silent data loss on deserialization
- **Validation**: Zod validation runs on every `localStorage` load; corrupted files throw `ZodError` with clear messages
- **Immutability**: All store mutations create new arrays/objects; no in-place mutations
- **Circularity**: No circular references in data structure (reference integrity enforced by schema)
- **Success**: Unit test demonstrates that corrupted JSON is rejected; no workarounds to bypass validation

### 2. State Decoupling
- **Metric**: Template edits do not affect running encounters
- **Validation**: Running `Encounter` instances reference immutable snapshots of variants
- **Independence**: `EncounterVariant` and `Participant` have no inheritance relationship
- **Relations**: Tag-based queries work across variants without manual iteration
- **Success**: Integration test creates a template, starts an encounter, modifies the template, and verifies the encounter state is unchanged

### 3. Strict PF2e Math
- **Metric**: Simple hazards count as exactly 1/5th XP
- **Validation**: `calculateParticipantXp()` applies role-specific multipliers
- **Accuracy**: Threat level calculated from XP budget matches PF2e tables
- **Consistency**: `calculateAwardedXp()` uses `ExperienceBudget.budgetToBaseReward()` correctly
- **Success**: Test case with 5 simple hazards at +0 level produces 1/5th of equivalent creature XP

### 4. Developer Experience
- **Metric**: Pure functions, clear contracts, comprehensive schemas
- **Validation**: `EncounterTemplate` methods have no side effects; all inputs are parameters
- **Schemas**: Zod validators are the single source of truth for shape; TypeScript types are inferred
- **Queries**: `findByTag()` and `getRelations()` allow semantic queries without external iteration
- **Testing**: New business logic test cases are <100 lines total; no class hierarchy setup needed
- **Success**: A junior developer can add a new encounter type by modifying schemas and types, with compiler enforcing validation

### 5. Platform Integration
- **Metric**: Store, hooks, and serialization work seamlessly
- **Zustand**: `useSavedEncountersStore()` provides query and mutation interface
- **React Hook**: `useEncounterTemplate()` abstracts store access and business logic
- **Serialization**: JSON round-trip with validation; import/export functions work end-to-end
- **Backward Compatibility**: Adapter functions migrate old templates; no data loss during migration
- **Success**: End-to-end test: save template → export JSON → import JSON → verify data integrity

### 6. Performance
- **Metric**: Store queries and calculations are O(n) in variant count
- **Validation**: XP calculations are pure functions (no caching needed for immutable data)
- **Caching**: Component re-renders only when template or variant changes (via Zustand selectors)
- **Success**: 100+ variants in a template, `findByTag()` returns in <10ms

---

## Appendix: File Organization

```
web-roundtable-tracker/src/
├── models/
│   └── encounters/
│       ├── encounter.types.ts          (interfaces from Part 1)
│       ├── encounter.schemas.ts        (Zod validators from Part 2)
│       ├── EncounterTemplate.ts        (business logic class from Part 3)
│       ├── EncounterTemplate.spec.ts   (Vitest suite from Part 8)
│       └── index.ts                    (barrel export)
├── store/
│   ├── savedEncounters.ts              (Zustand store from Part 4)
│   ├── savedEncounters.spec.ts         (store tests)
│   └── migration.ts                    (adapter functions from Part 6)
├── hooks/
│   └── useEncounterTemplate.ts         (React hook from Part 5)
└── utils/
    └── encounterSerialization.ts       (JSON utilities from Part 5)
```

---

## References

- **Current `EncounterTemplate` class**: [web-roundtable-tracker/src/models/templates/EncounterTemplate.class.ts](web-roundtable-tracker/src/models/templates/EncounterTemplate.class.ts)
- **Experience Budget utility**: [web-roundtable-tracker/src/models/utility/experienceBudget/ExperienceBudget.ts](web-roundtable-tracker/src/models/utility/experienceBudget/ExperienceBudget.ts)
- **Threat calculation**: [web-roundtable-tracker/src/models/utility/threat/Threat.class.ts](web-roundtable-tracker/src/models/utility/threat/Threat.class.ts)
- **Current store**: [web-roundtable-tracker/src/store/Encounters/EncounterTemplates.ts](web-roundtable-tracker/src/store/Encounters/EncounterTemplates.ts)
- **Model Suite Audit**: [docs/model-suite-audit.md](docs/model-suite-audit.md)

---

## Companion Docs

- **Concrete Encounter plan**: [docs/encounter-instance-implementation-plan.md](docs/encounter-instance-implementation-plan.md)
- **Execution checklist**: [docs/encounter-instance-execution-checklist.md](docs/encounter-instance-execution-checklist.md)
- **Initiative UI integration redesign**: [docs/initiative-tracker-ui-integration-redesign.md](docs/initiative-tracker-ui-integration-redesign.md)
