# Deprecation Schedule

This document lists all items marked for future removal or deprecation across the Roundtable Tracker codebase.

## Phase 3/4 Removals (Week 5-6+)

### Old Object-Oriented Classes (5 items)
These classes are being replaced by the new immutable POJO + pure function architecture.

- [ ] `Encounter` class (`src/models/encounters/Encounter.class.ts`)
  - Replaced by: New EncounterTemplate + instance data layer
  - Impact: Changes to encounter instantiation and manipulation
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

- [ ] `EncounterTemplate` class (old) (`src/models/templates/EncounterTemplate.class.ts`)
  - Replaced by: New EncounterTemplate business logic class + EncounterTemplateData POJO
  - Impact: Template creation and management refactored
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

- [ ] `TemplateSlot` class (`src/models/templates/TemplateSlot.class.ts`)
  - Replaced by: Participant discriminated union (CreatureParticipant | HazardParticipant)
  - Impact: Participant handling uses new discriminated union types
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

- [ ] `TemplateEvent` class (`src/models/actors/event/TemplateEvent.class.ts`)
  - Replaced by: NarrativeEvent and ReinforcementEvent types
  - Impact: Event creation and handling refactored
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

- [ ] `TemplateComposite` class (`src/models/templates/TemplateComposite.class.ts`)
  - Replaced by: EncounterTemplate composition handling
  - Impact: Variant composition uses new structure
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

### Old Store Implementations (2 items)
These are being replaced by new Zustand-based stores with immutable update patterns.

- [ ] `EncounterTemplatesStore` (old implementation) (`src/store/Encounters/EncounterTemplates.ts`)
  - Replaced by: `useSavedEncountersStore` (Zustand)
  - Impact: Store interface and mutation patterns change
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

- [ ] `OldEncounterStore` (`src/store/*`)
  - Replaced by: New immutable encounter data store
  - Impact: Encounter state management patterns change
  - Status: Parallel system running (Phase 0-2), retire in Phase 4

### Old Test Files (all tests for deleted classes)
- [ ] `src/models/encounters/Encounter.spec.ts` (old tests)
- [ ] `src/models/templates/EncounterTemplate.spec.ts` (old tests)
- [ ] `src/models/templates/TemplateSlot.spec.ts` (old tests)
- [ ] `src/models/actors/event/TemplateEvent.spec.ts` (old tests)
- [ ] `src/store/Encounters/EncounterTemplates.old.spec.ts` (old tests)

## Code-Level TODOs and Placeholders (6 items)

These are incomplete implementations that need work before the code is considered production-ready.

- [ ] **ReinforcementEvent.class.ts** (Line 17-20)
  - Issue: `//TODO: trigger resume on all participants`
  - Location: `src/models/actors/event/ReinforcementEvent.class.ts`
  - Impact: `begin()` method doesn't complete reinforcement resumption
  - Fix: Implement proper participant resume trigger logic

- [ ] **Event.class.ts lifecycle methods** (Lines 17-32)
  - Issue: `pause()`, `resume()`, `start()`, `stop()`, `begin()`, `end()` are no-ops
  - Location: `src/models/actors/event/Event.class.ts`
  - Impact: Event lifecycle is non-functional
  - Fix: Implement domain action logic for each lifecycle method

- [ ] **ConditionEvent.class.ts lifecycle methods** (Lines 16-29)
  - Issue: Stub implementations of lifecycle methods
  - Location: `src/models/actors/event/ConditionEvent.class.ts`
  - Impact: Conditional event triggering doesn't work
  - Fix: Implement condition checking and event triggering

- [ ] **RoundParticipant.class.ts turn actions** (Lines 25-28)
  - Issue: `begin()` and `end()` methods are empty
  - Location: `src/models/actors/participant/RoundParticipant.class.ts`
  - Impact: Round participation actions are non-functional
  - Fix: Implement turn begin/end action logic

- [ ] **Participant.class.ts action methods** (Lines 25-40)
  - Issue: `pause()`, `resume()`, `start()`, `stop()`, `begin()`, `end()`, `act()` are placeholders
  - Location: `src/models/actors/participant/Participant.class.ts`
  - Impact: Participant combat actions are non-functional
  - Fix: Implement full action resolution for each method

- [ ] **ActivityType.ts duplicated definitions** (Lines 4, 6)
  - Issue: Label mapping defined twice
  - Location: `src/models/utility/activity/Activity.ts`
  - Impact: Redundant code, potential for divergence
  - Fix: Consolidate into single definition

## Structural Debt (7 issues from Model Suite Audit)

These are architectural problems that should be addressed in the next major refactoring phase.

### High Severity (must fix before significant expansion)
- [ ] **H1: Event hierarchy doesn't implement Actor contract**
  - Problem: `Event` and `ConditionEvent` extend `Actor` but don't implement required `name` property
  - Location: `src/models/actors/event/Event.class.ts`, `src/models/actors/event/ConditionEvent.class.ts`
  - Impact: Type contract is broken; extensions may fail silently
  - Fix: Implement `name` property in all Event types or refactor hierarchy

