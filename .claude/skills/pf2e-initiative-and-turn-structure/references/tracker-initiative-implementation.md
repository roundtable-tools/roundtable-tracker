# How Roundtable Tracker implements initiative

Paths are relative to `web-roundtable-tracker/src/`. Function and command names are given so they can be
found with grep. Line numbers drift, so check the code before relying on details. Keep this file in sync
when the turn flow changes.

## Data model

- **`Character`** (`store/data.ts`): `uuid`, `name`, `initiative`, `turnState`, `health`, `maxHealth`, `tempHealth`, `tempHealthDescription?`, `group?` (`players` | `enemies`), `level?`.
  - `turnState` is one of `STATE`: `normal`, `delayed`, `knocked-out`.
  - Whether a participant has its turn left is held in the store's `charactersWithTurn` Set, not on `Character`.
- **Tie priority** `PRIORITY = { PC: 0, NPC: 1, SPECIAL: 2 }`. Higher goes first on a tie, so by default enemies (`NPC`) win ties against PCs, as the rules say. The party form's "Initiative tie advantage" checkbox is ticked by default and maps ticked to `PC`, unticked to `NPC`.
- **Sides** `ALIGNMENT = { PCs: 0, Opponents: 1, Neutral: 2 }`.
- **Template participant** (`CombatantParticipant`): `initiativeBonus?`, `tiePriority?`, `startingState?` (`normal` | `delayed` | `knocked-out`), `count?`. Hazards add `successesToDisable` and `isComplexHazard?`.
- **Narrative slots** (`NarrativeSlot`): `type` is `default`, `reinforcement` or `ongoing`. `trigger: { round, frequency? }`, plus `participants`. Reinforcements are slots of type `reinforcement`.
- **Runtime store** (`store/encounterRuntimeStore.ts`, persisted to localStorage as `encounter-store`):

  | Field | Meaning |
  |---|---|
  | `charactersOrder: UUID[]` | A **rotating queue**. Index 0 is the current actor |
  | `delayedOrder: UUID[]` | Participants currently delaying |
  | `charactersWithTurn: Set<UUID>` | Who still has a turn this round |
  | `round` | Starts at 1 |
  | `charactersMap` | Characters by uuid |
  | `trackerMetaMap` | Role (pc / opponent / neutral / ally / hazard / reinforcement), `isSimpleHazard`, `initiativeBonus`, `reinforcementSlotId`, `reinforcementPending`, … |
  | `history`, `redoStack` | Command history |

## Rolling and ordering

- Rolling happens in the preview (`components/PreviewDisplay/PreviewDisplay.tsx`), not in a command:
  - Encounter creatures roll d20 + `initiativeBonus`, with tie priority `NPC`. Groups with `count` are expanded and suffixed A, B, …
  - A generic party (no saved party) rolls a plain d20 with priority `PC`.
  - Saved party members start at initiative 0. The GM types in the players' real results.
  - The GM can edit every value in the preview form.
  - Simple hazards have no initiative field.
