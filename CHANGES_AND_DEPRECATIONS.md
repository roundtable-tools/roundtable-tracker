# Changes Made & Deprecations Document

## Session Summary

This document records all changes made in the encounter builder schema implementation session and all items marked for future removal.

---

## Part 1: All Changes Made

### Core Data Layer Files (3 files, 391 lines)

**File 1: encounter.types.ts** (141 lines)
- Location: `web-roundtable-tracker/src/models/encounters/encounter.types.ts`
- Purpose: TypeScript interfaces for all encounter domain types
- Contents:
  - Role type literals: `CreatureRole`, `HazardRole`, `AccomplishmentLevel`
  - Participant types: `BaseParticipant`, `CreatureParticipant`, `HazardParticipant` (discriminated union)
  - Event types: `NarrativeEvent`, `ReinforcementEvent` (discriminated union)
  - Template types: `EncounterVariant`, `EncounterTemplateData`
- Status: ✅ Complete and verified

**File 2: encounter.schemas.ts** (126 lines)
- Location: `web-roundtable-tracker/src/models/encounters/encounter.schemas.ts`
- Purpose: Zod runtime validation schemas (single source of truth for shape validation)
- Contents:
  - Role schemas with enum + string union for custom roles
  - Discriminated union schemas for `Participant` and `Event`
  - Custom `.refine()` validation ensuring `defaultVariantId` references existing variant
  - Complete schema coverage with `.nonempty()` constraints on required arrays
- Status: ✅ Complete and verified

**File 3: migrate.adapter.ts** (209 lines)
- Location: `web-roundtable-tracker/src/models/encounters/migrate.adapter.ts`
- Purpose: Convert legacy old-format templates to new format
- Key Functions:
  - `migrateOldTemplate(oldTemplate)` - single template conversion with validation
  - `migrateOldTemplates(oldTemplates[])` - batch migration
  - `inferCreatureRole(name)` - intelligent role inference from name
  - `parseRelativeLevel(levelStr)` - parse "+2" / "-4" strings to numbers
  - `isValidUUID(str)` - UUID validation regex
- Migration Logic:
  - Old participant names → new `tag` field
  - Old difficulty label → new `tags` array
  - Creature roles inferred from name with fallbacks
  - Hazards default to 'complex' if not specified
  - All IDs validated and regenerated if invalid
- Status: ✅ Complete and verified

### Business Logic Files (1 file, 224 lines)

**File 4: EncounterTemplate.ts** (224 lines)
- Location: `web-roundtable-tracker/src/models/encounters/EncounterTemplate.ts`
- Purpose: Pure business logic class operating on immutable data
- Methods Implemented (10 total):
  1. `constructor(data)` - validates input via Zod schema, fails fast
  2. `validateDefaultVariant()` - ensures default variant exists, falls back to first
  3. `calculateXpBudget(variantId)` - XP math with **PF2e simple hazard rule** (1/5 multiplier)
  4. `calculateParticipantXp(participant)` - helper with role-specific XP weighting
  5. `calculateThreatLevel(variantId)` - converts XP budget to threat (0-10)
  6. `calculateAwardedXp(variantId)` - party XP award from budget
  7. `getRelations()` - builds cross-variant index (creatures, hazards, narrative, reinforcement)
  8. `findByTag(tag)` - finds all participants with given tag across variants
  9. `findEventsByTag(tag)` - finds all events with given tag across variants
  10. `toJSON()` / `fromJSON()` / `toMutableCopy()` - serialization with validation
- Design Principles:
  - All methods are pure functions (no side effects)
  - No mutation of input or internal state after construction
  - Validation happens at construction time for fail-fast error detection
  - Data layer never modified outside constructor
- Status: ✅ Complete with 24 passing tests

### Enhancement to Existing File (1 file, +37 lines)

**File 5: ExperienceBudget.ts** (lines 35-71 added)
- Location: `web-roundtable-tracker/src/models/utility/experienceBudget/ExperienceBudget.ts`
- Addition: Static `fromLevel(relativeLevel: number): ExperienceBudget` method
- Purpose: Convert relative level (-4 to +N) to XP using PF2e scaling rules
- Implementation Details:
  - Base: 40 XP at level 0
  - Even levels: multiply by 2^(level/2)
  - Odd levels: multiply by 1.5 × 2^((level-1)/2)
  - Negative levels: inverse calculation (0.5x, 0.75x, etc.)
  - Levels < -4: return 0 XP (creatures too weak to award experience)
