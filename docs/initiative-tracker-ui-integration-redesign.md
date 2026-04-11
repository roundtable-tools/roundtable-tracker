# Initiative Tracker UI Integration Redesign

## Context Alignment (Current Stack)

This integration plan targets the current web app stack:

- Framework: React + TanStack Router
- State Management: Zustand (existing app stores) plus command history patterns
- Styling/UI: Tailwind + shadcn/ui components (with some legacy Grommet/Legend usage still present)

The goal is to keep business logic classes DOM-agnostic while making UI updates fully reactive.

## Target Outcome

Bind a vanilla `InitiativeTracker` class to reactive UI through a thin Zustand adapter store.

The store owns:
1. tracker instantiation,
2. command-like action methods,
3. version bumping after mutations,
4. immutable UI snapshots for rendering.

## File Plan

Create or update these files:

1. `web-roundtable-tracker/src/components/InitiativeList/trackerUiStore.ts`
2. `web-roundtable-tracker/src/components/InitiativeList/combatViewModels.ts`
3. `web-roundtable-tracker/src/components/InitiativeList/CombatList.tsx`
4. `web-roundtable-tracker/src/components/InitiativeList/RoundEventBanner.tsx`
5. `web-roundtable-tracker/src/components/InitiativeList/NewInitiative.tsx` (wire-in)

## 1) State Initialization (Tracker Wrapper Store)

```ts
// web-roundtable-tracker/src/components/InitiativeList/trackerUiStore.ts
import { create } from 'zustand';
import { InitiativeTracker } from '@/models/initiative/InitiativeTracker.class';
import type {
  PartyProfile,
  EncounterData,
  EncounterParticipantInstance,
  CombatEvent,
} from '@/models/initiative/types';

interface InitiativeTrackerUiState {
  tracker?: InitiativeTracker;
  revision: number;

  initialize: (input: {
    party: PartyProfile;
    selectedEncounter: EncounterData;
  }) => void;

  nextTurn: () => void;
  delay: (combatantId: string) => void;
  enterFromDelay: (combatantId: string) => void;

  getCurrentRoundEvents: () => CombatEvent[];
}

function bumpRevision(state: InitiativeTrackerUiState) {
  return { revision: state.revision + 1 };
}

export const useInitiativeTrackerUiStore = create<InitiativeTrackerUiState>(
  (set, get) => ({
    tracker: undefined,
    revision: 0,

    initialize: ({ party, selectedEncounter }) => {
      // Active party + selected encounter are transformed into engine input here.
      const tracker = InitiativeTracker.fromResolvedEncounter({
        party,
        encounter: selectedEncounter,
      });

      set((state) => ({ tracker, ...bumpRevision(state) }));
    },

    nextTurn: () => {
      const tracker = get().tracker;
      if (!tracker) return;
      tracker.nextTurn();
      set((state) => ({ tracker, ...bumpRevision(state) }));
    },

    delay: (combatantId) => {
      const tracker = get().tracker;
      if (!tracker) return;
      tracker.delay(combatantId);
      set((state) => ({ tracker, ...bumpRevision(state) }));
    },

    enterFromDelay: (combatantId) => {
      const tracker = get().tracker;
      if (!tracker) return;
      tracker.enterFromDelay(combatantId);
      set((state) => ({ tracker, ...bumpRevision(state) }));
    },

    getCurrentRoundEvents: () => {
      const tracker = get().tracker;
      if (!tracker) return [];
      return tracker.events.get(tracker.roundCounter) ?? [];
    },
  })
);
```

Implementation notes:
1. `revision` forces rerender for class-internal mutable updates.
2. UI does not mutate combat arrays directly.
3. All mutations flow through class methods only.

## 2) Initialization Wiring in New Initiative View

```ts
// web-roundtable-tracker/src/components/InitiativeList/NewInitiative.tsx (integration excerpt)
import { useEffect } from 'react';
import { useEncounterStore } from '@/store/instance';
import { useInitiativeTrackerUiStore } from './trackerUiStore';
import { buildMockPartyProfileFromCharactersMap } from './combatViewModels';

export function NewInitiative() {
  const encounterData = useEncounterStore((s) => s.encounterData);
  const charactersMap = useEncounterStore((s) => s.charactersMap);

  const initialize = useInitiativeTrackerUiStore((s) => s.initialize);

  useEffect(() => {
    if (!encounterData) return;

    initialize({
      party: buildMockPartyProfileFromCharactersMap(charactersMap),
      selectedEncounter: encounterData,
    });
  }, [encounterData, charactersMap, initialize]);

  return <CombatList />;
}
```

## 3) Combat List Component