- [ ] **H2: Participant object double-reconstruction**
  - Problem: `Encounter.toEncounterParticipantList()` creates participants twice
  - Location: `src/models/encounters/Encounter.class.ts` lines 20-26
  - Impact: Object identity lost between transformations; state may not persist
  - Fix: Create participants once and reuse through pipeline

- [ ] **H3: InitiativeParticipant self-parent semantics**
  - Problem: Constructor sets `this.actor.parent = this`, but parent getter returns `this`
  - Location: `src/models/initiative/InitiativeParticipant.class.ts` lines 18, 23-24
  - Impact: Cyclic ownership breaks normal traversal assumptions
  - Fix: Clarify ownership model; use proper parent-child semantics

### Medium Severity (should fix before Phase 2)
- [ ] **M1: Name collisions between OO classes and store types** (4 collisions)
  - Participant: OO class vs store type (both import-able, confusing)
  - InitiativeParticipant: OO class vs store type
  - EncounterTemplate: OO class vs store type
  - Encounter: OO class vs store type
  - Location: `src/models/*` vs `src/store/data.ts`
  - Impact: Developers can use wrong symbol even with correct import
  - Fix: Rename one set with explicit prefix (e.g., `StoreParticipant`, `OldEncounterTemplate`)

- [ ] **M2: Type contract drift in template APIs**
  - Problem: `EncounterTemplate.findSlot(id: UUID)` vs `TemplateComposite.findSlot(id: string)`
  - Location: `src/models/templates/EncounterTemplate.class.ts` vs `src/models/templates/TemplateComposite.class.ts`
  - Impact: String IDs can bypass UUID validation
  - Fix: Keep UUID typing strict across all APIs

- [ ] **M3: Initiative construction silently truncates**
  - Problem: `TrackedInitiative.startInitiative()` uses `zip()` which truncates to shortest array
  - Location: `src/models/initiative/TrackedInitiative.class.ts` line 32
  - Impact: Missing initiatives silently remove participants with no error
  - Fix: Validate array lengths match before zipping; throw on mismatch

- [ ] **M4: Placeholder action lifecycle methods**
  - Problem: Most action methods are stubs or no-ops across actor classes
  - Location: Multiple files (Event.class.ts, RoundParticipant.class.ts, etc.)
  - Impact: Runtime semantics unclear; domain actions don't execute
  - Fix: Implement or clearly document intended behavior for each method

### Low Severity (housekeeping)
- [ ] **L1: Repeated ActivityType definitions**
  - Problem: Label mapping declared in two places
  - Location: `src/models/utility/activity/Activity.ts`
  - Impact: Risk of divergence, unnecessary complexity
  - Fix: Single source of truth

- [ ] **L2: Orphan action naming (ActivityType violation)**
  - Problem: `ReinforcementEvent` defines `actLabel` not in ActivityType contract
  - Location: `src/models/actors/event/ReinforcementEvent.class.ts` line 14
  - Impact: Parallel action vocabulary not recognized by common contract
  - Fix: Align to ActivityType or document exception

- [ ] **L3: Domain methods produce console side effects**
  - Problem: `Actor` methods directly log to console
  - Location: `src/models/actors/Actor.class.ts` lines 13-32
  - Impact: Noisy output in production flows; domain logic coupled to I/O
  - Fix: Remove console.log; emit events instead or use proper logging

## Breaking Changes Checklist

Before Phase 4 retirement, create CHANGELOG entry documenting:

- [ ] Mutable class API → immutable POJO + pure functions (not backward compatible)
- [ ] Templates no longer self-reference during initialization
- [ ] Variants accessed by explicit ID, not implicit inheritance
- [ ] Store interface changes (`EncounterTemplatesStore` → `SavedEncountersStore`)
- [ ] Update all imports in codebase
- [ ] Run full test suite for regressions
- [ ] Version bump to major (breaking change)

## Migration Timeline Reference

| Phase | Week | Status | Key Actions |
|-------|------|--------|------------|
| Phase 0 | 1 | ✅ Done | New types, schemas, tests (52 passing) |
| Phase 1 | 2-3 | ⏳ Next | Zustand store, React hook, UI wiring |
| Phase 2 | 4 | 📋 Planned | Dry-run migration, validation |
| Phase 3 | 5+ | 📋 Planned | Feature flag, component cutover |
| **Phase 4** | **6+** | **📋 RETIREMENT** | **Delete 5 classes, 2 stores, old tests** |

---

**Last Updated**: Current session (Phase 0 completion)
**Owner**: Encounter Builder Refactor - Phase 0/1 implementation team
**Next Review**: Before Phase 4 retirement planning