- Status: ✅ Complete and tested

### Test Files (2 files, 889 lines total, 52 test cases)

**File 6: EncounterTemplate.spec.ts** (580 lines)
- Location: `web-roundtable-tracker/src/models/encounters/EncounterTemplate.spec.ts`
- Test Coverage: 24 test cases organized in 9 describe blocks
  - Construction and Validation (3 tests)
  - Default Variant Validation (2 tests)
  - XP Budget Calculation (5 tests including simple hazard multiplier)
  - Threat Level Calculation (2 tests)
  - Awarded XP Calculation (1 test)
  - Relational Queries (2 tests)
  - Tag-Based Queries (3 tests)
  - Serialization (4 tests)
  - Immutability (2 tests)
- Helper Functions:
  - `createTestTemplate(overrides)` - generates valid template with defaults
  - `createCreature(overrides)` - participant factory
  - `createHazard(overrides)` - participant factory
- Status: ✅ All 24 tests passing

**File 7: migrate.adapter.spec.ts** (309 lines)
- Location: `web-roundtable-tracker/src/models/encounters/migrate.adapter.spec.ts`
- Test Coverage: 28 test cases across 6 describe blocks
  - Fixture 1 (simple template): 6 tests
  - Fixture 2 (multi-variant): 4 tests
  - Fixture 3 (hazard-heavy): 5 tests
  - Fixture 4 (with events): 3 tests
  - Fixture 5 (edge case): 3 tests
  - Batch migration: 3 tests
  - Data preservation: 4 tests
- Validation Utility: `validateMigration()` helper checks:
  - Name preservation
  - Variant count validity
  - Participant count
  - UUID format compliance
  - Required field presence
- Test Fixtures:
  - simpleTemplateFixture
  - multiVariantTemplateFixture
  - hazardTemplateFixture
  - eventTemplateFixture
  - edgeCaseTemplateFixture
- Status: ✅ All 28 tests passing

**File 8: __fixtures__/oldTemplates.ts** (236 lines)
- Location: `web-roundtable-tracker/src/models/encounters/__fixtures__/oldTemplates.ts`
- Purpose: Test data representing various old-format template types
- Fixtures (5 total):
  1. Simple template: boss + 4 lackeys (basic single-variant)
  2. Multi-variant: same encounter at 3 party sizes
  3. Hazard-heavy: mix of simple and complex hazards with creatures
  4. With events: reinforcement and narrative events
  5. Edge case: minimal fields, optional handling
- Status: ✅ All used by migration tests

### Documentation Files (4 files, 2,396 lines total)

**File 9: encounter-template-refactor-plan.md** (1,523 lines)
- Location: `docs/encounter-template-refactor-plan.md`
- 10-part architecture plan:
  - Part 1: Core Types & Literals (with CreatureRole/HazardRole/Participant details)
  - Part 2: Zod Validation Schemas (complete schema definitions with examples)
  - Part 3: EncounterTemplate Business Logic (method-by-method specification)
  - Part 4: Zustand Store Integration (SavedEncountersStore interface and implementation)
  - Part 5: Platform Adaptations (React hook, JSON utilities)
  - Part 6: Migration Strategy (3-phase approach: parallel, adapter, cleanup)
  - Part 7: Benefits Table (old vs new comparison on 8 dimensions)
  - Part 8: Testing Strategy (Vitest examples and patterns)
  - Part 9: Implementation Checklist (34 items organized by category)
  - Part 10: Success Criteria (6 measurable objectives)
- Appendix: File organization and references
- Status: ✅ Complete specification document

**File 10: encounter-instance-implementation-plan.md** (326 lines)
- Location: `docs/encounter-instance-implementation-plan.md`
- Purpose: Next-phase plan after EncounterTemplate (concrete encounter instances)
- Sections:
  - Purpose & Scope (diff layer over templates)
  - Architecture diagram
  - Opt-In Stat Interfaces (CreatureStats, HazardStats, NarrativeStats)
  - Repository Contracts (entity persistence patterns)
  - Instance Models (EncounterParticipantInstance, EncounterEventInstance)
  - Resolution Engine (deterministic merge order)
  - Builder Service Integration
  - Acceptance Criteria
