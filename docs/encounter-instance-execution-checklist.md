# Encounter Instance Execution Checklist

## Phase 1: Domain Contracts

- [ ] Add `CreatureStats`, `HazardStats`, and `NarrativeStats` with fully optional fields.
- [ ] Add shared entries: `SpeedEntry`, `DisableDcEntry`.
- [ ] Add repository contracts:
  - [ ] `RepositoryEntityBase`
  - [ ] `RepositoryCreature`
  - [ ] `RepositoryHazard`
  - [ ] `RepositoryNarrativeEvent`
  - [ ] `RepositoryDictionary`
- [ ] Add Training Dummy repository fixture with minimum-only entries (id/name/type/level).

## Phase 2: Encounter Diff Model

- [ ] Add `EncounterParticipantInstance`.
- [ ] Add `EncounterEventInstance`.
- [ ] Add `EncounterVariantInstance`.
- [ ] Add `EncounterData`.
- [ ] Add adjustment and type literals (`weak`/`elite`/`none`, creature/hazard).

## Phase 3: Resolution Engine

- [ ] Create `Encounter` class wrapping `EncounterData`.
- [ ] Constructor accepts optional `EncounterTemplate` and repository map.
- [ ] Implement `resolveParticipant(instance)` with exact merge order:
  - [ ] Template baseline from relative level
  - [ ] Repository merge with absolute level precedence
  - [ ] Weak/elite adjustment
  - [ ] Instance overrides (`levelOverride`, `nameOverride`, `statsOverride`)
- [ ] Return unified flat resolved object for UI.

## Phase 4: Builder Integration

- [ ] Add builder service API for template initialization and repository swap.
- [ ] Initialize new encounter from template when `templateId` exists and `encounterId` is absent.
- [ ] Keep existing saved encounter edit path unchanged.
- [ ] Add repository swap action for participant rows (Training Dummy assignment).
- [ ] Use `resolveParticipant()` output in preview/render adapters.

## Phase 5: Tests

- [ ] Unit test: minimum-only repository entities resolve successfully.
- [ ] Unit test: merge precedence order is deterministic and correct.
- [ ] Unit test: weak/elite adjustment math applies after repository merge.
- [ ] Unit test: overrides always win.
- [ ] Service test: template initialization creates valid EncounterData.
- [ ] Service test: repository swap updates targeted participant instance only.
- [ ] Route test: `templateId` initialization path remains compatible with `encounterId` edit path.

## Phase 6: Verification Commands

- [ ] `yarn workspace web-roundtable-tracker typecheck`
- [ ] `yarn workspace web-roundtable-tracker test`

## Risk Controls

- [ ] Do not mutate source template objects.
- [ ] Keep encounter instance as diff data only.
- [ ] Keep opt-in stat contracts optional end-to-end.
- [ ] Preserve existing saved encounter persistence contracts in first pass.
