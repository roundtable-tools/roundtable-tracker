# Deprecation Schedule

This document lists all items marked for future removal or deprecation across the Roundtable Tracker codebase.

## Phase 3/4 Removals (Week 5-6+)

Implementation update: the listed legacy OO classes and old store implementations are now retired in the web app.

### Old Object-Oriented Classes (5 items)
These classes are being replaced by the new immutable POJO + pure function architecture.

- [x] `Encounter` class (`web-roundtable-tracker/src/models/encounters/Encounter.class.ts`)
  - Replaced by: New EncounterTemplate + instance data layer
  - Impact: Changes to encounter instantiation and manipulation
  - Status: Retired (2026-04-11)

- [x] `EncounterTemplate` class (old) (`web-roundtable-tracker/src/models/templates/EncounterTemplate.class.ts`)
  - Replaced by: New EncounterTemplate business logic class + EncounterTemplateData POJO
  - Impact: Template creation and management refactored
  - Status: Retired (2026-04-11)

- [x] `TemplateSlot` class (`web-roundtable-tracker/src/models/templates/TemplateSlot.class.ts`)
  - Replaced by: Participant discriminated union (CreatureParticipant | HazardParticipant)
  - Impact: Participant handling uses new discriminated union types
  - Status: Retired (2026-04-11)

- [x] `TemplateEvent` class (`web-roundtable-tracker/src/models/templates/TemplateEvent.class.ts`)
  - Replaced by: NarrativeEvent and ReinforcementEvent types
  - Impact: Event creation and handling refactored
  - Status: Retired (2026-04-11)

- [x] `TemplateComposite` class (`web-roundtable-tracker/src/models/templates/TemplateComposite.class.ts`)
  - Replaced by: EncounterTemplate composition handling
  - Impact: Variant composition uses new structure
  - Status: Retired (2026-04-11)

### Old Store Implementations (2 items)
These are being replaced by new Zustand-based stores with immutable update patterns.

- [x] `EncounterTemplatesStore` (old implementation) (`web-roundtable-tracker/src/store/Encounters/EncounterTemplates.ts`)
  - Replaced by: `useSavedEncountersStore` (Zustand)
  - Impact: Store interface and mutation patterns change
  - Status: Retired (2026-04-11), migrated to `web-roundtable-tracker/src/models/encounters/defaultTemplates.ts`

- [x] `OldEncounterStore` (`web-roundtable-tracker/src/store/store.tsx`, `web-roundtable-tracker/src/store/instance.ts`)
  - Replaced by: New immutable encounter data store
  - Impact: Encounter state management patterns change
  - Status: Retired (2026-04-11), moved to runtime modules `web-roundtable-tracker/src/store/encounterRuntimeStore.ts` and `web-roundtable-tracker/src/store/encounterRuntimeInstance.ts`

### Old Test Files (all tests for deleted classes)
- [x] `web-roundtable-tracker/src/models/encounters/Encounter.spec.ts` (old tests)
- [x] `web-roundtable-tracker/src/models/templates/Template.spec.ts` (old tests)
- [x] `web-roundtable-tracker/src/models/initiative/Initiative.spec.ts` (old tests)
- [x] `web-roundtable-tracker/src/models/actors/Actor.spec.ts` (old tests)
- [x] `web-roundtable-tracker/src/models/actors/event/Event.spec.ts` (old tests)
- [x] `web-roundtable-tracker/src/models/actors/participant/Participant.spec.ts` (old tests)

## Code-Level TODOs and Placeholders

Legacy placeholder-method items were resolved by retiring the old OO actor/event hierarchy.

- [x] **ActivityType.ts duplicated definitions** (Lines 4, 6)
  - Issue: Label mapping defined twice
  - Location: `web-roundtable-tracker/src/models/utility/activity/Activity.ts`
  - Impact: Redundant code, potential for divergence
  - Fix: Consolidated into single label mapping definition

## Structural Debt (7 issues from Model Suite Audit)

These are architectural problems that should be addressed in the next major refactoring phase.