- Status: ✅ Complete for Phase 1 planning

**File 11: encounter-instance-execution-checklist.md** (62 lines)
- Location: `docs/encounter-instance-execution-checklist.md`
- Purpose: Execution checklist for concrete instance implementation
- 6 Phases Defined:
  1. Domain Contracts (type creation)
  2. Encounter Diff Model (instance data structures)
  3. Resolution Engine (merge logic)
  4. Builder Integration (UI wiring)
  5. Tests (comprehensive coverage)
  6. Verification Commands (build/test validation)
- Risk Controls section included
- Status: ✅ Complete checklist

**File 12: initiative-tracker-ui-integration-redesign.md** (305 lines)
- Location: `docs/initiative-tracker-ui-integration-redesign.md`
- Purpose: UI integration pattern for InitiativeTracker with Zustand adapter
- Sections:
  - Context Alignment (current tech stack)
  - Target Outcome
  - File Plan (5 files to create/update)
  - State Initialization (trackerUiStore with revision bumping)
  - Initialization Wiring in React
  - CombatList Component implementation
  - RoundEventBanner Component
  - Separation of Concerns
  - Migration Steps
  - Validation Checklist
- Status: ✅ Complete design document

**File 13: model-suite-audit.md** (180 lines)
- Location: `docs/model-suite-audit.md`
- Purpose: Audit of current OO model suite and structural problems
- Sections:
  - Current Model Map (what exists now: Actor, Encounter, Initiative layers)
  - Core Problems (7 issues categorized by severity)
  - Duplication and Contradiction Index
  - Streamlined Working Language (naming conventions)
  - Immediate Triage (blockers vs debt)
  - Minimal Stability Checklist (5 rules)
- High Severity Issues (3):
  - H1: Event classes don't implement required `name`
  - H2: Double-reconstruction of participants
  - H3: Self-parent semantics in InitiativeParticipant
- Medium Severity Issues (4):
  - M1-M4: Name collisions, contract drift, truncation, placeholders
- Status: ✅ Complete audit documentation

---

## Part 2: All Deprecations Marked for Future Removal

### Phase 3/4 Retirement: Old OO Classes (5 classes)

Marked in: `docs/encounter-template-refactor-plan.md` lines 1078-1081, 1431-1434

| Class | Location | Timeline | Reason |
|-------|----------|----------|--------|
| `Encounter` | `src/models/encounters/Encounter.class.ts` | Phase 4 | Replaced by new data-driven EncounterTemplate |
| `EncounterTemplate` (old) | `src/models/templates/EncounterTemplate.class.ts` | Phase 4 | Replaced by new immutable POJO + EncounterTemplate class |
| `TemplateSlot` | `src/models/templates/TemplateSlot.class.ts` | Phase 4 | Replaced by Participant discriminated union |
| `TemplateEvent` | `src/models/actors/event/TemplateEvent.class.ts` | Phase 4 | Replaced by NarrativeEvent/ReinforcementEvent types |
| `TemplateComposite` | `src/models/templates/TemplateComposite.class.ts` | Phase 4 | Replaced by EncounterTemplate composition handling |

### Phase 3/4 Retirement: Old Store Implementations (2 stores)

| Store | Location | Timeline | Reason |
|-------|----------|----------|--------|
| `EncounterTemplatesStore` (old) | `src/store/Encounters/EncounterTemplates.ts` | Phase 4 | Replaced by Zustand SavedEncountersStore |
| `OldEncounterStore` | `src/store/*` | Phase 4 | Replaced by immutable Zustand patterns |

### Code-Level TODOs & Placeholders (6 items marked)

1. **ReinforcementEvent.class.ts** (Line 17-20)
   - Code: `//TODO: trigger resume on all participants`
   - Impact: `begin()` method incomplete
   - Status: Stub implementation
   - Resolution: Implement resume trigger logic

2. **Event.class.ts** (Lines 17-32)
   - Methods `pause()`, `resume()`, `start()`, `stop()`, `begin()`, `end()`
   - Impact: Lifecycle actions are placeholders
   - Status: No-op implementations
   - Resolution: Implement domain actions

3. **ConditionEvent.class.ts** (Lines 16-29)
   - Methods `pause()`, `resume()`, `begin()`, `end()`
   - Impact: Conditional event logic incomplete
   - Status: Stub implementations
   - Resolution: Implement condition checking

