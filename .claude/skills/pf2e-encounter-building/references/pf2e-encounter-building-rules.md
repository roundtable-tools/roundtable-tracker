# PF2e encounter building: rules reference (remaster)

Remaster rules (GM Core, Monster Core, NPC Core, Player Core), with Archive of Nethys (AoN) links. Quotes
are verbatim AoN text. Section 10 covers concepts that are **not** official rules and labels each one.
Where the rules are silent, this file says so.

## Contents

1. Budget, party level and party size
2. Creature XP by level
3. Hazard XP: simple vs complex
4. Threat levels: what they mean
5. XP awards, accomplishments, leveling
6. Encounter templates and creature roles
7. Creature adjustments: elite, weak, other templates, building creatures
8. Incapacitation
9. Number of creatures, solo bosses, critical hits
10. Power growth, power spikes and other community concepts
11. Synergy, terrain and hazards with creatures
12. Recurring creatures, combining and separating encounters
13. Allies, troops, swarms, companions
14. Design guidance and pitfalls
15. How party level changes the feel of a budget
16. Pathfinder Society scaling: Challenge Points

---

## 1. Budget, party level and party size

[XP Budget](https://2e.aonprd.com/Rules.aspx?ID=2717) (GM Core pg. 75): "You have an XP budget based on the threat, and each creature costs some of that budget. Start with the monsters or NPCs that are most important to the encounter… Many encounters won't match the XP budget exactly, but they should come close. The XP budget is based on a group of four characters."

**Table 10-1: Encounter Budget**

| Threat | XP budget (4 PCs) | Character adjustment (per PC above or below 4) |
|---|---|---|
| Trivial | 40 or less | 10 or less |
| Low | 60 | 20 |
| Moderate | 80 | 20 |
| Severe | 120 | 30 |
| Extreme | 160 | 40 |

- The legacy Core Rulebook had Low = 15. **GM Core uses 20.**
- [Different Party Sizes](https://2e.aonprd.com/Rules.aspx?ID=2719):
  - "For each additional character in the party beyond the fourth, increase your XP budget by the amount shown in the Character Adjustment value… for each missing character, remove that amount."
  - XP **awards** don't change: "you'll always award the amount of XP listed for a group of four characters."
  - "It's best to use the XP increase from more characters to add more enemies or hazards… rather than making one enemy tougher or weaker. Encounters are typically more satisfying if the number of enemy creatures is fairly close to the number of player characters."
- **Encounter level** (common usage): a threat is named by threat and party level, e.g. "moderate 3" means a moderate-threat encounter for a level 3 party.
- **Published adventures for another level** (legacy Gamemastery Guide [sidebar](https://2e.aonprd.com/Rules.aspx?ID=856), not repeated in GM Core):
  - Shift the threat one step per level of difference: "the moderate 3 encounter would be severe 2, extreme 1, low 4, or trivial 5."
  - Adapt "usually by adjusting the number of monsters or using the elite and weak adjustments."
- **Party level** ([Group Parity and Party Level](https://2e.aonprd.com/Rules.aspx?ID=2653)):
  - Keep all PCs at the same XP. Otherwise "Use the highest level if only one or two characters are behind, or an average if everyone is at a different level."
  - If one PC is 2+ levels ahead, use the lower level and "adjust the encounters as if there were one additional PC for every 2 levels the higher-level character has beyond the rest of the party."
  - PCs below the party level gain double XP until they catch up.

## 2. Creature XP by level

**Table 10-2: Creature XP and Role** ([Choosing Creatures](https://2e.aonprd.com/Rules.aspx?ID=2718))

| Creature level | XP | Suggested role |
|---|---|---|
| Party level – 4 | 10 | Low-threat lackey |
| Party level – 3 | 15 | Low- or moderate-threat lackey |
| Party level – 2 | 20 | Any lackey or standard creature |
| Party level – 1 | 30 | Any standard creature |
| Party level | 40 | Any standard creature or low-threat boss |
| Party level + 1 | 60 | Low- or moderate-threat boss |
| Party level + 2 | 80 | Moderate- or severe-threat boss |
| Party level + 3 | 120 | Severe- or extreme-threat boss |
| Party level + 4 | 160 | Extreme-threat solo boss |

- "In all but the most unusual circumstances, you'll select creatures for your encounter that range from 4 levels lower than the PCs' level to 4 levels higher."
- **Outside ±4 the default rules give no XP values.** Below –4 a creature is effectively worth nothing. For hazards this is explicit: "Hazards of a lower level than the party's level – 4 are trivial and award no XP" ([Hazard Experience](https://2e.aonprd.com/Rules.aspx?ID=2857)).
- Creature statistics go up to level 24, "the highest-level extreme encounter a party might face" ([Level](https://2e.aonprd.com/Rules.aspx?ID=2879)).
- Battlecry! ([One Tough Enemy](https://2e.aonprd.com/Rules.aspx?ID=3468)): "It's still extremely challenging to go above party level + 4 for an adversary."
- **Proficiency without Level** variant: this variant only. Its own XP table runs from PL–7 to PL+7: 9, 12, 14, 18, 21, 26, 32, **40**, 48, 60, 72, 90, 108, 135, 160 ([Adjusting Encounters](https://2e.aonprd.com/Rules.aspx?ID=2763)).

## 3. Hazard XP: simple vs complex

[Hazard Experience](https://2e.aonprd.com/Rules.aspx?ID=2857) (GM Core pg. 99):

- "The XP for a complex hazard is equal to the XP for a monster of the same level, and the XP for a simple hazard is one-fifth of that."
- "If they trigger the same hazard later on, they don't gain XP for the hazard again."
- The PCs earn the XP "whether they disable it, avoid it, or simply endure its attacks".

| Level | Simple | Complex |
|---|---|---|
| PL – 4 | 2 | 10 |
| PL – 3 | 3 | 15 |
| PL – 2 | 4 | 20 |
| PL – 1 | 6 | 30 |
| PL | 8 | 40 |
| PL + 1 | 12 | 60 |
| PL + 2 | 16 | 80 |
| PL + 3 | 24 | 120 |
| PL + 4 | 32 | 160 |

- GM Core is inconsistent at PL+4: pg. 57 gives 32/160, pg. 99 gives 30/150. The legacy book has the same inconsistency. 32/160 matches the "one-fifth" and "same as a monster" rules.
- [Complex Hazards](https://2e.aonprd.com/Rules.aspx?ID=2863) "roll initiative and have actions of their own… can be used in encounters to take the place of a creature of the same level, and are worth commensurate XP."
- [Simple Hazards](https://2e.aonprd.com/Rules.aspx?ID=2862) use "its reaction only once, after which its threat is over unless the hazard is reset." Usually the party deals with them in exploration ([Hazards](https://2e.aonprd.com/Rules.aspx?ID=2576)).
- [Hazards in Combat](https://2e.aonprd.com/Rules.aspx?ID=2729): "when combined with other threats, even simple hazards can prove perilous". Complex hazards shine "if foes benefit from the hazard", and when they "give the PCs ways to contribute meaningfully other than dealing damage".

## 4. Threat levels: what they mean

From [Combat Threats](https://2e.aonprd.com/Rules.aspx?ID=2716):

- **Trivial:** "so easy that the characters have essentially no chance of losing". Works as a warm-up or palate cleanser. Normally no XP.
- **Low:** "a veneer of difficulty… typically use some of the party's resources". The party is seriously endangered only by very poor tactics.
- **Moderate:** "a serious challenge… though unlikely to overpower them completely". The party should come out "ready to continue on and face a harder challenge without resting."
- **Severe:** "the hardest encounters most groups of characters have a good chance to defeat… there's a good chance a character could die, and a small chance the whole group could". Fits important moments such as a final boss.
- **Extreme:** "likely to be an even match for the characters… Use an extreme encounter only if you're willing to take the chance the entire party will die." Use it for a fully rested party, a campaign's climax, or veteran players.

Adventure "recipes" ([Dungeon Crawl](https://2e.aonprd.com/Rules.aspx?ID=2694) through [Romantic](https://2e.aonprd.com/Rules.aspx?ID=2702)) give mixes per level of play. For example:

| Style | Mix |
|---|---|
| Dungeon crawl | 2 trivial, 4 low, 6 moderate, 6 severe |
| High adventure | 16 moderate, 8 severe ("avoid low- and trivial-threat battles") |
| Horror | 2 moderate, 1 severe, maybe 1 extreme |
| Intrigue | 2 trivial, 2 low, 4 moderate, 1 severe |
| Military | 4 low, 4 moderate, 1 severe, "2–4 foes" per fight |

## 5. XP awards, accomplishments, leveling

- **Levelling** ([Experience Points](https://2e.aonprd.com/Rules.aspx?ID=2648)): at 1,000 XP a PC levels up and subtracts 1,000. Variant speeds are fast 800 and slow 1,200 ([rules-2654](https://2e.aonprd.com/Rules.aspx?ID=2654)).
- **Story-based leveling:** ignore XP and level up "every three to four game sessions".
- **Awards** ([XP Awards](https://2e.aonprd.com/Rules.aspx?ID=2649), [Adversaries and Hazards](https://2e.aonprd.com/Rules.aspx?ID=2650)):
  - The whole party gets the sum of creature and hazard XP for a group of 4, without the party-size adjustment.
  - "Trivial encounters don't normally grant any XP". The GM may give minor or moderate accomplishment XP for one that mattered to the story.
- **Accomplishment XP** ([Accomplishments](https://2e.aonprd.com/Rules.aspx?ID=2651)):

  | Accomplishment | XP |
  |---|---|
  | Minor | 10 |
  | Moderate | 30 (usually also a Hero Point) |
  | Major | 80 (usually also a Hero Point) |

  - A minor one is a "significant, memorable, or surprising moment". A moderate one is "a goal that takes most of a session". A major one is "the culmination of the characters' efforts across many sessions".
  - Per session, give "several minor awards, one or two moderate awards, and only one major award, if any".
  - Officially, accomplishment XP is a **reward**, not part of the encounter budget. The tracker's use of it in the budget is a house rule; see §10.
- **Bypassed encounters** ([sidebar](https://2e.aonprd.com/Rules.aspx?ID=2568)):
  - If the PCs avoid a fight by smart play, "award them the normal XP for the encounter."
  - For a lucky break, give minor or moderate accomplishment XP instead.
- **Other XP sources:**
  - An influence encounter is "typically worth the same amount of XP as a moderate combat encounter of its level" ([rules-3044](https://2e.aonprd.com/Rules.aspx?ID=3044)).
  - Social NPCs give XP by their non-combat level ([rules-2566](https://2e.aonprd.com/Rules.aspx?ID=2566)).

## 6. Encounter templates and creature roles

**Quick Adventure Groups** ([XP Budget](https://2e.aonprd.com/Rules.aspx?ID=2717)) are the official templates, for 4 PCs:

| Template | XP | Composition |
|---|---|---|
| Boss and Lackeys | 120 (severe) | 1 × PL+2, 4 × PL–4 |
| Boss and Lieutenant | 120 (severe) | 1 × PL+2, 1 × PL |
| Elite Enemies | 120 (severe) | 3 × PL |
| Lieutenant and Lackeys | 80 (moderate) | 1 × PL, 4 × PL–4 |
| Mated Pair | 80 (moderate) | 2 × PL |
| Troop | 80 (moderate) | 1 × PL, 2 × PL–2 ("troop" here is a group shape, not the troop trait) |
| Mook Squad | 60 (low) | 6 × PL–4 |

A **solo boss** is the PL+4 row of Table 10-2: 160 XP, extreme.

**Official role words** (Table 10-2):
- *lackey*: PL–4 to PL–2
- *standard creature*: PL–2 to PL
- *boss*, by threat: low PL to PL+1, moderate PL+1 to PL+2, severe PL+2 to PL+3, extreme PL+3 to PL+4
- *solo boss*: PL+4
- *Lieutenant* appears in the template names. In practice it is a creature around PL, below the boss.

**Scaling templates to other party sizes:** keep the total within the adjusted budget. The official advice is to add or remove enemies rather than make one enemy tougher (§1). The tracker ships hand-made variants for 3, 5 and 6 PCs.

**Stat-design roles** ([Base Road Maps](https://2e.aonprd.com/Rules.aspx?ID=2874)):

| Road map | Profile |
|---|---|
| Brute | high HP, high damage, low AC and mental saves |
| Magical Striker | |
| Skill Paragon | |
| Skirmisher | high Dex and Speed |
| Sniper | ranged, high Perception, lower HP |
| Soldier | high AC and Fortitude, Reactive Strike |
| Spellcaster | low HP and attack, high spell DC |

## 7. Creature adjustments

[Combat Power](https://2e.aonprd.com/Rules.aspx?ID=3263) (Monster Core):

- Elite and weak adjustments "work best with creatures that focus on physical combat". Spellcasters "typically need specific adjustments".
- "These adjustments have a greater effect on the power level of low-level creatures."
- "**Applying the adjustments more than once to a creature should be avoided.** If you need to alter a creature's level more drastically, use the GM Core guidance on building creatures."

**[Elite](https://2e.aonprd.com/Rules.aspx?ID=3264)** ([template](https://2e.aonprd.com/MonsterTemplates.aspx?ID=22)):
- "Increase the creature's level by 1; if the creature is level –1 or 0, instead increase its level by 2."
- +2 to AC, attack modifiers, DCs, saves, Perception and skills.
- +2 damage, or +4 for limited-use abilities.
- HP by **starting** level:

  | Starting level | HP |
  |---|---|
  | 1 or lower | +10 |
  | 2–4 | +15 |
  | 5–19 | +20 |
  | 20+ | +30 |

**[Weak](https://2e.aonprd.com/Rules.aspx?ID=3265)** ([template](https://2e.aonprd.com/MonsterTemplates.aspx?ID=23)):
- "Decrease the creature's level by 1; if the creature is level 1, instead decrease its level by 2."
- –2 to the same statistics, –2 damage (–4 for limited-use abilities).
- HP by starting level:

  | Starting level | HP |
  |---|---|
  | 1–2 | –10 |
  | 3–5 | –15 |
  | 6–20 | –20 |
  | 21+ | –30 |

**Level 0 is skipped:**
- elite: –1 → 1, 0 → 2
- weak: 1 → –1
- The rules don't cover weak on a level 0 or –1 creature.
- The rules give the reason only in general terms: "These adjustments have a greater effect on the power level of low-level creatures."

**Stepping a creature through levels without stacking adjustments** (NPC Core [Numerical Advancement](https://2e.aonprd.com/Rules.aspx?ID=3414)):
1. the starting stat block;
2. elite;
3. the creature rebuilt at 2 levels higher, with weak applied;
4. that rebuilt stat block.

The same pages say ([When to Advance NPCs](https://2e.aonprd.com/Rules.aspx?ID=3413)) that recurring NPC enemies advance at the PCs' rate.

**Other adjustment and theme templates:**
- [creature-adjustment](https://2e.aonprd.com/MonsterTemplates.aspx?ID=22) category: undead, elemental, Howl of the Wild, mythic, NPC Core ancestry and profession adjustments, cryptids. Browse with the AoN skill (`-c creature-adjustment`).
- [creature-theme-template](https://2e.aonprd.com/NPCThemeTemplates.aspx?ID=17) category, e.g. Hellbound Creatures.

**Building or rebuilding creatures** ([Building Creatures](https://2e.aonprd.com/Rules.aspx?ID=2874)):
- Use the benchmark tables: extreme, high, moderate, low, terrible.
- [Push and pull](https://2e.aonprd.com/Rules.aspx?ID=2877): an extreme statistic is paid for with low ones.
- [Extreme increases](https://2e.aonprd.com/Rules.aspx?ID=2878): about one extreme statistic around level 11, two from 15, and 3–4 from 20.
- [Level](https://2e.aonprd.com/Rules.aspx?ID=2879) guidance: flying with ranged attacks around 7th level, invisibility around 6th–8th.

## 8. Incapacitation

[Incapacitation](https://2e.aonprd.com/Traits.aspx?ID=631) (Player Core):

- "If a spell has the incapacitation trait, any creature of more than twice the spell's rank treats the result of their check to prevent being incapacitated by the spell as one degree of success better, or the result of any check the spellcaster made to incapacitate them as one degree of success worse."
- "If any other effect has the incapacitation trait, a creature of higher level than the item, creature, or hazard generating the effect gains the same benefits."
- **Consequence for building encounters** (derived; the rules don't spell it out):
  - A level L caster's best spell rank is ⌈L/2⌉.
  - So incapacitation spells lose a degree against creatures above level 2 × ⌈L/2⌉: PL+1 and up for an even L, PL+2 and up for an odd L.
  - Solo bosses (PL+2 to PL+4) mostly shrug off the party's fight-ending effects.
  - In the other direction, a boss's incapacitation abilities work fully on lower-level PCs, and a lackey's barely work.
  - Check incapacitation on both sides when picking a lone high-level creature.

## 9. Number of creatures, solo bosses, critical hits

- **Number of creatures:** "Encounters are typically more satisfying if the number of enemy creatures is fairly close to the number of player characters" ([rules-2719](https://2e.aonprd.com/Rules.aspx?ID=2719)).
- **Solo creatures and reactions:** "A creature that's more likely to fight solo… might have a reaction to give it a way to continue to be dangerous amid an onslaught of attacks by the party" ([Reactive Abilities](https://2e.aonprd.com/Rules.aspx?ID=2912)).
- [Action Economy](https://2e.aonprd.com/Rules.aspx?ID=2905) (GM Core): this is about designing creature abilities. Higher-level creatures need more efficient actions, such as Improved Grab or free actions.
- **Critical hits** ([rules-2286](https://2e.aonprd.com/Rules.aspx?ID=2286)): a crit is "the DC by 10 or more" and deals double damage. Each level of difference shifts attack bonus against AC by about 1–1.5, so:
  - a PL+3 or PL+4 creature crits PCs often and is rarely crit by them;
  - PL–3 or PL–4 lackeys rarely hit, and get crit often.

  This is why one PL+4 creature (160 XP) and four PL creatures (160 XP) play very differently, even at the same budget.

## 10. Power growth, power spikes and other community concepts

The XP table encodes the official rule of thumb:

> "Under the default math, two monsters of a certain level are roughly as challenging as a single monster 2 levels higher." ([Adjusting Encounters](https://2e.aonprd.com/Rules.aspx?ID=2763))

| Concept | Status | Content |
|---|---|---|
| **Simple power scale 1 → 1.5 → 2 → 3 → 4** | Derived from official data | Creature XP ÷ 40 for PL to PL+4 (40, 60, 80, 120, 160). Power doubles every 2 levels. Steps alternate ×1.5 and ×1.33 |
| **√2 ≈ 1.414 per level** | Community, more accurate | Doubling every 2 levels means √2 per level. Extends smoothly past ±4: PL+5 ≈ 226, PL+6 = 320, PL–5 ≈ 7, PL–6 = 5. Better than the stepped table for fractional (partial) level changes and for extrapolating. Not an official rule |
| **Power spike levels** | Community term, official data | Levels where PCs jump in power, so a creature of a given level feels weaker against a party that just reached one (below) |
| **Action advantage** | Community | The side with more actions per round (more creatures, or extra or efficient actions) gets more out of the same XP. Official anchors: "number of enemy creatures… fairly close to the number of player characters", and solo creatures getting reactions |
| **Synergy penalty via accomplishment XP** | House rule (the tracker) | Officially, synergy has no XP modifier. GM Core says to compare in advance and adjust ("Beware of Unexpected Difficulty"), and for terrain to "pick an equivalent monster level… or just assign extra XP". The tracker charges synergy against the budget as accomplishment-sized XP (minor 10 / moderate 30 / major 80) |
| **Partial adjustment** | House rule (the tracker) | Half-step adjustments (e.g. only offense or only defense of elite) count as a fraction of a level. Officially, adjustments apply whole and only once (§7) |
| **Creature roles boss / lieutenant / lackey** | Official words | §6 |

**Power spike levels** (official data):

| Level | Spike |
|---|---|
| 2 | +1 weapon potency (item level 2) |
| 4 | **striking** (2 weapon dice) |
| 5 | +1 armor potency; attribute boosts; 3rd-rank spells; many proficiency increases to expert |
| 7 | **weapon specialization** (+2/+3/+4 damage); 4th-rank spells; expert spellcasting |
| 8 | resilient |
| 10 | +2 weapon potency; attribute boosts |
| 11 | +2 armor potency |
| 12 | **greater striking** (3 dice) |
| 14 | greater resilient |
| 15 | **greater weapon specialization**; master spellcasting; attribute boosts |
| 16 | +3 weapon potency |
| 17 | attribute apex (ABP) |
| 18 | +3 armor potency |
| 19 | **major striking** (4 dice); legendary spellcasting; 10th-rank spells |
| 20 | major resilient; attribute boosts |

- Spell ranks rise at every odd level (rank = ⌈level/2⌉).
- Item levels are the earliest a party usually has the item, not a guarantee.
- [Automatic Bonus Progression](https://2e.aonprd.com/Rules.aspx?ID=2742) sets the same steps on fixed levels: attack 2/10/16, devastating dice 4/12/19, defense 5/11/18, saves 8/14/20, Perception 7/13/19.
- Creature damage dice step at levels 4, 12 and 19 ([Strike Damage](https://2e.aonprd.com/Rules.aspx?ID=2897)), mirroring striking runes.

## 11. Synergy, terrain and hazards with creatures

- [Opponent Synergy](https://2e.aonprd.com/Rules.aspx?ID=2734):
  - Long-standing teams can get "a reaction triggered by their allies' abilities". Poorly coordinated or mindless creatures "make the fight much easier."
  - Taken to an extreme, synergy is a hive mind or one huge creature built from creatures, hazards or both. **No XP modifier is given.**
- **Beware of Unexpected Difficulty** ([Pitfalls](https://2e.aonprd.com/Rules.aspx?ID=2731)):
  - "creatures that have abilities that fit well together, making them extremely powerful as a combo, or that are particularly well-suited against your PCs. Compare the creatures and what you know about your PCs in advance, especially if the encounter is already a severe threat by the numbers."
  - Also "Watch for Overpowered Terrain": e.g. a long-range attacker while the PCs are stuck at a distance.
- [Budgeting for Terrain](https://2e.aonprd.com/Rules.aspx?ID=2725):
  - "A fight that requires Climbing, Swimming, or pushing through difficult terrain can be much tougher—especially if the enemies have strong ranged attacks."
  - "You can pick an equivalent monster level for your terrain and factor that into your budget, or just assign extra XP at the end if the threat without terrain is on the low or moderate end."
- [Inhabitant or Intruder?](https://2e.aonprd.com/Rules.aspx?ID=2723): natives are adapted to their terrain (swim, climb and burrow speeds, size). Terrain that hampers PCs may not hamper them.
- [Maps and Terrain](https://2e.aonprd.com/Rules.aspx?ID=2722): small rooms favour melee; large rooms need cover; choke points matter.
- **Hazards with creatures:** see §3. A complex hazard takes a same-level creature's place in the budget. A simple hazard costs ⅕ of that, but can be deadly when combined with creatures.
- [Time Pressure](https://2e.aonprd.com/Rules.aspx?ID=2732) and [Secondary Objectives](https://2e.aonprd.com/Rules.aspx?ID=2733) make low fights engaging "without inflating their power level".

## 12. Recurring creatures, combining and separating encounters

- [Combining and Separating Encounters](https://2e.aonprd.com/Rules.aspx?ID=2731):
  - "Taken to an extreme, combining encounters can quickly lead to fights that are unwinnable."
  - Trivial patrols can merge into escalating threats. "give the PCs fair warning and a chance to retreat."
  - The most common reason to separate is "an injured foe retreats to gather reinforcements".
- [Recurring Villains](https://2e.aonprd.com/Rules.aspx?ID=2736): an escaped villain returns with "additional minions, spells, or other defenses designed to counteract the strategies the PCs used."
  - [When to Advance NPCs](https://2e.aonprd.com/Rules.aspx?ID=3413): after a fight, the NPC levels up and waits at least a level for the rematch.
- [Fleeing Enemies](https://2e.aonprd.com/Rules.aspx?ID=2571) and [Morale](https://2e.aonprd.com/Rules.aspx?ID=2727): most creatures back down from a fight they're obviously losing.
- **XP for a creature that flees and comes back:** the rules have no rule.
  - Hazards give XP only once.
  - Practical options (house rules): count the creature at full XP in the encounter where it is finally defeated and give nothing earlier; or split its XP. When it returns wounded or out of resources, consider counting it a level or two lower (weak, or the √2 scale for partial strength).

## 13. Allies, troops, swarms, companions

- **Allies fighting with the PCs:** GM Core, Monster Core and Player Core have no rule.
  - Battlecry! [One Tough Enemy](https://2e.aonprd.com/Rules.aspx?ID=3468) offsets them against the enemy budget. Example: a PL+4 boss (160 XP) plus "80 XP worth of troops to the PCs' side to make it effectively a moderate encounter."
  - An alternative is to count a strong ally as an extra PC, using the character adjustment.
- **Troops** ([trait](https://2e.aonprd.com/Traits.aspx?ID=849), [Running Troops](https://2e.aonprd.com/Rules.aspx?ID=3365)): a single creature of its level for XP. It shrinks at ⅔ and ⅓ HP and is weak to area damage.
- **Swarms** ([trait](https://2e.aonprd.com/Traits.aspx?ID=707)): a single creature for XP. Weak to area effects; immune to grappled, prone and restrained.
- **Enemy NPCs' companions:** animal companions and eidolons have "the standard number of actions" and count "toward the encounter's XP budget normally" ([rules-3379](https://2e.aonprd.com/Rules.aspx?ID=3379), [rules-3382](https://2e.aonprd.com/Rules.aspx?ID=3382)). Pets and familiars are part of the NPC's stat block ([rules-3371](https://2e.aonprd.com/Rules.aspx?ID=3371)).
- **Minion** is a trait for controlled creatures (2 actions, no reactions), not an encounter role.

## 14. Design guidance and pitfalls

- [Encounter Variety](https://2e.aonprd.com/Rules.aspx?ID=2720):
  - Vary threat: "A string of moderate-threat encounters can feel flat". Use extreme sparingly.
  - Vary composition: "Higher-level single enemies, squads of enemies, and large numbers of lackeys all feel different."
- **Pitfalls** ([sidebar](https://2e.aonprd.com/Rules.aspx?ID=2731)): don't make every encounter complex; avoid flat difficulty; beware unexpected difficulty and overpowered terrain.
- [Dynamic Encounters](https://2e.aonprd.com/Rules.aspx?ID=2728) and [Evolving Battlefields](https://2e.aonprd.com/Rules.aspx?ID=2730): changing terrain, third parties, and "reinforcements arrive for whichever side was outmatched." Best for bosses and memorable foes.
- [Unexpected Difficulty](https://2e.aonprd.com/Rules.aspx?ID=2544):
  - If a fight will kill everyone, end it differently: surrender, or the enemy leaves.
  - If it was a misjudged factor (terrain, an overpowered ability), adjust next time.
- [Develop the Concept](https://2e.aonprd.com/Rules.aspx?ID=2875): creatures used five at a time should have simple turns. A creature likely to fight alone can have more abilities and more versatile defenses.

## 15. How party level changes the feel of a budget

The same threat plays differently at different levels. The rules don't state this in general; the
points below are official text close to it, plus derived reasoning, labelled as such.

**Low levels are swingier.**
- Monster Core says elite and weak "have a greater effect on the power level of low-level creatures" ([Combat Power](https://2e.aonprd.com/Rules.aspx?ID=3263)). That is why elite and weak skip level 0.
- Level 0 characters ([Gameplay](https://2e.aonprd.com/Rules.aspx?ID=2760)): "Combat can be especially dangerous for level 0 characters. For safety's sake, you might treat the characters as level –1 when determining what combat encounters are appropriate."
- [Massive Damage](https://2e.aonprd.com/Rules.aspx?ID=2332): "You die instantly if you ever take damage equal to or greater than double your maximum Hit Points in one blow."
- *Derived:* at level 1 a PL+2 creature's critical hit can take a PC from full HP to dying. At high levels PCs have far more HP compared with one hit. Treat severe and extreme budgets at levels 1–2 more carefully than the numbers suggest.

**High levels and large groups mean longer fights.**
- [Develop the Concept](https://2e.aonprd.com/Rules.aspx?ID=2875): "If you'll use five at the same time, you'll want their turns to move swiftly and avoid complex special actions."
- [Reactive Abilities](https://2e.aonprd.com/Rules.aspx?ID=2912): with many creatures, "skipping reactions can make the fight flow faster."
- [Time Pressure](https://2e.aonprd.com/Rules.aspx?ID=2732): low and trivial opposition "can usually hold on long enough to make the PCs spend a few rounds to defeat them".
- [Ending the Encounter](https://2e.aonprd.com/Rules.aspx?ID=2570): the GM may call a fight when "the player characters are just cleaning up the last few weak enemies."
- *Community:* high-level PCs have more options and take longer turns, and PL–4 fodder still has HP to chew through. Many lackeys can make a fight long without making it dangerous.

## 16. Pathfinder Society scaling: Challenge Points

Organized play scales encounters by **Challenge Points (CP)** instead of the GM Core budget. Source: the
Guide to Organized Play, [Challenge Points](https://lorespire.paizo.com/tiki-index.php?page=pfs2guide._.Challenge-Points)
(Lorespire). It is not on AoN.

**Status:** from Year 7, new scenarios dropped CP. They are balanced for six PCs of the adventure's lowest level, with "easier" and "harder" adjustments in each encounter's sidebar. Older scenarios still use CP.

**Points per PC**, by level within the adventure's 4-level range (e.g. 1–4):

| PC level | CP |
|---|---|
| lowest allowed level | 2 |
| +1 | 3 |
| +2 | 4 |
| +3 | 6 |

- Guide example: "A party of five PCs levels 1, 2, 3, 4, and 4 would contribute 2, 3, 4, 6, and 6 Challenge Points."
- The steps (×1.5, ×1.33, ×1.5) follow the same progression as creature XP.
- **Rule of thumb** (not in the guide): 1 CP ≈ 5 XP of budget. So a PC at the lowest level ≈ 10 XP and a PC 3 levels higher ≈ 30 XP.

**Choosing the level range (subtier)** from the party's total CP:
- 15 or less: lower range.
- 19 or more: higher range.
- 16–18: higher range only with 4 or fewer PCs; 5 or more PCs play the lower range.

**Encounter scaling** uses CP bands, which are finer than threat levels. Each scenario prints its own bands. The guide's generic table for early scenarios:

| Lower range CP | Higher range CP | Adjustment |
|---|---|---|
| 8–9 | 16–18 | none |
| 10–11 | 19–22 | 5-player adjustment |
| 12–13 | 23–27 | 6-player adjustment or 1 Level Bump |
| 14–15 | 28–32 | 5-player adjustment and 1 Level Bump |
| 16–18 | 33–42 | 6-player adjustment and 1 Level Bump |

**Level Bump** (enemies): +1 to all DCs, attacks, damage, saves, skills, Perception and AC, and +10 HP or +10 % HP, whichever is higher. It works like a lighter elite adjustment.

**Lowest-level PCs in the higher range** get the same bump themselves: +1 to DCs, attacks, damage, saves, skills, Perception and AC, +10 HP or 10 %. Their companions are adjusted too.

**Small tables:**
- Groups under 4 PCs add pregens or a CP bonus (see the guide's table).
- Groups of three in Level 7+ adventures add 2 CP (total under 12) or 4 CP (12 or more) ([Paizo blog](https://paizo.com/blog/organized-play-table-adjustments)).