- `participantsToEncounterCharacters` (`store/convert.ts`) sorts once, when the encounter starts: by initiative, highest first, then by `tiePriority`, highest first.
- After that the **queue position is what counts**. The stored `initiative` number is not updated by a reorder or a return from Delay. That matches the rules ("usually not necessary to track the original initiative numbers").
- `ReorderCharactersCommand {newOrder, oldOrder?, type?: 'initiative' | 'delay'}` replaces `charactersOrder` or `delayedOrder`, dropping duplicates. For `charactersOrder` it treats `newOrder` as a reshuffle of the current queue: participants no longer in the queue are dropped, and ones `newOrder` misses keep their current index (#28). The UI has a drag-and-drop dialog for it.
- No PC initiative modifier is stored. There is no skill choice (Perception or Stealth) and no reroll support. The builder's "Initiative Description" field is not saved.

## Turn and round flow

A participant has acted this round once it is no longer in `charactersWithTurn`. The "Next Turn" button runs `handleNextTurn` in `components/InitiativeTracker/InitiativeTrackerPage.tsx`, and `executeRoundAction` picks one of these commands:

| Command | Effect |
|---|---|
| `EndTurnCommand {uuid}` | Removes the turn and moves the participant to the end of `charactersOrder`. Fails if it has no turn |
| `EndRoundCommand` | `round + 1`. Every participant in `charactersOrder` and `delayedOrder` gets a turn again, including knocked-out ones. No reordering |
| `FinalizeTurnAndAdvanceRoundCommand {uuid, action: 'end-turn' \| 'delay' \| 'ko'}` | One undo step: the action plus `EndRoundCommand`. Valid only when `uuid` is the last participant with a turn |
| `FinalizeTurnAndReturnToInitiativeCommand {activeUuid, returningUuid, action}` | One undo step: `ReturnToInitiativeCommand` plus `EndRoundCommand` (see quirks) |
| `GiveAdditionalTurnCommand {uuid}` | Gives the turn back. No UI and not registered |

- Before a turn ends while someone is delaying, the UI asks whether a delayed participant returns.
- After a round advances, a "Round N" dialog lists that round's narrative and reinforcement slots.
- **Not modelled:**
  - start-of-turn and end-of-turn steps
  - action and reaction counters
  - conditions, condition ticking and durations
  - persistent damage
  - recovery checks
  - The "End Encounter" button is a stub.

## State changes: Delay, knock-out, removal

`getChangeCharacterState` (`CommandHistory/Commands/composites/ChangeCharacterState.ts`) builds every state transition. It always updates `turnState`, then adds commands for the specific transition:

| Transition | Added commands |
|---|---|
| normal → delayed (`DelayCharacterCommand`) | `EndTurnCommand` (to the end of the queue) + added to `delayedOrder`. Only allowed while the participant still has its turn |
| normal → knocked-out (`KnockOutCharacterCommand`) | `EndTurnCommand` if it still has a turn, otherwise a move to the end of the queue |
| delayed → normal (also `ReactivateCharacterCommand` on a delayed participant) | Removed from `delayedOrder`, moved to the front of the queue |
| delayed → knocked-out | Removed from `delayedOrder`, then the knock-out step |
| knocked-out → delayed | Moved to the end of the queue and added to `delayedOrder` |
| knocked-out → normal (`ReactivateCharacterCommand`) | Turn state only. The participant doesn't get its turn back |

- `ReturnToInitiativeCommand {activeUuid, returningUuid, action}` does the return in one step. It:
  1. ends the active participant's turn,
  2. gives the returner a turn and puts it at index 0 with `turnState: 'normal'`,
  3. removes the returner from `delayedOrder`.

  It is the rules' "return after another creature's turn".
- **Knock-out position:** the end of a rotating queue is "directly before the current actor". A knock-out on someone else's turn therefore matches the rule "move to directly before the turn in which you were reduced to 0 HP", whatever caused it. A knock-out on the participant's own turn ends that turn and moves it to the end of the queue, which is the position it already had, as the rule requires.
- Knocked-out participants keep getting a turn every round, which fits recovery checks; the GM passes the turn.
- `ChangeHealthCommand` does **not** knock out at 0 HP. Linking the two is a planned feature.
- `RemoveCharacterCommand` ("Slay") deletes the participant from the map, both orders and the turn Set.

## Reinforcements and hazards

- **Triggering reinforcements.** `TriggerReinforcementEventCommand {slotId}`:
  - It spawns the slot's participants, expanded by `count`, with `role: 'reinforcement'`.
  - It places them with `insertByInitiative`: sorted by initiative, never before index 0. They act this round.
  - Without a fixed `initiative`, a participant gets a deterministic pseudo-roll from a hash of the slot id. `initiativeBonus` is not added.
  - It also supports pre-added participants with `reinforcementPending: true`, which it activates instead.
  - The UI allows triggering only once `trigger.round <= round`.
- **Simple hazards** (`meta.isSimpleHazard`):
  - They are hidden from the visible queue and shown in a hazards panel.
  - They still sit in `charactersOrder` and `charactersWithTurn`.
- **Complex hazards** take turns like creatures.
- Mid-combat additions are only possible through reinforcement slots.
- **Not modelled:** Ready, summons, minions, companions, eidolons, multiple slots for one creature.

## Command history

- `executeCommand` (`CommandHistory/CommandHistoryProvider.tsx`) works like this:
  - On FAILURE, the command is undone and an error is thrown.
  - Otherwise it is pushed to `history`, and `redoStack` is cleared.
  - `CompositeCommand` runs its children in order and undoes them in reverse.
- History is persisted, and commands are revived by type from `CommandHistory/commandRegistry.ts`. **Every command the UI runs, directly or nested, must be registered.**
  - The class `UpdateCharacterDataCommand` is registered under the type `UpdateCharacterCommand`.
- New turn-flow behaviour belongs in a command, so undo, redo and reload keep working. Add a `*.spec.ts` next to it; most commands have one.

## Known quirks (open bugs)

Check whether each is still open before relying on it.

- Participants that start delayed get no turn in round 1 (#48).
- `ReturnToInitiativeCommand` isn't registered, so reloading after a return from Delay can break the store (#87).
- Returning from Delay after the last turn of a round advances the round first. The returner then acts as the first turn of the next round, not the last turn of the current one (#93).
- Delaying through a whole round doesn't send the participant back to their old spot (#35).
- Reinforcement-slot participants are also put in the starting roster, so triggering the slot adds copies (#90).
- A triggered reinforcement's initiative ignores `initiativeBonus`. Its placement compares stored numbers that a reorder doesn't update (#91).
- Simple hazards stay in the turn bookkeeping. The final-turn checks in the commands count them, while the UI doesn't (#92).
- The builder's combat-ready state (delayed or defeated), hidden-from-players and initiative description aren't saved into the encounter (#94).
