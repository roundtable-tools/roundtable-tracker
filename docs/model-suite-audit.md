# Model Suite Audit (Web OO Classes)

## Purpose
This document streamlines the current web OO model suite and records structural problems that currently make it hard to extend safely.

Scope:
- In scope: `web-roundtable-tracker/src/models/**`
- Included for conflict evidence only: `web-roundtable-tracker/src/store/data.ts`
- Out of scope: implementation fixes, migration sequencing, native app code

## Current Model Map (What Exists Now)

### 1) Actor Layer
- Base contract: `Actor` in `web-roundtable-tracker/src/models/actors/Actor.class.ts`
- Core lifecycle contract: `pause`, `resume`, `start`, `stop`, `begin`, `end`
- Required property: `name`

Concrete families:
- Participant family:
  - `RoundParticipant`
  - `Participant`
  - `ReinforcementParticipant`
- Event family:
  - `Event`
  - `ConditionEvent`
  - `ReinforcementEvent`

### 2) Encounter Layer
- `EncounterTemplate` in `web-roundtable-tracker/src/models/templates/EncounterTemplate.class.ts`
- `EncounterSlot` in `web-roundtable-tracker/src/models/encounters/EncounterSlot.class.ts`
- `Encounter` in `web-roundtable-tracker/src/models/encounters/Encounter.class.ts`
- `TemplateComposite` variant wrapper in `web-roundtable-tracker/src/models/templates/TemplateComposite.class.ts`

### 3) Initiative Layer
- `InitiativeParticipant` in `web-roundtable-tracker/src/models/initiative/InitiativeParticipant.class.ts`
- `TrackedInitiative` in `web-roundtable-tracker/src/models/initiative/TrackedInitiative.class.ts`

### 4) Cross-Layer Utility Contract
- `ActivityType` in `web-roundtable-tracker/src/models/utility/activity/Activity.ts`

## Core Problems

## High Severity

### H1) Abstract contract is broken in event hierarchy
- `Actor` requires `abstract readonly name: string` (`web-roundtable-tracker/src/models/actors/Actor.class.ts:11`).
- `Event` and `ConditionEvent` extend `Actor` but do not implement `name` (`web-roundtable-tracker/src/models/actors/event/Event.class.ts:8`, `web-roundtable-tracker/src/models/actors/event/ConditionEvent.class.ts:8`).
- `ReinforcementEvent` extends `Event`, which still does not satisfy `Actor` name requirement (`web-roundtable-tracker/src/models/actors/event/ReinforcementEvent.class.ts:8`).

Why this matters:
- This is a hard class-contract inconsistency in the base hierarchy and blocks reliable extension of event actors.

### H2) Encounter participant conversion re-creates actors and loses identity/state
- `Encounter.toEncounterParticipantList` first converts each slot to `RoundParticipant` (`web-roundtable-tracker/src/models/encounters/Encounter.class.ts:20`).
- It then maps again and creates a second new `RoundParticipant` (`web-roundtable-tracker/src/models/encounters/Encounter.class.ts:22-26`).
- `EncounterSlot.toRoundParticipant` already constructs a participant (`web-roundtable-tracker/src/models/encounters/EncounterSlot.class.ts:16-21`).

Why this matters:
- Rebuilding actor objects can drop subclass behavior and mutable state assumptions.
- It duplicates object creation and obscures source-of-truth for actor identity.

### H3) Parent ownership graph is contradictory in initiative wrapper
- Constructor assigns `this.actor.parent = this` (`web-roundtable-tracker/src/models/initiative/InitiativeParticipant.class.ts:18`).
- `parent` getter on `InitiativeParticipant` returns `this` (`web-roundtable-tracker/src/models/initiative/InitiativeParticipant.class.ts:23-24`).

Why this matters:
- Self-parent semantics create cyclic ownership and invalidate normal parent traversal assumptions.

## Medium Severity

### M1) Same-name symbol collisions between OO classes and store model types
Collisions that create import ambiguity and conceptual drift:
- `Participant`: class at `web-roundtable-tracker/src/models/actors/participant/Participant.class.ts:12` vs type at `web-roundtable-tracker/src/store/data.ts:200`
- `InitiativeParticipant`: class at `web-roundtable-tracker/src/models/initiative/InitiativeParticipant.class.ts:10` vs type at `web-roundtable-tracker/src/store/data.ts:204`
- `EncounterTemplate`: class at `web-roundtable-tracker/src/models/templates/EncounterTemplate.class.ts:14` vs type at `web-roundtable-tracker/src/store/data.ts:237`
- `Encounter`: class at `web-roundtable-tracker/src/models/encounters/Encounter.class.ts:10` vs type at `web-roundtable-tracker/src/store/data.ts:342`

Why this matters:
- Developers can read/use the wrong symbol even when TypeScript accepts the import.
- This is the largest source of naming confusion in the current system.