4. **RoundParticipant.class.ts** (Lines 25-28)
   - Methods `begin()`, `end()`
   - Impact: Round action logic missing
   - Status: Empty implementations
   - Resolution: Implement round turn logic

5. **Participant.class.ts** (Lines 25-40)
   - Methods `pause()`, `resume()`, `start()`, `stop()`, `begin()`, `end()`, `act()`
   - Impact: Combat actions are no-ops
   - Status: Placeholder implementations
   - Resolution: Implement action resolution

6. **ActivityType.ts** (Lines 4, 6)
   - Label mapping declared twice
   - Impact: Redundant complexity
   - Status: Duplicate definitions
   - Resolution: Consolidate into single definition

### Compatibility Shims (1 planned but not yet created)

From `memories/repo/encounter-builder-plan.md` Line 9:

| Item | Status | Timeline | Note |
|------|--------|----------|------|
| `AbstractEncounter → EncounterTemplate` alias | Planned | Phase 1 | Temporary for transition period; optional for backward compatibility |

### Structural Debt Identified (7 issues from Model Audit)

**High Severity (must fix before major use):**
1. **H1**: Event hierarchy doesn't implement required `name` from Actor base
2. **H2**: Encounter participant objects reconstructed twice (H2)
3. **H3**: InitiativeParticipant has self-parent semantics

**Medium Severity (should fix before Phase 2):**
4. **M1**: 4 name collisions between OO classes and store types:
   - `Participant` (OO class vs store type)
   - `InitiativeParticipant` (OO class vs store type)
   - `EncounterTemplate` (OO class vs store type)
   - `Encounter` (OO class vs store type)
5. **M2**: Type contract drift (UUID vs string in template lookup APIs)
6. **M3**: Initiative construction silently truncates on mismatch
7. **M4**: Many placeholder action lifecycle methods

**Low Severity (housekeeping):**
- L1: Repeated definitions in ActivityType
- L2: Orphan action naming (actLabel on ReinforcementEvent)
- L3: Domain methods produce console side effects

### Breaking Changes Planned

**Location**: `docs/encounter-template-refactor-plan.md` Line 1414

**Task**: Document breaking changes in CHANGELOG before Phase 4 merge

**Expected Breaking Changes**:
- Mutable class API → immutable POJO + pure functions (not backward compatible)
- Template constructors no longer accept self-reference during init
- Variants accessed by explicit ID, not implicit inheritance
- Store interface changes (old `EncounterTemplatesStore` → new `SavedEncountersStore`)

---

## Migration Timeline

| Phase | Timeline | Status | Actions |
|-------|----------|--------|---------|
| **Phase 0: Audit & Validation** | Complete | ✅ Done | New types, schemas, migration adapter, comprehensive tests (all passing) |
| **Phase 1: Parallel Systems** | Weeks 2-3 | ⏳ Next | Build Zustand store, useEncounterTemplate hook, wire UI |
| **Phase 2: Dry-Run Validation** | Week 4 | 📋 Planned | Full migration validation, integrity checks |
| **Phase 3: Gradual UI Adoption** | Week 5+ | 📋 Planned | Feature flag, component-by-component cutover |
| **Phase 4: Retirement** | Week 6+ | 📋 Planned | **Remove** 5 classes, 2 stores, old tests; update CHANGELOG |

---

## Test Results Summary

| Test File | Tests | Passed | Failed | Status |
|-----------|-------|--------|--------|--------|
| EncounterTemplate.spec.ts | 24 | 24 | 0 | ✅ All passing |
| migrate.adapter.spec.ts | 28 | 28 | 0 | ✅ All passing |
| **Total** | **52** | **52** | **0** | **✅ 100%** |

Full web app test suite: 252 tests across 31 files, all passing

---

## File Statistics

| Category | Count | Lines |
|----------|-------|-------|
| Implementation Files | 5 | 732 |
| Test Files | 2 | 889 |
| Test Fixtures | 1 | 236 |
| Documentation Files | 4 | 2,396 |
| **Total** | **12** | **4,253** |

---

## References

- **Canonical Plan**: `/memories/repo/encounter-builder-plan.md`
- **Implementation Checklist**: Part 9 of `docs/encounter-template-refactor-plan.md`
- **Phase 0 Status**: All migration tests passing, zero data loss verified
- **Next Task**: Phase 1 Zustand store development