```tsx
// web-roundtable-tracker/src/components/InitiativeList/CombatList.tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useInitiativeTrackerUiStore } from './trackerUiStore';
import { RoundEventBanner } from './RoundEventBanner';

export function CombatList() {
  const tracker = useInitiativeTrackerUiStore((s) => s.tracker);
  const revision = useInitiativeTrackerUiStore((s) => s.revision);
  const nextTurn = useInitiativeTrackerUiStore((s) => s.nextTurn);
  const delay = useInitiativeTrackerUiStore((s) => s.delay);
  const enterFromDelay = useInitiativeTrackerUiStore((s) => s.enterFromDelay);

  // Revision is intentionally read to re-render on class mutations.
  void revision;

  if (!tracker) {
    return <p className="text-muted-foreground">No active initiative tracker.</p>;
  }

  const current = tracker.currentTurnIndex;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Initiative</h2>
        <Button onClick={nextTurn}>Next Turn</Button>
      </header>

      <RoundEventBanner />

      <ol className="flex flex-col gap-2">
        {tracker.combatants.map((combatant, index) => {
          const isActive = index === current;
          const isPc = combatant.side === 'pc';
          const isHidden = combatant.isHidden === true;

          const displayName = isHidden ? 'Unknown Combatant' : combatant.name;
          const displayAc = isHidden ? '??' : combatant.ac ?? '—';
          const displayHp = isHidden ? '??' : combatant.hp ?? '—';

          return (
            <Card
              key={combatant.id}
              className={cn(
                'p-3 border transition-colors',
                isPc ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200',
                isActive ? 'ring-2 ring-green-500' : ''
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {isPc ? 'Player Character' : combatant.type === 'hazard' ? 'Hazard' : 'Creature'}
                  </p>
                </div>

                <div className="text-right text-sm">
                  <p>Init: {combatant.initiative}</p>
                  <p>AC: {displayAc}</p>
                  <p>HP: {displayHp}</p>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                {isActive && (
                  <Button size="sm" variant="outline" onClick={() => delay(combatant.id)}>
                    Delay
                  </Button>
                )}

                {combatant.turnState === 'delayed' && (
                  <Button size="sm" onClick={() => enterFromDelay(combatant.id)}>
                    Return to Action
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </ol>
    </section>
  );
}
```

Covers required behavior:
1. Distinct rendering for PCs vs non-PCs.
2. Hidden combatants are obscured.
3. Active turn row highlighted using `currentTurnIndex`.
4. Buttons bound to `nextTurn`, `delay`, and `enterFromDelay`.

## 4) Round + Event UI

```tsx
// web-roundtable-tracker/src/components/InitiativeList/RoundEventBanner.tsx
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInitiativeTrackerUiStore } from './trackerUiStore';

export function RoundEventBanner() {
  const tracker = useInitiativeTrackerUiStore((s) => s.tracker);
  const revision = useInitiativeTrackerUiStore((s) => s.revision);
  const getCurrentRoundEvents = useInitiativeTrackerUiStore((s) => s.getCurrentRoundEvents);

  void revision;

  if (!tracker) return null;

  const round = tracker.roundCounter;
  const events = getCurrentRoundEvents();

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Round {round}</p>

      {events.length > 0 && (
        <Alert>
          <AlertTitle>Round Event</AlertTitle>
          <AlertDescription>
            {events.map((evt) => evt.label).join(' • ')}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

If you also want toast behavior, trigger it in a `useEffect` that watches `roundCounter` and only emits once per round.

## 5) Separation of Concerns Rules

1. `InitiativeTracker` remains pure domain logic.
2. UI only calls store actions.
3. Store adapter is the only bridge point for reactivity.
4. Rendering components consume immutable snapshots/read-only properties.

## 6) Migration Steps from Current Prototype

1. Keep existing `encounterStore$` flow operational while introducing `trackerUiStore` behind a feature flag in `NewInitiative`.
2. Route one screen to new `CombatList` using the wrapper store.
3. Compare behavior parity for next turn, delayed handling, and round increment.
4. Remove duplicate turn-state mutation logic from UI commands once parity is confirmed.

## 7) Validation Checklist

1. `Next Turn` advances active index and increments round when wrapping.
2. `Delay` moves active combatant to delayed state.
3. `Return to Action` re-inserts delayed combatant correctly.
4. Hidden combatants never leak name/ac/hp in UI.
5. Round banner displays events from `events.get(roundCounter)`.

## 8) Optional Hardening

1. Add derived selectors (`selectActiveCombatant`, `selectVisibleCombatants`) to reduce render cost.
2. Add unit tests for wrapper action methods with mocked tracker.
3. Add integration tests for active highlight and delayed action buttons.
