# Encounter Instance Implementation Plan

## Purpose

This plan defines the next implementation slice after the `EncounterTemplate` refactor: concrete encounter instances resolved from template-relative data plus an opt-in repository of absolute entities.

The target is to support GM workflows where template slots stay lightweight by default, and specific statblocks are only attached when explicitly chosen.

## Scope

In scope:
- Opt-in stat interfaces for creatures, hazards, and narrative events.
- Repository contracts and a mock Training Dummy directory.
- Encounter instance data model (a diff layer over templates).
- `Encounter` resolution engine with deterministic merge order.
- Builder service integration flow for template initialization and repository swapping.

Out of scope:
- Initiative runtime refactor.
- Deep statblock editing UI.
- Native app changes.

## Architecture

```
EncounterTemplate (relative)
      |
      | initialize + variant selection
      v
EncounterData / EncounterVariantInstance (instance diff)
      |
      | resolveParticipant(instance)
      v
Template baseline + Repository entity + Instance overrides
      |
      v
ResolvedParticipantViewModel (flat render object)
```

## 1) Opt-In Stat Interfaces

```ts
export interface SpeedEntry {
  type: string;
  value: number;
}

export interface DisableDcEntry {
  skill: string;
  dc: number;
}

export interface CreatureStats {
  maxHp?: number;
  initiativeBonus?: number;
  traits?: string[];
  speeds?: SpeedEntry[];
  ac?: number;
  fortitude?: number;
  reflex?: number;
  will?: number;
}

export interface HazardStats {
  maxHp?: number;
  hardness?: number;
  disableCounter?: number;
  initiativeBonus?: number;
  traits?: string[];
  ac?: number;
  disableDcs?: DisableDcEntry[];
}

export interface NarrativeStats {
  victoryCounter?: number;
  checkDcs?: DisableDcEntry[];
}
```

Design note:
- All fields are optional to keep stat tracking opt-in.
- Empty objects are valid.

## 2) Repository Contracts + Training Dummy Directory

```ts
export interface RepositoryEntityBase {
  id: string;
  name: string;
  level: number; // absolute
}

export interface RepositoryCreature extends RepositoryEntityBase, CreatureStats {
  type: 'creature';
}

export interface RepositoryHazard extends RepositoryEntityBase, HazardStats {
  type: 'hazard';
}

export interface RepositoryNarrativeEvent extends RepositoryEntityBase, NarrativeStats {
  type: 'narrative';
}

export type RepositoryEntity =
  | RepositoryCreature
  | RepositoryHazard
  | RepositoryNarrativeEvent;

export type RepositoryDictionary = Record<string, RepositoryEntity>;
```

Training Dummy mock data (minimum-only examples):

```ts
export const trainingDummyRepository: RepositoryDictionary = {
  'td-creature-1': {
    id: 'td-creature-1',
    name: 'Training Dummy (Creature)',
    type: 'creature',
    level: 0,
  },
  'td-hazard-1': {
    id: 'td-hazard-1',
    name: 'Training Dummy (Hazard)',
    type: 'hazard',
    level: 0,
  },
  'td-narrative-1': {
    id: 'td-narrative-1',
    name: 'Training Dummy (Narrative)',
    type: 'narrative',
    level: 0,
  },
};
```

Proof objective:
- Resolution and rendering must work with no optional stats present.

## 3) Encounter Instance Models

```ts
export type EncounterInstanceType = 'creature' | 'hazard';
export type EncounterAdjustment = 'weak' | 'elite' | 'none';

export interface EncounterParticipantInstance {
  instanceId: string;
  templateSlotId?: string;
  repositoryEntityId?: string;
  type?: EncounterInstanceType;
  count: number;
  adjustment: EncounterAdjustment;
  levelOverride?: number;
  nameOverride?: string;
  statsOverride?: Partial<CreatureStats & HazardStats>;
}

export interface EncounterEventInstance {
  instanceId: string;
  templateSlotId?: string;
  type: 'narrative' | 'reinforcement';
  turnIndex: number;
  narrativeStatsOverride?: Partial<NarrativeStats>;
  reinforcements?: EncounterParticipantInstance[];
}

export interface EncounterVariantInstance {
  id: string;
  templateVariantId: string;
  partySize: number;
  clearedTemplateSlotIds: string[];
  participants: EncounterParticipantInstance[];
  events: EncounterEventInstance[];
}

export interface EncounterData {
  id: string;
  name: string;
  partyLevel: number; // absolute
  templateId: string;
  variants: EncounterVariantInstance[];
  defaultVariantId: string;
}
```

