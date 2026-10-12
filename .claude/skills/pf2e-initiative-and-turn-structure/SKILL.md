---
name: pf2e-initiative-and-turn-structure
description: Reference for Pathfinder 2e (remaster) initiative and turn structure, and for how Roundtable Tracker models it. Covers rolling initiative and tie rules, initiative bonuses/penalties and tie-break abilities, rounds/turns/actions/reactions/free actions, what happens at the start and end of a turn, durations, Delay, Ready, knocked out/dying/wounded, joining or leaving the order (reinforcements, hazards, fleeing), stunned/slowed/quickened/haste limits, minions, summons, animal companions, eidolons and multi-slot creatures, and exploration vs encounter time. Load before designing, implementing, reviewing or testing anything in the initiative tracker, turn/round flow, encounter builder initiative fields or reinforcements, before writing tickets about them, and when answering PF2e questions about combat order or turn timing.
---

# PF2e initiative and turn structure

## Files

- [references/pf2e-initiative-rules.md](references/pf2e-initiative-rules.md): the rules, with Archive of Nethys links.
- [references/tracker-initiative-implementation.md](references/tracker-initiative-implementation.md): how this app models them, including the command names and the known quirks.

Read the section you need; both files have a table of contents or headings. For the full text of any linked rule, use the `pf2e-archive-of-nethys-search` skill.

## Core model in one screen

- **Encounter** = initiative rolled once, then rounds until it ends.
- **Round** ≈ 6 s. Every participant gets one turn per round, from the highest initiative to the lowest.
  - The core turn rules tick on **turns**: reactions come back at the start of your turn, durations run until the start or end of a named creature's turn, persistent damage happens at the end of your turn, and delayers return at the end of any turn.
  - **Round boundaries matter too.** Adventure content uses "at the start/end of (each) round": environmental damage on some planes, hazards that reset or run their routine at the end of the round, creature abilities, mob attacks. A tracker needs hooks for turn start/end **and** round start/end.
- **Initiative**:
  - Usually Perception. Stealth if Avoiding Notice; a skill for social or special openings.
  - The GM rolls for all non-PCs.
  - **Ties:** the enemy goes first; PCs order themselves. A few abilities override this, e.g. [Pilgrim's Token](https://2e.aonprd.com/Feats.aspx?ID=6496).
  - Bonuses follow the normal stacking rules (e.g. Scout +1 circumstance, Incredible Initiative +2 circumstance); penalties too (e.g. frightened).
  - After the start, **position matters, not the number**.
- **Turn**:
  - **Start:** effects you created tick down, then "turn begins" triggers, then the dying recovery check. **Last**, you regain 3 actions and 1 reaction, modified by stunned, slowed or quickened.
  - **Act.**
  - **End:** "until end of turn" effects end. Persistent damage, then its flat check, then affliction saves; then frightened −1 and similar. Then "turn ends" triggers.
  - The multiple attack penalty resets at the end of the turn.
- **Actions**: 3 per turn. One reaction per round, which comes back at the start of your turn. Free actions with a trigger work like reactions, but only one free action per trigger.
- **Durations**:
  - "N rounds" ticks at the start of the **creator's** turn.
  - "Until the end of the target's next turn" ends at the end of the **target's** turn.
- **Order changes**:
  - **Delay** (free, at the start of your turn): you leave the order and return after any other creature's turn, permanently at that spot. No reactions while delaying. A whole round of delay loses the turn and returns you to your old spot. Negative start/end effects happen right away.
  - **Ready** doesn't change position.
  - **Knocked out**: move to directly before **the turn that is happening** when you drop to 0 HP, whoever caused it (an attack, a reaction, a hazard, persistent damage). It is not "before the creature that knocked you out". Then dying 1 or 2 + wounded. Dropping on your own turn leaves your position unchanged. Dropping before anyone's first turn (damage from whatever started the fight) is a GM call.
  - Most monsters die at 0 HP and leave the order.
- **Action-changing conditions**:
  - Stunned overrides slowed.
  - Slowed means fewer actions regained.
  - Quickened gives +1 action, never more than one from all sources combined. Haste's extra action is for Strike or Stride only.
  - All of them apply when actions are regained.
- **No own slot**: minions, summons, companions, familiars and mounts act on their master's turn (2 actions when commanded). Eidolons share the summoner's turn.
- **Own slot**: complex hazards, rolled with Stealth.
- **Simple hazards** never take turns themselves.
- **Hazards can add creatures** to the fight:
  - In the GM Core [Summoning Rune](https://2e.aonprd.com/Hazards.aspx?ID=495) (a complex hazard), the summoned creature rolls its own initiative and gets 3 actions and reactions.
- **No rules support**: multiple slots for one creature, and a procedure for reinforcements. Those are GM or house rules; the usual practice is that arrivals roll on arrival and slot in.

## When working on the tracker

- Model turn-flow changes as registered, undoable commands with a spec. See the implementation file's "Command history" section.
- Check the "Known quirks" list before you assume a behaviour is intended.
- When the rules are silent (reinforcements, multi-slot bosses, ties between two tie-winners), the app has to choose. Say in the code or ticket that the choice is a house rule.
- Keep [tracker-initiative-implementation.md](references/tracker-initiative-implementation.md) in sync when the turn flow changes.