### High Severity (must fix before significant expansion)
- [x] **H1: Event hierarchy doesn't implement Actor contract**
  - Problem: `Event` and `ConditionEvent` extend `Actor` but don't implement required `name` property
  - Location: `src/models/actors/event/Event.class.ts`, `src/models/actors/event/ConditionEvent.class.ts`
  - Impact: Type contract is broken; extensions may fail silently
  - Fix: Implement `name` property in all Event types or refactor hierarchy

- [x] **H2: Participant object double-reconstruction**
  - Problem: `Encounter.toEncounterParticipantList()` creates participants twice
  - Location: `src/models/encounters/Encounter.class.ts` lines 20-26
  - Impact: Object identity lost between transformations; state may not persist
  - Fix: Create participants once and reuse through pipeline

- [x] **H3: InitiativeParticipant self-parent semantics**
  - Problem: Constructor sets `this.actor.parent = this`, but parent getter returns `this`
  - Location: `src/models/initiative/InitiativeParticipant.class.ts` lines 18, 23-24
  - Impact: Cyclic ownership breaks normal traversal assumptions
  - Fix: Clarify ownership model; use proper parent-child semantics

### Medium Severity (should fix before Phase 2)
- [x] **M1: Name collisions between OO classes and store types** (4 collisions)
  - Participant: OO class vs store type (both import-able, confusing)
  - InitiativeParticipant: OO class vs store type
  - EncounterTemplate: OO class vs store type
  - Encounter: OO class vs store type
  - Location: `web-roundtable-tracker/src/models/*` vs `web-roundtable-tracker/src/store/data.ts`
  - Impact: Developers can use wrong symbol even with correct import
  - Fix: Resolved by deleting deprecated OO class hierarchy

- [x] **M2: Type contract drift in template APIs**
  - Problem: `EncounterTemplate.findSlot(id: UUID)` vs `TemplateComposite.findSlot(id: string)`
  - Location: Removed legacy files
  - Impact: String IDs can bypass UUID validation
  - Fix: Resolved by deleting deprecated template classes

- [x] **M3: Initiative construction silently truncates**
  - Problem: `TrackedInitiative.startInitiative()` uses `zip()` which truncates to shortest array
  - Location: Removed legacy file
  - Impact: Missing initiatives silently remove participants with no error
  - Fix: Resolved by deleting deprecated initiative class

- [x] **M4: Placeholder action lifecycle methods**
  - Problem: Most action methods are stubs or no-ops across actor classes
  - Location: Removed legacy files
  - Impact: Runtime semantics unclear; domain actions don't execute
  - Fix: Resolved by deleting deprecated actor/event classes

### Low Severity (housekeeping)
- [x] **L1: Repeated ActivityType definitions**
  - Problem: Label mapping declared in two places
  - Location: `web-roundtable-tracker/src/models/utility/activity/Activity.ts`
  - Impact: Risk of divergence, unnecessary complexity
  - Fix: Single source of truth

- [x] **L2: Orphan action naming (ActivityType violation)**
  - Problem: `ReinforcementEvent` defines `actLabel` not in ActivityType contract
  - Location: Removed legacy file
  - Impact: Parallel action vocabulary not recognized by common contract
  - Fix: Resolved by deleting deprecated event classes

- [x] **L3: Domain methods produce console side effects**
  - Problem: `Actor` methods directly log to console
  - Location: Removed legacy file
  - Impact: Noisy output in production flows; domain logic coupled to I/O
  - Fix: Resolved by deleting deprecated actor class

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
| Phase 1 | 2-3 | ✅ Done | Zustand store, React hook, UI wiring |
| Phase 2 | 4 | ✅ Done | Dry-run migration, validation |
| Phase 3 | 5+ | 📋 Planned | Feature flag, component cutover |
| **Phase 4** | **6+** | **✅ RETIRED EARLY** | **Deleted 5 classes, 2 stores, old tests** |

---

**Last Updated**: 2026-04-11 (legacy class/store retirement completed)
**Owner**: Encounter Builder Refactor - Phase 0/1 implementation team
**Next Review**: Before Phase 4 retirement planning