### M2) Type contract drift in template lookup
- Base API: `EncounterTemplate.findSlot(id: UUID)` (`web-roundtable-tracker/src/models/templates/EncounterTemplate.class.ts:28`).
- Composite API: `TemplateComposite.findSlot(id: string)` (`web-roundtable-tracker/src/models/templates/TemplateComposite.class.ts:38`).

Why this matters:
- Widening from `UUID` to `string` weakens guarantees and allows invalid identifiers through the interface boundary.

### M3) Initiative start silently truncates mismatched inputs
- `TrackedInitiative.startInitiative` zips encounter participants and initiative list (`web-roundtable-tracker/src/models/initiative/TrackedInitiative.class.ts:32`).
- `zip` truncates to the shortest array (`web-roundtable-tracker/src/utils/zip.ts:4`).

Why this matters:
- Missing initiatives can silently remove participants from tracking with no explicit error.

### M4) Action lifecycle methods are largely placeholders/no-ops
- Event methods are stubs (`web-roundtable-tracker/src/models/actors/event/Event.class.ts:17-32`).
- `ConditionEvent` methods and `act` are stubs (`web-roundtable-tracker/src/models/actors/event/ConditionEvent.class.ts:16-29`).
- Participant round actions are stubs (`web-roundtable-tracker/src/models/actors/participant/RoundParticipant.class.ts:25-28`, `web-roundtable-tracker/src/models/actors/participant/Participant.class.ts:25-40`).
- Reinforcement resume flow includes TODO (`web-roundtable-tracker/src/models/actors/participant/ReinforcementParticipant.class.ts:18-20`).

Why this matters:
- Runtime semantics are unclear because domain actions are declared but mostly not implemented.

## Low Severity

### L1) Repeated definitions in activity typing
- `ActivityType` repeats mapped label declaration twice (`web-roundtable-tracker/src/models/utility/activity/Activity.ts:4`, `web-roundtable-tracker/src/models/utility/activity/Activity.ts:6`).

Why this matters:
- It adds redundant complexity and confuses the intended action-label contract.

### L2) Contract drift by orphan action naming
- `ReinforcementEvent` defines `actLabel` (`web-roundtable-tracker/src/models/actors/event/ReinforcementEvent.class.ts:14`).
- `ActivityType` contract does not include `act`/`actLabel` (`web-roundtable-tracker/src/models/utility/activity/Activity.ts:1-6`).

Why this matters:
- Introduces a parallel action vocabulary not recognized by the common actor activity contract.

### L3) Base domain methods produce console side effects
- `Actor` methods directly log labels and names (`web-roundtable-tracker/src/models/actors/Actor.class.ts:13-32`).

Why this matters:
- Domain model behavior is coupled to console output and can leak noisy side effects in production flows.

## Duplication and Contradiction Index

### Duplicate definitions
- Name-level duplicates between classes and store types:
  - `Participant`
  - `InitiativeParticipant`
  - `EncounterTemplate`
  - `Encounter`

### Contradictions
- Abstract class requires `name`, but event classes do not implement it.
- `InitiativeParticipant` is both wrapper and self-parent.
- `TemplateComposite` loosens identifier typing from `UUID` to `string`.

### Repeating definitions
- `ActivityType` label mapping is duplicated.
- Encounter conversion path reconstructs `RoundParticipant` objects twice.

## Streamlined Working Language (Use This Today)

To reduce confusion while code is unchanged, use the following terms consistently:
- Actor: anything that implements lifecycle actions (`pause/resume/start/stop/begin/end`) via `Actor`.
- Participant Actor: `RoundParticipant` and subclasses used for turn/round participation.
- Event Actor: `Event` and subclasses that model round-based triggers.
- Encounter Template Class: OO class in `src/models/templates/EncounterTemplate.class.ts`.
- Encounter Class: OO class in `src/models/encounters/Encounter.class.ts`.
- Store Encounter Types: similarly named shapes in `src/store/data.ts`; reference them with explicit "store" prefix in discussion.

Team convention for naming in PR text/issues:
- Always prefix symbol context when discussing collisions, for example:
  - "model `Encounter`"
  - "store `Encounter`"
  - "model `InitiativeParticipant`"
  - "store `InitiativeParticipant`"

## Immediate Triage

Blockers to treat as immediate before building on this suite:
1. Event `name` contract inconsistency in actor hierarchy.
2. Encounter participant double-reconstruction path.
3. Self-parent semantics in initiative wrapper.

Non-blocking debt (still important):
1. Class/store symbol collision cleanup plan.
2. Activity contract normalization (`act` vs `begin/end`).
3. Placeholder action methods implementation strategy.

## Minimal Stability Checklist

Use this checklist before adding new model features:
1. New concrete `Actor` classes must satisfy required base properties and lifecycle contract.
2. Do not recreate participant objects when a stable instance should be preserved.
3. Keep identifier typing strict across template APIs (`UUID`-first).
4. Avoid introducing same-name symbols across model and store layers without explicit aliasing.
5. Ensure initiative construction validates participant count against initiative input length.
