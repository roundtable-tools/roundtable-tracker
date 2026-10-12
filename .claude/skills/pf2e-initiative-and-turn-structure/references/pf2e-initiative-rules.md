# PF2e initiative and turn structure: rules reference (remaster)

Remaster rules (Player Core, GM Core, Monster Core, Player Core 2), with Archive of Nethys (AoN) links.
Quotes are verbatim AoN text. Where the rules are silent, this file says so; never fill such gaps
with invented rules.

## Contents

1. Encounter mode, rounds and time
2. Rolling initiative
3. Initiative bonuses, penalties and tie-breakers
4. Turn structure: start, act, end
5. Actions, reactions and free actions
6. Durations: what ticks when
7. Changing the order: Delay, Ready, knocked out, joining, leaving
8. Conditions that change actions: stunned, slowed, quickened, haste
9. Dying, wounded, doomed, hero points
10. Common reactions and free actions
11. Special participants: minions, summons, companions, eidolons, hazards, reinforcements
12. Exploration time vs encounter time

---

## 1. Encounter mode, rounds and time

- [Encounter Mode](https://2e.aonprd.com/Rules.aspx?ID=2421): time is divided into **rounds** of 6 seconds. In each round, every participant takes one **turn**, in initiative order.
- [Step 2: Play a Round](https://2e.aonprd.com/Rules.aspx?ID=2424): a round starts when the creature with the highest initiative starts its turn. It ends when the one with the lowest initiative ends its turn.
- [Step 3: Begin the Next Round](https://2e.aonprd.com/Rules.aspx?ID=2425): "Don't roll initiative again." The order carries over.
- [Step 4: End the Encounter](https://2e.aonprd.com/Rules.aspx?ID=2426): stop following initiative and usually go back to exploration.
- [Ending the Encounter](https://2e.aonprd.com/Rules.aspx?ID=2570) (GM Core):
  - The encounter usually ends when one side is killed, knocked out or surrenders.
  - Keep using rounds while time pressure remains, e.g. a PC is dying or hanging from a cliff.
- **Turn boundaries.** The core turn rules attach everything to turns (§4, §6):
  - reactions and actions come back at the start of a turn;
  - durations end at the start or end of a named creature's turn;
  - persistent damage and frightened tick at the end of a turn;
  - delayers may return at the end of any other creature's turn.
- **Round boundaries.** Adventure and bestiary content also uses the start and end of the round. Examples:
  - The [Void](https://2e.aonprd.com/Traits.aspx?ID=510) and [Vitality](https://2e.aonprd.com/Traits.aspx?ID=509) plane traits: "At the end of each round", living or undead creatures take environmental damage.
  - [Water](https://2e.aonprd.com/Traits.aspx?ID=732) planes: creatures with water weakness take damage at the end of each round.
  - Hazards that reset at the start or end of the round: [Ash Web](https://2e.aonprd.com/Hazards.aspx?ID=79), [Tripartite Lock](https://2e.aonprd.com/Hazards.aspx?ID=791).
  - [The Doom of Azlant](https://2e.aonprd.com/Hazards.aspx?ID=795) "doesn't roll initiative; its routine plays out at the end of each following round, starting with round 7."
  - Creature abilities: [Heart-Eating Vulture](https://2e.aonprd.com/Monsters.aspx?ID=4672) explodes at the end of the round it dies; [Gromog](https://2e.aonprd.com/Monsters.aspx?ID=2218) makes a flat check at the start of each round.
  - Brawling crowds such as the [Commoner](https://2e.aonprd.com/NPCs.aspx?ID=3488): "Roll one or two attacks at the end of each round against each PC".
  - The round number also drives the GM's own triggers, such as reinforcements arriving "on round 3".
- So a tracker needs four hook points: turn start, turn end, round start and round end.

## 2. Rolling initiative

[Step 1: Roll Initiative](https://2e.aonprd.com/Rules.aspx?ID=2423) (Player Core):

- "Rolling initiative marks the start of an encounter."
- **Which check:**
  - Usually a Perception check.
  - "if you were Avoiding Notice during exploration, you'd roll a Stealth check. A social encounter could call for a Deception or Diplomacy check. In most cases, you can still use Perception if you prefer."
  - [Perception for Initiative](https://2e.aonprd.com/Rules.aspx?ID=2299): a skill rolled for initiative is compared just like Perception.
  - [Alternative Initiative Skills](https://2e.aonprd.com/Rules.aspx?ID=2540) (GM Core) gives more examples:
    - Deception for a surprise attack mid-negotiation
    - Society to unmask a spy
    - Arcana or Occultism when a studied phenomenon summons a monster
- **Who rolls:** the GM rolls for every non-PC.
- **Ordering:** results are ranked from highest to lowest. They are not compared to a DC.
- **Ties:** "If your result is tied with an enemy's result, the enemy goes first. If your result is tied with another PC's, you can decide between yourselves who goes first when you reach that place in the initiative order." See §3 for abilities that break ties.
- **Identical creatures** may share one roll ([Batch Initiative](https://2e.aonprd.com/Rules.aspx?ID=2542)). They "still take individual turns and can still individually change their initiative by Delaying."

When to roll ([Starting the Encounter](https://2e.aonprd.com/Rules.aspx?ID=2539), [Starting Encounters](https://2e.aonprd.com/Rules.aspx?ID=2590)):

- Roll as soon as a participant acts against the other side: attacks, draws a weapon, casts a preparatory spell, or starts a debate.
- Roll when a trap is triggered, or when opposing groups come into contact.
- If a reaction or a trap starts the fight, "resolve all the results of the reaction before calling for initiative rolls."

**Stealth initiative** ([Initiative with Stealth](https://2e.aonprd.com/Rules.aspx?ID=2541), [Avoid Notice](https://2e.aonprd.com/Actions.aspx?ID=2622)):

- The Stealth result is compared to each enemy's Perception DC.
- The sneaker is "undetected and unnoticed by anyone whose DC they meet or exceed."
- Choosing Perception instead means they are definitely detected.

**Sleepers** ([Watches and Surprise Attacks](https://2e.aonprd.com/Rules.aspx?ID=2602)):

- Sleeping creatures roll initiative too, using Perception with a –4 status penalty for being unconscious.
- They don't wake up automatically.

**Variant duels** ([Duels](https://2e.aonprd.com/Rules.aspx?ID=3091), GM Core):

- Duelists reroll initiative at the start of every round.
- So "a duelist might act twice in a row".

## 3. Initiative bonuses, penalties and tie-breakers

An initiative roll is a check, so the normal bonus types apply:

- Only the highest bonus of each type counts (circumstance, item, status).
- All penalties of different types add up.
- Common penalties:
  - [frightened](https://2e.aonprd.com/Conditions.aspx?ID=76): status penalty to all checks
  - [unconscious](https://2e.aonprd.com/Conditions.aspx?ID=95): –4 status to Perception
  - [Juggernaut Mutagen](https://2e.aonprd.com/Equipment.aspx?ID=3318): –2 to initiative rolls

**Common bonuses**

| Source | Kind | Effect |
|---|---|---|
| [Scout](https://2e.aonprd.com/Actions.aspx?ID=2629) (exploration activity) | circumstance | +1 initiative for every party member. +2 with [Incredible Scout](https://2e.aonprd.com/Feats.aspx?ID=6487) or [Scout Dedication](https://2e.aonprd.com/Feats.aspx?ID=6394) |
| [Incredible Initiative](https://2e.aonprd.com/Feats.aspx?ID=5160) (general feat 1) | circumstance | +2 initiative |
| [Battlefield Surveyor](https://2e.aonprd.com/Classes.aspx?ID=35) (Fighter 7 feature) | circumstance | +2 to Perception for initiative |
| [Scout's Warning](https://2e.aonprd.com/Feats.aspx?ID=4876) (Ranger/Rogue 4, free action) | circumstance | allies +1, or +2 if you were Scouting |
| [Swaggering Initiative](https://2e.aonprd.com/Feats.aspx?ID=6150) (Swashbuckler 4) | circumstance | +2, draw a weapon, gain panache if you act first |
| [Oracular Warning](https://2e.aonprd.com/Feats.aspx?ID=6056) (Oracle 1) | status | allies within 20 ft +2 (more when cursebound) and temporary HP |
| [Ten Paces](https://2e.aonprd.com/Actions.aspx?ID=911) (Gunslinger) | circumstance | +2, draw a weapon, Step |
| [Anticipate Peril](https://2e.aonprd.com/Spells.aspx?ID=2343) (spell 1) | status | +1 to the next initiative roll, up to +4 heightened |
| [Foresight](https://2e.aonprd.com/Spells.aspx?ID=1537) (spell 9) | status | +2 |
| [Song of Marching](https://2e.aonprd.com/Spells.aspx?ID=1774) (composition 3) | status | +1, and roll Performance for initiative |
| [Standard of the Primeval Howl](https://2e.aonprd.com/Equipment.aspx?ID=2197) | item | +1 for you and allies within 20 ft |
| [Orichalcum armor](https://2e.aonprd.com/Equipment.aspx?ID=2802) | circumstance | +1 |
| [Harmlessly Cute](https://2e.aonprd.com/Feats.aspx?ID=4494) (Leshy 1) | circumstance | +1 when rolling Deception for initiative |
| [Posse](https://2e.aonprd.com/Feats.aspx?ID=6282) | circumstance | +1 for you and up to 5 helpers against your prey |

**Roll twice or use another roll**

- [Eye of Apprehension](https://2e.aonprd.com/Equipment.aspx?ID=2973): roll Perception for initiative twice, take the higher.
- [Keen Magical Detection](https://2e.aonprd.com/Feats.aspx?ID=5043): roll initiative twice while Detecting Magic.
- [Zeal for Battle](https://2e.aonprd.com/Spells.aspx?ID=1853): you and an ally both use the higher d20.
- [Battle Planner](https://2e.aonprd.com/Feats.aspx?ID=6464): use a pre-rolled Warfare Lore check as initiative.

**Penalties on enemies**

- [Anticipate Ambush](https://2e.aonprd.com/Feats.aspx?ID=4941): –2 circumstance to enemies rolling Stealth for initiative.
- [Shadow Mark](https://2e.aonprd.com/Feats.aspx?ID=6503): –2 to –4 to the marked target's initiative.

**Ignoring the roll**

- [After You](https://2e.aonprd.com/Feats.aspx?ID=6135) (Swashbuckler 2): don't roll; go last voluntarily and gain panache.
- [Chronoskimmer Dedication](https://2e.aonprd.com/Feats.aspx?ID=8489): a fixed or flat-check-based initiative.

**Winning ties against enemies.** This overrides "the enemy goes first":

| Source | Scope |
|---|---|
| [Pilgrim's Token](https://2e.aonprd.com/Feats.aspx?ID=6496) (general feat 1, Player Core 2) | any adversary; the only core remaster option |
| [Whispering Veil](https://2e.aonprd.com/Equipment.aspx?ID=4971) (item 13) | any foe |
| [Elven Instincts](https://2e.aonprd.com/Feats.aspx?ID=981) (Elf 5), [Ambush Awareness](https://2e.aonprd.com/Feats.aspx?ID=2810) (Goloma 5) | any opponent |
| [Chronoskimmer Dedication](https://2e.aonprd.com/Feats.aspx?ID=8489), [Timewracked Dedication](https://2e.aonprd.com/Feats.aspx?ID=8166) | any opponent (the second is a choice) |
| [Wylderheart Dedication](https://2e.aonprd.com/Feats.aspx?ID=7714) | fiends only |

When both tied creatures can win ties, the rules don't say who goes first; the GM decides.

**Things that trigger on rolling initiative** (they don't change the number, but happen at that moment):

- Rage: [Quick-Tempered](https://2e.aonprd.com/Actions.aspx?ID=2803).
- Hunt Prey: [Favored Prey](https://2e.aonprd.com/Feats.aspx?ID=4874).
- Enter a stance: [Opening Stance](https://2e.aonprd.com/Feats.aspx?ID=4845), [Reflexive Stance](https://2e.aonprd.com/Feats.aspx?ID=6030).
- Demoralize: [Battle Cry](https://2e.aonprd.com/Feats.aspx?ID=5124).
- Draw a weapon: [Recognize Ambush](https://2e.aonprd.com/Feats.aspx?ID=5579).
- [Know the Enemy](https://2e.aonprd.com/Spells.aspx?ID=1813).
- [Defend](https://2e.aonprd.com/Actions.aspx?ID=2623): your shield is raised before your first turn.
- Stealth initiative also unlocks some effects:
  - [Surprise Attack](https://2e.aonprd.com/Classes.aspx?ID=37) (Rogue): in round 1, creatures that haven't acted are off-guard to you.
  - [Tactical Entry](https://2e.aonprd.com/Feats.aspx?ID=4960).

## 4. Turn structure: start, act, end

[Turns](https://2e.aonprd.com/Rules.aspx?ID=2427) have three steps.

**Start your turn** ([Step 1](https://2e.aonprd.com/Rules.aspx?ID=2428)). Steps 1–4 can happen in any order:

1. Durations of effects **you created** that last N rounds go down by 1. An effect ends when it reaches 0. A 3-round spell cast on your turn in round 1 "expire[s] at the start of your fourth turn."
2. Use one free action or reaction triggered by "your turn begins". For example, [Delay](https://2e.aonprd.com/Actions.aspx?ID=2294).
3. If you are dying, roll a recovery check (§9).
4. Other start-of-turn effects, such as fast healing or regeneration.
5. **Always last:** "Regain your 3 actions and 1 reaction. If you haven't spent your reaction from your last turn, you lose it." Stunned, slowed and quickened change the number of actions here (§8).

**Act** ([Step 2](https://2e.aonprd.com/Rules.aspx?ID=2429)):

- Spend your actions in any order.
- A multi-action activity must be finished on the same turn.
- "If you can't act, you can't use any actions, including reactions and free actions."
- "You can choose to end your turn early, losing all remaining actions (but not your reaction)."

**End your turn** ([Step 3](https://2e.aonprd.com/Rules.aspx?ID=2430)):

1. Effects that last "until the end of your turn" end.
   - Sustained effects end unless you Sustained them this turn.
   - Effects an enemy put on you that last "a number of your turns" go down by 1.
2. Take persistent damage, then roll the DC 15 flat check to end it. Then roll saves against afflictions.
   - After those, conditions that change at the end of the turn change. For example, [frightened](https://2e.aonprd.com/Conditions.aspx?ID=76) goes down by 1.
3. Use one free action or reaction triggered by "your turn ends".
4. Resolve anything else that happens at the end of the turn.

The [multiple attack penalty](https://2e.aonprd.com/Rules.aspx?ID=2289) applies only during your turn and resets when it ends.

## 5. Actions, reactions and free actions

[Actions](https://2e.aonprd.com/Rules.aspx?ID=2335):

- Each turn you get 3 actions and 1 reaction.
- **Single action** (◆): one action.
- **Activity**: two (◆◆) or three (◆◆◆) actions in a row, finished in the same turn. Exploration and downtime activities take minutes or more.
- **Reaction** (⤾):
  - Usable on anyone's turn when its trigger happens.
  - One per round. It comes back at the start of your turn; an unspent one is lost.
  - [Reactions in Encounters](https://2e.aonprd.com/Rules.aspx?ID=2432): "The GM determines whether you can use reactions before your first turn begins."
- **Free action** (◇):
  - Without a trigger, it works like a single action, used on your turn, but costs nothing.
  - With a trigger, it works like a reaction but doesn't use up your reaction.
  - [Free Actions](https://2e.aonprd.com/Rules.aspx?ID=2024): "you can use only one free action per trigger".
- Actions don't overlap: you finish one before starting the next. Reactions and triggered free actions can interrupt.
- [Disrupting Actions](https://2e.aonprd.com/Rules.aspx?ID=2342): a disrupted action is still paid for. A disrupted activity usually loses all the actions spent on it.
- [Gaining and Losing Actions](https://2e.aonprd.com/Rules.aspx?ID=2341):
  - When you must lose actions, you choose which ones (e.g. the restricted haste action first).
  - "When you can't act, you still regain your actions unless another effect (like the stunned condition) prevents it."

## 6. Durations: what ticks when

[Duration](https://2e.aonprd.com/Rules.aspx?ID=2378):

| Wording | Ticks or ends |
|---|---|
| "for N rounds" | goes down by 1 at the **start of the creator's turn** |
| "until the start of your next turn" (e.g. [Raise a Shield](https://2e.aonprd.com/Actions.aspx?ID=2316)) | start of that creature's next turn |
| "until the end of the target's next turn" / "through N of its turns" | **end of the target's turn** (detrimental effects usually use this) |
| sustained | until the end of the caster's next turn, unless they [Sustain](https://2e.aonprd.com/Actions.aspx?ID=2317) |
| 1 minute | 10 rounds |

- [Spell durations](https://2e.aonprd.com/Rules.aspx?ID=2242): if the caster dies or is incapacitated, the spell keeps "using the caster's initiative order."
- Sustaining more than once in the same turn doesn't extend the duration.
- Sustained effects with no stated limit end after 10 minutes.

## 7. Changing the order

### Delay

[Delay](https://2e.aonprd.com/Actions.aspx?ID=2294) is a free action with the trigger "Your turn begins":

- "you're removed from the initiative order."
- "You can return to the initiative order as a free action triggered by the end of any other creature's turn. This permanently changes your initiative to the new position."
  - Returning after the last creature's turn means acting last in the **current** round.
- "You can't use reactions until you return to the initiative order."
- **Delaying a whole round:** "If you Delay an entire round without returning to the initiative order, the actions from the Delayed turn are lost, your initiative doesn't change, and your next turn occurs at your original position."
- **No dodging consequences:** "any persistent damage or other negative effects that normally occur at the start or end of your turn occur immediately when you use the Delay action. Any beneficial effects that would end at any point during your turn also end."
- [Confused](https://2e.aonprd.com/Conditions.aspx?ID=63) creatures can't Delay. A [controller](https://2e.aonprd.com/Conditions.aspx?ID=64) can make a controlled creature Delay.

### Ready

[Ready](https://2e.aonprd.com/Actions.aspx?ID=2299) is a two-action activity with the concentrate trait:

- Pick one single action or free action, plus a trigger. Your turn then ends.
- If the trigger happens before your next turn starts, you use that action as a reaction.
- You "can't Ready a free action that already has a trigger."
- A readied attack uses the multiple attack penalty you had when you used Ready.
- **Ready doesn't change your initiative position** ([Tracking Initiative](https://2e.aonprd.com/Rules.aspx?ID=2428)).
- Confused creatures can't Ready.

### Knocked out

[Getting Knocked Out](https://2e.aonprd.com/Rules.aspx?ID=2324):

- Most creatures **die** at 0 HP; undead and constructs are destroyed. They leave the order.
- PCs, companions and important NPCs are **knocked out** instead. The GM decides which NPCs count: villains, creatures with ferocity or regeneration.
- When knocked out:
  - "Move your initiative position to directly before the turn in which you were reduced to 0 HP."
    - "The turn in which" is **whichever turn is happening** at that moment, not the turn of whoever caused the damage. You can drop on another creature's turn because of your own enemy's reaction, a hazard, persistent damage, or nobody's fault at all; the rule is the same.
    - If you drop on your own turn (e.g. persistent damage at its end), "directly before your own turn" is where you already are, so your position doesn't change.
    - If you drop before anyone has taken a turn (damage from whatever started the encounter), the rules don't say; it's a GM call (e.g. keep the rolled position).
  - You gain dying 1, or dying 2 if it was an enemy's critical success or your critical failure, plus your wounded value. You fall unconscious.
  - Nonlethal damage leaves you unconscious but not dying.
- The knocked-out creature keeps a turn every round, because recovery checks happen at the start of its turn.

### Joining mid-encounter

- **Complex hazards** ([Routine](https://2e.aonprd.com/Rules.aspx?ID=2850)):
  - The hazard "rolls initiative using its Stealth modifier" and joins the order.
  - PCs already in encounter mode keep their initiative.
  - Each round, the hazard follows its routine on its own initiative. Routine (N) gives the number of actions.
  - **Simple hazards never take turns.** They react once to a trigger.
- **Creatures brought in by hazards:**
  - [Summoning Rune](https://2e.aonprd.com/Hazards.aspx?ID=495) (GM Core, a complex hazard): "The creature rolls initiative and remains for 2d6 rounds". It "can use 3 actions each round and can use reactions, unlike most summoned creatures."
  - [The Bastard's Portrait](https://2e.aonprd.com/Hazards.aspx?ID=762): "The wraiths roll initiative and remain for 1 minute".
- **Reinforcements and late arrivals:** the rules have no procedure for them.
  - GM Core only handles them narratively: [Evolving Battlefields](https://2e.aonprd.com/Rules.aspx?ID=2730) ("reinforcements arrive for whichever side was outmatched"), [Combining and Separating Encounters](https://2e.aonprd.com/Rules.aspx?ID=2731).
  - Common table practice: the arrivals roll initiative when they show up and slot into the existing order.
  - Some groups instead have them act on a fixed count, or right after a chosen creature.
- **Sleepers who wake** keep the initiative they rolled when the fight began (§2).

### Leaving

- **Death or destruction:** the creature leaves the order.
- **Fleeing:** [Fleeing Enemies](https://2e.aonprd.com/Rules.aspx?ID=2571).
  - If a whole side flees, stop using initiative and resolve the chase abstractly.
  - If combat resumes, "go back into combat with the original initiative order."
- **Surrender** ends the creature's part in the encounter.
- **Delay** removes a creature from the order only temporarily.
- **Ready** doesn't remove it.

### Original numbers

- [Tracking Initiative](https://2e.aonprd.com/Rules.aspx?ID=2428): "Once the encounter's order is set, it's usually not necessary to track the original initiative numbers."
- After Delay and knock-outs, the **position** matters, not the number.

## 8. Conditions that change actions

All of these apply when a creature regains actions at the start of its turn.

- **[Stunned](https://2e.aonprd.com/Conditions.aspx?ID=93)**: "You can't act."
  - **Value form:** "Each time you regain actions, reduce the number you regain by your stunned value, then reduce your stunned value by the number of actions you lost." So stunned 4 costs 3 actions this turn and 1 next turn.
  - **Duration form** ("stunned for 1 minute"): you lose all actions for the duration.
  - "Stunned overrides slowed. If the duration of your stunned condition ends while you are slowed, you count the actions lost to the stunned condition toward those lost to being slowed." For example, stunned 1 with slowed 2 leaves 1 action.
- **[Slowed](https://2e.aonprd.com/Conditions.aspx?ID=92)**: regain that many fewer actions. Becoming slowed mid-turn doesn't take actions away right away.
- **[Quickened](https://2e.aonprd.com/Conditions.aspx?ID=89)**:
  - "You gain 1 additional action at the start of your turn each round."
  - The extra action is usually restricted to certain actions.
  - **Several sources don't stack:** "If you become quickened from multiple sources, you can use the extra action you've been granted for any single action allowed by any of the effects." It is still one extra action.
  - Becoming quickened mid-turn gives nothing until your next turn.
- **[Haste](https://2e.aonprd.com/Spells.aspx?ID=1553)** (spell 3, 1 minute):
  - Makes the target quickened, with the extra action "for only Strike and Stride actions".
  - That action can't be spent on an activity that contains a Stride or Strike ([Actions](https://2e.aonprd.com/Rules.aspx?ID=2335)).
  - At rank 7 it targets up to 6 creatures.
  - A second haste, or another quickened source, adds no further action. It only widens the list of allowed uses.
- **Minions** have 2 actions. Slowed and quickened change that number when the minion gains its actions ([Minion](https://2e.aonprd.com/Traits.aspx?ID=653)).
- **[Paralyzed](https://2e.aonprd.com/Conditions.aspx?ID=85)**: can't act except Recall Knowledge and purely mental actions.
- **[Petrified](https://2e.aonprd.com/Conditions.aspx?ID=87)**: can't act.
- **[Unconscious](https://2e.aonprd.com/Conditions.aspx?ID=95)**: can't act.
- **[Confused](https://2e.aonprd.com/Conditions.aspx?ID=63)**: "can't Delay, Ready, or use reactions". Every action is a Strike or an offensive cantrip at a random target. A DC 11 flat check ends it each time an attack or spell damages you.
- **[Fascinated](https://2e.aonprd.com/Conditions.aspx?ID=72)**: –2 to Perception and skills, and concentrate actions only toward the subject.
- **[Frightened](https://2e.aonprd.com/Conditions.aspx?ID=76)**: a status penalty to all checks and DCs. It goes down by 1 at the end of your turn.
- **[Persistent damage](https://2e.aonprd.com/Conditions.aspx?ID=86)**:
  - Taken at the end of your turn, then a DC 15 flat check to end it.
  - A new instance of the same damage type replaces the old one if it is higher.

## 9. Dying, wounded, doomed, hero points

| Item | Rule |
|---|---|
| Knocked out | Move to just before the turn in which you hit 0 HP. Dying 1, or dying 2 on an enemy's crit or your crit fail, plus your wounded value ([rules-2324](https://2e.aonprd.com/Rules.aspx?ID=2324)) |
| [Dying](https://2e.aonprd.com/Conditions.aspx?ID=69) | Unconscious. Die at dying 4 minus doomed. Damage while dying: +1, or +2 on a crit |
| [Recovery check](https://2e.aonprd.com/Rules.aspx?ID=2326) | At the start of your turn, a flat check against DC 10 + your dying value. Crit success –2, success –1, failure +1, crit failure +2 |
| [Losing dying](https://2e.aonprd.com/Rules.aspx?ID=2328) | You gain wounded 1, or your wounded value goes up by 1. At 0 HP you stay unconscious; at 1+ HP you wake up |
| [Wounded](https://2e.aonprd.com/Conditions.aspx?ID=99) | Added to dying whenever you gain dying. Ends after a successful Treat Wounds, or full HP and 10 minutes of rest |
| [Doomed](https://2e.aonprd.com/Conditions.aspx?ID=67) | Lowers the death threshold. Goes down by 1 after each full night's rest |
| Healed while dying | You lose dying and unconscious and "can act normally on your next turn" |
| [Hero Points](https://2e.aonprd.com/Rules.aspx?ID=2333) | Spend all of them (minimum 1) when your dying value would rise: you lose dying and stabilize at 0 HP with no new wounded. Usable even when you can't act |
| Monster [Ferocity](https://2e.aonprd.com/MonsterAbilities.aspx?ID=63) | Reaction on reaching 0 HP: stay at 1 HP and wounded +1. Unusable at wounded 3 |

## 10. Common reactions and free actions

| Name | Cost | Trigger and effect |
|---|---|---|
| [Reactive Strike](https://2e.aonprd.com/Actions.aspx?ID=2256) (legacy name: Attack of Opportunity) | reaction | A creature in reach uses a manipulate or move action, makes a ranged attack, or leaves a square during a move action. You make a melee Strike that ignores and doesn't add to your MAP. A crit disrupts a manipulate action |
| [Shield Block](https://2e.aonprd.com/Feats.aspx?ID=5212) | reaction | Your shield is raised and you'd take physical damage from an attack. Reduce the damage by the shield's Hardness |
| [Reactive Shield](https://2e.aonprd.com/Feats.aspx?ID=4772) | reaction | A melee Strike hits you. Raise a Shield in time to affect it |
| [Nimble Dodge](https://2e.aonprd.com/Feats.aspx?ID=4916) | reaction | An attacker you can see targets you. +2 circumstance to AC |
| [Opportune Riposte](https://2e.aonprd.com/Actions.aspx?ID=2819) | reaction | An enemy in reach crit-fails a Strike against you. You Strike or Disarm |
| [Stand Still](https://2e.aonprd.com/Feats.aspx?ID=5996) | reaction | A creature in reach uses a move action. You Strike; a crit disrupts |
| Champion reactions: [Retributive Strike](https://2e.aonprd.com/Actions.aspx?ID=2807), [Glimpse of Redemption](https://2e.aonprd.com/Actions.aspx?ID=2810), [Liberating Step](https://2e.aonprd.com/Actions.aspx?ID=2808) | reaction | An enemy harms an ally in your aura. The ally gains resistance, plus the cause's effect |
| [Aid](https://2e.aonprd.com/Actions.aspx?ID=2292) | reaction | You prepared on your turn, and the ally is about to roll. DC 15: +1 (crit +2/+3/+4 by proficiency), crit failure –1 |
| [Grab an Edge](https://2e.aonprd.com/Actions.aspx?ID=2313) | reaction | You fall from or past an edge |
| [Arrest a Fall](https://2e.aonprd.com/Actions.aspx?ID=2308) | reaction | You fall and have a fly Speed |
| [Ferocity](https://2e.aonprd.com/MonsterAbilities.aspx?ID=63) | reaction | You are reduced to 0 HP (monster ability) |
| Readied action ([Ready](https://2e.aonprd.com/Actions.aspx?ID=2299)) | reaction | The trigger you chose |
| [Delay](https://2e.aonprd.com/Actions.aspx?ID=2294) | free | Your turn begins |
| [Release](https://2e.aonprd.com/Actions.aspx?ID=2300) | free (manipulate) | No trigger. It does not trigger Reactive Strike |
| Rage, stance or Hunt Prey "on initiative" feats (§3) | free | You roll initiative |

One-action basics that matter for timing:

- [Raise a Shield](https://2e.aonprd.com/Actions.aspx?ID=2316): lasts until the start of your next turn.
- [Sustain](https://2e.aonprd.com/Actions.aspx?ID=2317), [Dismiss](https://2e.aonprd.com/Actions.aspx?ID=2311).
- [Seek](https://2e.aonprd.com/Actions.aspx?ID=2301), [Drop Prone](https://2e.aonprd.com/Actions.aspx?ID=2295).

## 11. Special participants

**None of these get their own initiative slot**, except complex hazards and the creature types the GM decides to roll separately.

- **Minions** ([trait](https://2e.aonprd.com/Traits.aspx?ID=653)):
  - "Your minion acts on your turn in combat, once per turn, when you spend an action to issue it commands."
  - The command is Command an Animal for companions, Sustain for spell minions, or otherwise a single action.
  - A minion has 2 actions and 0 reactions per turn.
  - Uncommanded, it only defends itself or escapes harm.
  - A creature can control at most four minions.
- **Summoned creatures** ([trait](https://2e.aonprd.com/Traits.aspx?ID=706)):
  - They are minions that act on the summoner's turn.
  - "Immediately when you finish Casting the Spell, the summoned creature uses its 2 actions for that turn."
  - On later turns they act when Sustained.
  - They vanish at 0 HP or when the spell ends.
- **Animal companions** ([rules](https://2e.aonprd.com/Rules.aspx?ID=2113)):
  - They are minions that get 2 actions on your turn when you [Command an Animal](https://2e.aonprd.com/Actions.aspx?ID=2400).
  - **Mature** companions ([Druid](https://2e.aonprd.com/Feats.aspx?ID=4725) / Ranger): without a command, a mature companion "can still use 1 action that round on your turn to Strike or Stride". After that you can't command it that round.
  - Companions are knocked out rather than killed at 0 HP, so they get dying rules too.
- **Familiars** ([rules](https://2e.aonprd.com/Rules.aspx?ID=2121)): minions, commanded the same way. No attacks.
- **Mounts** ([Mounted Combat](https://2e.aonprd.com/Rules.aspx?ID=2434)):
  - "Your mount acts on your initiative." It needs Command an Animal.
  - A PC riding another PC ([Riding PCs](https://2e.aonprd.com/Rules.aspx?ID=3272)): both roll and use the lower result. They act on the same count, and each gets 2 actions.
- **Eidolons** ([Summoner](https://2e.aonprd.com/Classes.aspx?ID=77)):
  - Not minions. The summoner and eidolon **share one turn and one set of actions** (and MAP and reactions).
  - [Act Together](https://2e.aonprd.com/Actions.aspx?ID=4268) lets both act in the same action.
- **Spell "weapons"** such as [Spiritual Armament](https://2e.aonprd.com/Spells.aspx?ID=1687) (legacy: Spiritual Weapon):
  - Not creatures. They attack when the caster Sustains.
  - Their attacks use and add to the caster's MAP. No slot.
- **Undead from [Summon Undead](https://2e.aonprd.com/Spells.aspx?ID=1706)** (the remaster stand-in for Animate Dead) and [Phantasmal Minion](https://2e.aonprd.com/Spells.aspx?ID=1631): summoned minions, as above.
- **Complex hazards**: their own slot, rolled with Stealth (§7).
- **Simple hazards**: no slot.
- **Swarms and troops** ([troop](https://2e.aonprd.com/Traits.aspx?ID=849), [Running Troops](https://2e.aonprd.com/Rules.aspx?ID=3365)): one creature, one slot. A troop loses segments at 2/3 and 1/3 of its HP.
- **Social encounters** ([Initiative and Actions](https://2e.aonprd.com/Rules.aspx?ID=2567)): an opposing group can hold "one or more positions in the initiative order".
- **Multiple turns per round:** the core rules have no rule for this, beyond the duel variant (§2). There are no lair actions or "initiative count 20" events. A tracker that offers "extra slots" for a boss is supporting a house rule.
- **Reinforcements**: see §7. There is no rules procedure; the GM decides when they arrive, and they usually roll initiative on arrival.

## 12. Exploration time vs encounter time

- **Exploration** ([Exploration Mode](https://2e.aonprd.com/Rules.aspx?ID=2440), [Running Exploration](https://2e.aonprd.com/Rules.aspx?ID=2573)):
  - Free-form time, tracked roughly in 10-minute steps.
  - Reactions can still be used when their trigger happens.
- **Encounter**: 6-second rounds; a minute is 10 rounds. Social encounters may use minute-long rounds ([Running Encounters](https://2e.aonprd.com/Rules.aspx?ID=2538)).
- **Spell durations across modes** ([Flow of Time](https://2e.aonprd.com/Rules.aspx?ID=2593)):
  - A 1-minute spell spans encounters only if they follow each other directly in encounter mode.
  - 10-minute spells last one encounter; 1-hour spells last several.
  - Pre-buffing: if the PCs get the drop, each may cast one spell or prepare, then roll initiative. Otherwise roll first.
- **Exploration activities that carry into initiative**:

  | Activity | Carry-over |
  |---|---|
  | [Avoid Notice](https://2e.aonprd.com/Actions.aspx?ID=2622) | Stealth initiative |
  | [Scout](https://2e.aonprd.com/Actions.aspx?ID=2629) | +1 party initiative |
  | [Defend](https://2e.aonprd.com/Actions.aspx?ID=2623) | shield raised before your first turn |
  | [Detect Magic](https://2e.aonprd.com/Actions.aspx?ID=2624) | feat links |
  | [Repeat a Spell](https://2e.aonprd.com/Actions.aspx?ID=2628) | a cantrip in effect when combat starts |
  | [Search](https://2e.aonprd.com/Actions.aspx?ID=2630) | none on initiative |
