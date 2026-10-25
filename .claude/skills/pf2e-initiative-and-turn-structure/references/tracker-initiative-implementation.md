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
- **Template participant** (`CombatantParticipant`): `initiativeBonus?`, `tiePriority?`, `startingState?` (`normal` | `knocked-out`), `hiddenUntilFirstTurn?`, `initiativeDescription?`, `count?`. The builder's combat-ready state maps to `startingState` (Active → `normal`, Defeated → `knocked-out`); its Visibility toggle ("Always visible" / "Hidden until first turn") maps to `hiddenUntilFirstTurn`, which the tracker copies to `trackerMetaMap` and shows as a badge before the traits. The player view doesn't use it yet. Hazards add `successesToDisable` and `isComplexHazard?`. Creatures can have an optional `successesToDisable` too (disable checks, e.g. a clockwork construct; the builder's "Disable Checks" block).
  - **Nobody starts delayed** (house rule): starting delayed let a participant join right after the first turn of the encounter, which nearly always wins initiative. A participant meant to show up later starts in the order with `hiddenUntilFirstTurn` instead.
- **Narrative slots** (`NarrativeSlot`): `type` is `default`, `reinforcement` or `ongoing`. `trigger: { round?, frequency? }`, plus `participants`. Reinforcements are slots of type `reinforcement`; one without a `round` (builder: empty "Reinforcement Round", shown as "Any round") can be triggered in any round, stays off the round timeline and the round dialog, and counts as round 1 for XP attrition. `visibleBeforeTrigger?` (builder: "Before Arrival", hidden by default) lets players see a reinforcement's participants before it triggers; the tracker marks pending ones of a hiding slot "Hidden until arrival". A participant's own `hiddenUntilFirstTurn` keeps it hidden until its first turn after the trigger, whatever the slot says.
- **Runtime store** (`store/encounterRuntimeStore.ts`, persisted to localStorage as `encounter-store`):

  | Field | Meaning |
  |---|---|
  | `charactersOrder: UUID[]` | A **rotating queue**. Index 0 is the current actor. Delayers keep their spot in it. `delayingIds` (`store/operations.ts`) picks them out by `turnState: 'delayed'`, in queue order (the order they started delaying, unless the GM reorders them) |
  | `charactersWithTurn: Set<UUID>` | Who still has a turn this round |
  | `round` | Starts at 1 |
  | `charactersMap` | Characters by uuid |
  | `trackerMetaMap` | Role (pc / opponent / neutral / ally / hazard / reinforcement), `isSimpleHazard`, `initiativeBonus`, `reinforcementSlotId`, `disableChecksRequired` / `disableChecksSucceeded`, `shownProgress` (HP or disable progress in the list and player view, for a participant with both), … |
  | `pendingReinforcements` | Reinforcements given an initiative in the preview and not yet triggered: `slotId`, the prepared `character` and `meta`, and their spot (`above`, `below`). Not in `charactersMap` or the orders, so the tracker's queue and the player view don't show them |
  | `history`, `redoStack` | Command history |

## Rolling and ordering

- Rolling happens in the preview (`components/PreviewDisplay/PreviewDisplay.tsx`), not in a command:
  - Encounter creatures roll d20 + `initiativeBonus`, with tie priority `NPC`. Groups with `count` are expanded. A name used more than once across the whole roster (any side, any entry) gets a letter suffix A, B, … on each use, skipping letters already taken; party names count as taken but are never renamed (`utils/uniqueNames.ts`).
  - Reinforcement slot participants are rolled the same way (`generateReinforcements` in `PreviewDisplay/generateParticipants.ts`; a fixed `initiative` on the slot participant wins) and shown in their own "Reinforcements · round N" cards, where the GM can change initiative and HP. HP defaults to level × 5. Their names are made unique against the party and the starting roster.
  - A generic party (no saved party) rolls a plain d20 with priority `PC`.
  - Saved party members start at initiative 0. The GM types in the players' real results.
  - The GM can edit every value in the preview form.
  - Simple hazards have no initiative field.
- `participantsToEncounterCharacters` (`store/convert.ts`) sorts once, when the encounter starts: by initiative, highest first, then by `tiePriority`, highest first.
- After that the **queue position is what counts**. The stored `initiative` number is not updated by a reorder or a return from Delay. That matches the rules ("usually not necessary to track the original initiative numbers").
- `ReorderCharactersCommand {newOrder, oldOrder?, movedIds?}` replaces `charactersOrder`, dropping duplicates. It treats `newOrder` as a reshuffle of the current queue: participants no longer in the queue are dropped, and ones `newOrder` misses keep their current index (#28). The UI has a drag-and-drop dialog for it, which passes the dragged participants as `movedIds`. A reorder also moves the spots of pending reinforcements (see below) and undo restores them.
- `skipParticipantsWithoutTurn` (`store/operations.ts`) runs after a reorder of `charactersOrder` and after `EndTurnCommand`: it rotates the queue until a participant with a turn, or a delaying one, is at the front, so someone moved up after acting doesn't act twice. When nobody has a turn left (the round's last turn), the order stays as it is.
- No PC initiative modifier is stored. There is no skill choice (Perception or Stealth) and no reroll support. The builder's "Initiative Description" field is saved, but the tracker doesn't use it.

## Turn and round flow

A participant has acted this round once it is no longer in `charactersWithTurn`. The "Next Turn" button runs `handleNextTurn` in `components/InitiativeTracker/InitiativeTrackerPage.tsx`, and `executeRoundAction` picks one of these commands:

| Command | Effect |
|---|---|
| `EndTurnCommand {uuid}` | Removes the turn, moves the participant to the end of `charactersOrder` and skips participants without a turn. Fails if it has no turn |
| `EndRoundCommand` | `round + 1`. Every participant in `charactersOrder` gets a turn again, delayers too, including knocked-out ones. No reordering |
| `FinalizeTurnAndAdvanceRoundCommand {uuid, action: 'end-turn' \| 'delay' \| 'ko'}` | One undo step: the action plus `EndRoundCommand`. Valid only when `uuid` is the last participant with a turn |
| `FinalizeTurnAndReturnToInitiativeCommand {activeUuid, returningUuid, action}` | One undo step: `ReturnToInitiativeCommand` plus `EndRoundCommand` (see quirks) |
| `GiveAdditionalTurnCommand {uuid}` | Gives the turn back. "Give Turn Back" in the selected-participant panel, for a participant that already acted |

- **Delaying a whole round.** A delaying participant keeps its entry in `charactersOrder` (shown as an "is delaying" marker), which is its old spot. When the turn before that entry ends, `getRoundActionCommand` returns it there through `ReturnToInitiativeCommand` (`delayerReturningAfterTurn`: `charactersOrder[1]` is delaying). The delayed turn is lost, as the rules say.
- **Return prompt.** Before a turn ends, the UI asks whether a delaying participant returns when `asksToReturnFromDelay` is true: some delayer other than the one coming back after this turn anyway. The prompt then lists every delayer (`returnPromptEntries`), nearest old spot first, with the number of turns before that spot in parentheses (0: right after this turn; other delayers' spots don't count).
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
| normal → delayed (`DelayCharacterCommand`) | `EndTurnCommand` (to the end of the queue). Only allowed while the participant still has its turn |
| normal → knocked-out (`KnockOutCharacterCommand`) | `EndTurnCommand` if it still has a turn, otherwise a move to the end of the queue |
| delayed → normal (also `ReactivateCharacterCommand` on a delayed participant) | Moved to the front of the queue. Without a turn this round, it is then rotated to the back like any other participant without a turn (`skipParticipantsWithoutTurn`) |
| delayed → knocked-out | The knock-out step |
| knocked-out → delayed | Moved to the end of the queue |
| knocked-out → normal (`ReactivateCharacterCommand`) | Turn state only. The participant doesn't get its turn back |

- **Disable is the hazard's K.O.** A disabled hazard has `turnState: 'knocked-out'` and goes through the same round action (`'ko'`) and transitions; only the names differ (`getOutOfFightNames`, `getParticipantStateLabel` in `store/trackerMappers.ts`): hazards are Disabled / Destroyed, everyone else Knocked Out / Slain, whatever took them out. A disabled complex hazard stays in the queue; a simple hazard only changes its `turnState`.
- **0 HP or full disable checks** (`components/InitiativeTracker/takeOut.ts`): damage to 0 HP, or a disable success or correction that fills the checks, of a participant still in the fight knocks it out (disables a hazard) without asking, PCs and everyone else alike. Slay / Destroy stays a manual action. The HP or check change and the K.O. run as one `CompositeCommand`, so one undo takes back both.
- **Coming back** (`BringBackNotice`): healing a knocked-out or disabled participant from 0 HP, or lowering its full disable checks, always asks (PCs too), since the tracker may not hold everything that keeps the participant out; the change and the answer run in one undo step. If another value is still at its take-out level (full checks after healing, 0 HP after lowering the checks), "Still Knocked Out?" / "Still Disabled?" keeps it out by default and offers "Also set HP to 1 / disable checks to X-1/X and reactivate". Otherwise "Reactivate?" brings it back by default and offers "Keep Knocked Out" / "Keep Disabled". The default never changes the other value, and the participant comes back only when no value is at its take-out level.
- **Notices block the tracker** (`TimedNotice`): while the return prompt, the coming-back notice, the take-out notice or the resume-timer notice is open, nothing else on the page can be used. A click outside lands on a transparent backdrop and only gives the default answer, and keyboard focus stays in the notice. The change that opened a notice is held until it is answered (except a manual K.O., see "Exceptions kept for the animations" below), so no other change can run in between; there is only ever one notice. A card action runs the page's handler from the latest render when its slide delay ends, so it is built from current state, and it is dropped, without the card flashing it, if a notice or the round dialog is open by then. Each prompt's state comes from `useBlockingPromptState`, whose setter adds the prompt to `openPromptsRef` at once, so an action due in the same tick is dropped too; the prompt leaves the set when it is cleared or a render commits it as null, never on a render that hasn't caught up with the setter yet. The take-out notice waits for the return prompt or the round dialog a K.O. opens, and is dropped once its participant is gone or no longer out.
- **Manual Reactivate** sets every value at its take-out level back the same way (HP to 1, checks to one below full), in the same undo step.
- **Manual K.O. / Disable** (swipe, the card's button, the Delaying and Hazards tabs) knocks out or disables at once (through the return prompt when it asks), then opens `TakeOutNotice` to ask what follows. Its default (timeout, close, Escape, and the last, dimmed button) follows the side (`getDefaultTakeOut`): opponents, hazards included, are Slain / Destroyed, PCs, allies and neutral participants stay Knocked Out / Disabled; the default changes no value. Buttons offer the other answer, and staying out with HP set to 0 (`ChangeHealthCommand`, temp HP included), the checks filled (`RecordDisableProgressCommand`) or both, for each value that would change (`getApplicableTakeOutEffects`; HP only while above 0, since temp HP doesn't keep anyone in the fight). The answer runs through `amendCommand`, which records it in the K.O.'s undo step, so one Undo goes back to before the K.O.; an answer that moves the turn or the round (only a Slay that ends a turn, which is also the only one that goes through the return prompt) gets a step of its own, since an undo rewinds the timer only once. The page keeps where the K.O. is recorded (`takeOutStepIndexRef`): a K.O. that ends the round opens the round dialog before the notice, and its Trigger Reinforcements records a step of its own, after which the answer is recorded as a separate step instead of being merged into the reinforcements. A per-participant default is #158.
- `RecordDisableProgressCommand {uuid, delta | value}` only changes the success count (clamped to the required count), for any participant with one. It never changes the turn state; the tracker page decides about taking out or bringing back.
- `ReturnToInitiativeCommand {activeUuid, returningUuid, action}` does the return in one step. The round action uses it only when the GM acts on the current actor (`charactersOrder[0]`) and the next participant is delaying. It:
  1. ends the active participant's turn,
  2. gives the returner a turn and puts it at index 0 with `turnState: 'normal'`.

  It is the rules' "return after another creature's turn".
- **Knock-out position:** the end of a rotating queue is "directly before the current actor". A knock-out on someone else's turn therefore matches the rule "move to directly before the turn in which you were reduced to 0 HP", whatever caused it. A knock-out on the participant's own turn ends that turn and moves it to the end of the queue, which is the position it already had, as the rule requires.
- Knocked-out participants keep getting a turn every round, which fits recovery checks; the GM passes the turn.
- `ChangeHealthCommand` itself doesn't knock out at 0 HP; the tracker page adds the K.O. (see above).
- `RemoveCharacterCommand` ("Slay", "Destroy" for a hazard) deletes the participant from the map, both orders and the turn Set. When the participant is the current actor or the last one left to act (`removalEndsTurn`), `getRemoveCommand` (`roundActionCommand.ts`) ends its turn first through the round action (`'end-turn'`), in the same undo step, so the round goes on. The tracker uses it for Slay / Destroy and asks the return prompt first when someone is delaying.

## Automation: necessary and sufficient conditions

A rules condition the tracker can see is usually **necessary** for a state, not **sufficient**: the GM may know of an ability, a ruling or an effect the tracker doesn't hold. The tracker:

- **acts without asking** only when a condition it sees is sufficient, or when a necessary condition stops holding (the state can't go on);
- **asks** (a `TimedNotice`) when only a necessary condition is met, with the default that changes least;
- **never** takes a participant out or brings it back on a guess beyond that.

| Situation | Condition | Tracker |
|---|---|---|
| Damage to 0 HP, or disable checks filled | Positive HP and checks not full are necessary to stay active; one of them stops holding | K.O. / Disable without asking, in the change's undo step |
| Healing from 0 HP, or lowering full checks | Necessary to come back, not sufficient | Always asks ("Reactivate?" / "Still Knocked Out?") |
| Manual K.O. / Disable | The GM's decision is sufficient for the K.O.; whether the participant is slain and which values follow is not known | K.O. at once, then asks what follows (`TakeOutNotice`) |
| A delayer's old spot comes up again (delayed a whole round) | Sufficient: the rules return it there | Returns without asking (`delayerReturningAfterTurn`) |
| Another delayer at the end of a turn | Returning is the delayer's choice | Asks ("Return to Initiative?") |
| Last participant with a turn ends it | Turn bookkeeping, not a judgement | Starts the next round without asking |

When adding an automation, place it in this table first: name the condition, say whether it is necessary or sufficient, and ask whenever it is only necessary.

### Exceptions kept for the animations

The initiative cards animate an action before it runs, and these exceptions keep the animation truthful without giving up the lock:

- **The card's slide delay.** A card button or swipe runs its action `actionTriggerMs` (about 100 ms) after the press, so the slide plays first. The action is dropped if a notice or the round dialog opened in that time (see "Notices block the tracker").
- **K.O. before the question.** A manual K.O. / Disable runs before `TakeOutNotice` is answered, so the card's K.O. animation shows the change that really happened. That is the only change made before its notice is answered. The answer (stay out, with values to match, or slay) is recorded in the K.O.'s undo step through `amendCommand`, so one Undo returns to the state before the swipe, unless the round dialog recorded a step in between.

## Reinforcements and hazards

- **Pending reinforcements (initiative set in the preview).** When the encounter starts, `buildPendingReinforcements` (`store/convert.ts`) sorts the reinforcements into the starting order with the same comparator (stable, starting participants first, so other ties go after the participants already there) and stores each one's spot as its neighbours among the participants that start in `charactersOrder`: `below` (null at the end of the round) and `above` (null at the top). Logic lives in `store/pendingReinforcements.ts`.
  - **Spot resolution** (`spotIndex`): before `below`; at the end when `below` is null; after `above` when `below` has left the order (delaying, slain); by initiative (`arrivalActsBefore` against `effectiveInitiatives`) when both have left.
  - **Reorder** (`respotAfterReorder`, house rule): a pending reinforcement sticks to the participant below it and moves with it while others are reordered; when that participant is the one moved, it sticks to the participant above and keeps its place. "Moved" is `movedIds`, or, without it, everyone outside the longest common subsequence of the old and new round orders (`movedInReorder`). The spots are read in round order (`roundOrderOf`), not the rotating queue. State changes that go through `ReorderCharactersCommand` without `movedIds` (a knock-out outside the participant's turn, a return from Delay through the state menu) re-spot with the subsequence rule, which marks the participant they move as moved. `EndTurnCommand`, `ReturnToInitiativeCommand` and `RemoveCharacterCommand` don't re-spot; spot resolution falls back as above. Undo restores the spots, which the command stores by uuid (`oldPendingSpots`).
  - **In the GM list**: until it triggers, each one shows in the initiative list as a dashed marker row like a delay ("<name> arrives · round N") at the spot it would take if triggered now (`orderWithPendingSpots`, the same placement as the trigger). Reinforcements without a preview spot stay only in the reinforcements panel.
  - **Trigger** (`placePendingReinforcements`, house rule): each arrival goes to its spot. A spot after the current turn acts this round; so does a spot at the very top of a round nobody has acted in yet, which makes the arrival the current actor. A spot that has passed waits for the next round. Arrivals sharing a spot keep their initiative order. Names are not changed on arrival.
- **Triggering reinforcements.** `TriggerReinforcementEventCommand {slotId}`:
  - When the slot has pending reinforcements, it places them as above and removes them from `pendingReinforcements`; undo restores them. The rest of this list is the fallback for slots without them (encounters started before the preview set reinforcement initiative).
  - It spawns the slot's participants, expanded by `count`, with `role: 'reinforcement'`. Reinforcements are not in the starting roster; a slot whose participants are already in `trackerMetaMap` (by `reinforcementSlotId`) counts as triggered, and triggering it again fails.
  - Without a fixed `initiative`, a participant rolls d20 + `initiativeBonus`. The roll is stored in the command data, so redo and reload replay it.
  - It places them with `insertByInitiative` among the participants still to act this round, never before index 0. They act this round (house rule); one whose initiative is above everyone still to act goes right after the current turn.
  - Placement compares against `effectiveInitiatives` (`store/initiativePlacement.ts`): values derived from the current order, because a reorder or a return from Delay doesn't update the stored numbers.
  - Ties (`arrivalActsBefore`): an opposing arrival goes before a PC it ties with; other ties go after the participants already there.
  - The timeline offers "Trigger Now" once `trigger.round <= round`. The reinforcements panel's Trigger button works in any round, which is how a slot without a round is triggered. A visible slot with visible participants and no round covers what a starting delay was used for (a second phase, a creature waiting to join).
- **Simple hazards** (`meta.isSimpleHazard`):
  - They are hidden from the visible queue and shown in a hazards panel, with disable quick actions, Disable, and Reactivate / Destroy once disabled.
  - They are not in `charactersOrder` or `charactersWithTurn` (`parseCharacters` leaves them out).
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
  - A revived command is rebuilt with `new CommandClass(storedData)`, so the constructor must keep everything `undo()` needs from `data` (the `original` snapshot, or the nested `command` it built on execute).
  - `commandRegistry.spec.ts` fails when a command class in `CommandHistory/Commands/` is not registered under its `type`.
  - Loading skips a stored command of an unknown type with a console warning. It keeps the undo history after the last unknown command and the redo stack before the first one, so undo and redo never step past it.
- New turn-flow behaviour belongs in a command, so undo, redo and reload keep working. Add a `*.spec.ts` next to it; most commands have one.

## Known quirks (open bugs)

Check whether each is still open before relying on it.

- Returning from Delay after the last turn of a round advances the round first. The returner then acts as the first turn of the next round, not the last turn of the current one (#93).
- Simple hazards stay in the turn bookkeeping. The final-turn checks in the commands count them, while the UI doesn't (#92).
