---
name: pf2e-encounter-building
description: Reference for Pathfinder 2e (remaster) encounter building and how Roundtable Tracker implements it. Covers XP budget and threat levels (trivial to extreme), party level and party-size character adjustment, creature XP by level difference, simple vs complex hazard XP, encounter templates and creature roles (boss, lieutenant, lackey), elite/weak adjustments (level 0 skipped, HP tables), partial and custom adjustments, incapacitation, number of creatures and solo bosses, power growth per level (1/1.5/2/3/4 and √2), power spike levels, synergy and terrain, accomplishment XP, reinforcements, recurring creatures, allies, and Pathfinder Society Challenge Points scaling. Load before designing, implementing, reviewing or testing the encounter builder, XP or threat math, templates, adjustments or the threat tracker, before writing tickets about them, and when answering PF2e encounter-design questions.
---

# PF2e encounter building

## Files

- [references/pf2e-encounter-building-rules.md](references/pf2e-encounter-building-rules.md): the rules, with Archive of Nethys links. §10 labels the community and house concepts.
- [references/tracker-encounter-builder-implementation.md](references/tracker-encounter-builder-implementation.md): how this app computes XP, threat, adjustments, templates and reinforcements, plus its known quirks.

For the full text of any linked rule, or to look up a creature's level, use the `pf2e-archive-of-nethys-search` skill.

## Core model in one screen

- **Budget for 4 PCs:**

  | Threat | XP |
  |---|---|
  | Trivial | ≤ 40 |
  | Low | 60 |
  | Moderate | 80 |
  | Severe | 120 |
  | Extreme | 160 |

  - **Character adjustment** per PC above or below 4: 10 / 20 / 20 / 30 / 40 (GM Core; Low was 15 in the legacy book).
  - Spend extra budget on more enemies, not a tougher one. Aim for about as many enemies as PCs.
  - "Moderate 3" means a moderate threat for a level-3 party.
- **Creature XP by level vs party level:**

  | Level | –4 | –3 | –2 | –1 | 0 | +1 | +2 | +3 | +4 |
  |---|---|---|---|---|---|---|---|---|---|
  | XP | 10 | 15 | 20 | 30 | 40 | 60 | 80 | 120 | 160 |

  - Outside ±4 the rules give no value: below –4 is worthless, above +4 is beyond extreme.
- **Hazards:** a complex hazard costs the same as a creature of its level. A simple hazard costs ⅕ (2…32). The same hazard gives XP only once.
- **Power per level:**
  - Officially, "two monsters of a certain level are roughly as challenging as a single monster 2 levels higher."
  - Simple scale: 1 → 1.5 → 2 → 3 → 4 for PL to PL+4.
  - More accurate: ×√2 per level. This is community math, smooth for fractional levels and for going past ±4.
- **Elite and weak:**
  - Elite: +1 level, or **+2 from level –1 or 0**. Weak: –1 level, or **–2 from level 1**. Level 0 is skipped ("greater effect on the power level of low-level creatures").
  - Stats ±2, damage ±2 (±4 for limited-use abilities), HP by a table.
  - Apply once only. For bigger changes, rebuild the creature.
  - **Partial adjustments** (half an elite) are a house concept: count them as a fraction of a level.
- **Templates (GM Core Quick Adventure Groups, 4 PCs; the solo boss is the PL+4 row of the creature XP table):**

  | Template | Composition | XP |
  |---|---|---|
  | Boss and Lackeys | PL+2, 4 × PL–4 | 120 |
  | Boss and Lieutenant | PL+2, PL | 120 |
  | Elite Enemies | 3 × PL | 120 |
  | Lieutenant and Lackeys | PL, 4 × PL–4 | 80 |
  | Mated Pair | 2 × PL | 80 |
  | Troop | PL, 2 × PL–2 | 80 |
  | Mook Squad | 6 × PL–4 | 60 |
  | Solo boss | PL+4 | 160 |

  Roles by level: lackey PL–4 to –2, standard PL–2 to 0, boss PL to +4.
- **Same XP, different fight:**
  - **Action advantage** (community term): more bodies means more actions. One PL+4 boss crits often and is rarely crit, but has 3 actions against the party's 12.
  - **Incapacitation:** spells lose a degree against creatures above twice the spell's rank, and other effects against higher-level creatures. Lone high-level bosses shrug off the party's fight-enders, while their own incapacitation effects land.
  - **Power spikes:** PCs jump at levels 4, 7, 12, 15 and 19 (striking dice, weapon specialization, spell ranks), and at runes 2/5/8/10/11/16/18/20.
- **Synergy and terrain:**
  - Officially, there is no XP modifier for synergy: "compare in advance and adjust".
  - For terrain, "pick an equivalent monster level… or assign extra XP".
  - **The tracker's house rule** charges synergy, terrain or story pressure as **accomplishment-sized XP added to the budget** (minor 10 / moderate 30 / major 80). Officially, accomplishment XP is only a reward.
- **Recurring creatures and merged encounters:**
  - Fights that combine can become unwinnable; warn the PCs and let them retreat.
  - The rules say nothing on XP for a creature that flees and returns. Count it once, possibly weakened.
  - A recurring villain comes back stronger and counter-built.
- **Level changes the feel:** levels 1–2 are swingy (a single crit can drop a PC, and level 0 PCs count as level –1). High levels and many lackeys make fights long rather than dangerous.
- **Pathfinder Society** scales older scenarios by Challenge Points instead: 2/3/4/6 CP per PC by level within the adventure's range (1 CP ≈ 5 XP). The CP total picks the subtier and a scaling band, which is finer than a threat level. Newer scenarios use easier and harder sidebars instead (rules file §16).
- **Allies:** the core books have no rule. The Battlecry! approach, which the tracker uses, subtracts allied XP from the enemy side. The alternative is to count an ally as an extra PC.

## When working on the tracker

- Check the implementation file's "Known quirks" list before assuming a behaviour is intended. Several XP paths disagree with each other, such as the threat tracker bands vs the saved difficulty.
- Accomplishment XP in the budget, ally subtraction, partial adjustments and extrapolation past +4 are **deliberate house rules**, not bugs. Keep them, and say so in tickets and code comments.
- When changing XP math, update the specs listed in the implementation file. Keep the two XP formula copies and the two adjusted-level functions in agreement.