Behavior note:
- `clearedTemplateSlotIds` tracks GM-removals while preserving original template definition.

## 4) Encounter Resolution Engine

```ts
export interface ResolvedParticipant {
  instanceId: string;
  sourceTemplateSlotId?: string;
  sourceRepositoryEntityId?: string;
  name: string;
  type: 'creature' | 'hazard';
  level: number;
  count: number;
  stats: Partial<CreatureStats & HazardStats>;
}

export class Encounter {
  constructor(
    public readonly data: EncounterData,
    private readonly template?: EncounterTemplate,
    private readonly repository: RepositoryDictionary = {},
  ) {}

  resolveParticipant(instance: EncounterParticipantInstance): ResolvedParticipant {
    // 1) template baseline (relative -> absolute)
    const templateSlot = instance.templateSlotId
      ? this.findTemplateSlot(instance.templateSlotId)
      : undefined;

    const templateType = templateSlot?.type as 'creature' | 'hazard' | undefined;
    const templateLevel =
      templateSlot && typeof templateSlot.relativeLevel === 'number'
        ? this.data.partyLevel + templateSlot.relativeLevel
        : undefined;

    let type: 'creature' | 'hazard' = instance.type ?? templateType ?? 'creature';
    let level = templateLevel ?? this.data.partyLevel;
    let name = templateSlot?.name ?? 'Unnamed Participant';
    let stats: Partial<CreatureStats & HazardStats> = {};

    // 2) repository merge (absolute level wins)
    const repo = instance.repositoryEntityId
      ? this.repository[instance.repositoryEntityId]
      : undefined;

    if (repo) {
      type = (repo.type === 'narrative' ? type : repo.type) as 'creature' | 'hazard';
      level = repo.level;
      name = repo.name;
      stats = { ...stats, ...repo };
    }

    // 3) adjustment
    if (instance.adjustment === 'elite') level += 1;
    if (instance.adjustment === 'weak') level -= 1;

    // 4) instance overrides
    if (typeof instance.levelOverride === 'number') level = instance.levelOverride;
    if (instance.nameOverride) name = instance.nameOverride;
    if (instance.statsOverride) stats = { ...stats, ...instance.statsOverride };

    return {
      instanceId: instance.instanceId,
      sourceTemplateSlotId: instance.templateSlotId,
      sourceRepositoryEntityId: instance.repositoryEntityId,
      name,
      type,
      level,
      count: instance.count,
      stats,
    };
  }

  private findTemplateSlot(templateSlotId: string) {
    if (!this.template) return undefined;
    for (const variant of this.template.data.variants) {
      const found = variant.participants.find((p) => p.id === templateSlotId);
      if (found) return found;
    }
    return undefined;
  }
}
```

Resolution guarantees:
- deterministic merge order,
- no hidden mutation,
- valid output even when template/repository links are absent.

## 5) Builder View Integration Service

### Service contract

```ts
export interface EncounterBuilderService {
  initializeFromTemplate(template: EncounterTemplate, partyLevel: number): EncounterData;
  swapParticipantWithRepositoryEntity(input: {
    encounter: EncounterData;
    variantId: string;
    participantInstanceId: string;
    repositoryEntityId: string;
  }): EncounterData;
  createEncounterEngine(encounter: EncounterData, template?: EncounterTemplate): Encounter;
}
```

### Builder wiring sequence

1. Route loads with `templateId` and optional `encounterId`.
2. If `encounterId` exists, load saved encounter as today.
3. If only `templateId` exists, call `initializeFromTemplate()`.
4. Builder edits `EncounterParticipantInstance` objects.
5. On Training Dummy pick, call `swapParticipantWithRepositoryEntity()` and set `repositoryEntityId`.
6. For preview/render, call `createEncounterEngine()` and `resolveParticipant()` per row.
7. Persist encounter diff via existing saved encounter store path.

## 6) File Layout Recommendation

```text
web-roundtable-tracker/src/models/encounters/instance/
  encounter-instance.types.ts
  repository.types.ts
  repository.training-dummies.ts
  Encounter.ts
  builder-encounter.service.ts
  index.ts
```

Rationale:
- Keeps new runtime resolution logic isolated from legacy class tree.
- Keeps store layer focused on persistence, not merge logic.

## 7) Acceptance Criteria

- Minimum-only Training Dummy entries resolve with no runtime errors.
- `resolveParticipant()` follows exact precedence:
  template baseline -> repository merge -> adjustment -> overrides.
- Builder can initialize from template without requiring full statblocks.
- Swapping a template slot to Training Dummy updates only the encounter diff, not template data.
