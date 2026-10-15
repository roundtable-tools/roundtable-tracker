# How Roundtable Tracker implements encounter building

Paths are relative to `web-roundtable-tracker/src/`. Function, type and constant names are given so they
can be found with grep. Check the code before relying on details, and keep this file in sync when the XP
math changes.

## XP per creature and hazard

- **Two copies of the same formula:**
  - `LevelDifference.toExperience(isComplexHazard = true)` in `models/utility/level/LevelDifference.ts`
  - `ExperienceBudget.fromLevel(relativeLevel)` in `models/utility/experienceBudget/ExperienceBudget.ts`
- **The formula:**
  - Base cost 40; `difference = Math.trunc(levelDifference)`; below –4 gives 0 XP.
  - Even difference: 40 × 2^(d/2). Odd difference: 40 × 1.5 × 2^((d–1)/2). Negatives use the mirror (0.75 / 2^…).
  - Result for –4..+4: 10, 15, 20, 30, 40, 60, 80, 120, 160 (pinned in `models/utility/level/Level.spec.ts`).
  - Above +4 it keeps going: +5 = 240, +6 = 320. This is the stepped 1/1.5/2/3/4 scale extended, not √2.
- **Simple hazards** cost `complex / 5` (2…32). The flag is `isSimpleHazard` in the builder, `isComplexHazard` in the store, and `role: 'complex' | 'simple'` in the template model.
- `EncounterTemplate.calculateParticipantXp` multiplies XP by `count`.

## Threat budget and party size

- **`THREAT_TYPE`** (`models/utility/threat/Threat.class.ts`):
  - Keys 0–10: Trivial, Low, Moderate, Moderate+, Severe, Severe+, Extreme, Extreme+, Extreme++, Extreme+++, Impossible.
  - Base budgets 40, 60, 80 … 240, in steps of 20.
- **`ExperienceBudget.resolveCharacterAdjustmentValue(base)`:**

  | Base budget | Adjustment per PC |
  |---|---|
  | ≤ 40 | base ÷ 4 |
  | < 120 | 20 |
  | < 160 | 30 |
  | ≥ 160 | 40 |

  Matches GM Core (Trivial 10, Low 20, Moderate 20, Severe 30, Extreme 40). The in-between grades (Moderate+, Severe+, Extreme+…, Impossible) use the adjustment of the official threat below them.
- **`Threat.toExpBudget(partySize)`** = `base + adjustment × (partySize – 4)`.
- **`Threat.thresholds(partySize)`** gives each threat's minimum XP: its `toExpBudget`, raised to the previous threshold where tiny parties would make a higher threat cheaper than a lower one (for 1 PC, Severe 30 < Moderate+ 40).
- **`Threat.fromExperienceBudget(xp, partySize)`** returns the highest threat whose threshold the XP reaches ("at or above"): for 4 PCs, < 60 is Trivial, 60–79 Low, 80–99 Moderate, 100–119 Moderate+, and so on. XP ≤ 0 is always Trivial.
- **Party level and size:** a single `partyLevel` (1–20) and `partySize` (default 4) in the builder (`BuilderPage.tsx`, defaults in `builderConvert.defaultFormValues`). There is no mixed-level party handling.
- **Allowed level range for a template:** `participantsToLevelRange` (`store/data.ts`) clamps it so that every creature stays within levels –1..25.

## Adjustments

`getAdjustedLevel` (`models/utility/level/Level.ts`) is used for XP:

| Adjustment | Level change |
|---|---|
| `elite` | +2 if base ≤ 0, else +1 |
| `weak` | –2 if base = 1, else –1 |
| `elite-offense` | +1.5 if base ≤ 0, else +0.75 (partial adjustment) |
| `elite-defense` | +1 if base ≤ 0, else +0.5 (partial adjustment) |

- `adjustedLevel` (`store/data.ts`) is used for display. It gives **both** partial adjustments +1 / +0.5, and also adds `customAdjustmentLevelModifier`.
- `formatAdjustedLevel` shows fractional levels as `10(+)` or `11(-)`.
- **Custom adjustment** (`SlotRowTabs/AdjustmentTab.tsx`): `adjustmentDescription` plus a numeric `adjustmentLevelModifier` (step 0.1) that is added to the level for XP (`builderXp.resolveCombatValuesBaseXp`).
- **No elite or weak HP or stat changes are applied.** The HP tab is a manual `maxHealth` override, plus `hardness` for hazards.

## Relative levels

- **Templates** store `relativeLevel` (`models/encounters/encounter.types.ts`, `LevelDifference`). `toLevel(partyLevel)` resolves it.
- The old store model uses `Participant<Relative>` with strings such as `"+2"`. `normalizeLevel` resolves those.
- **Builder slots** hold absolute levels.
- **Saving** stores the main participants absolute. Reinforcement participants are stored relative via `toRelativeLevelString`, which truncates fractions.

## Templates and roles

- `CreatureRole = 'boss' | 'lackey' | 'lieutenant' | 'opponent' | string`; the defaults also use `'troop'`. `HazardRole = 'complex' | 'simple'`.
- **Default templates** (`models/encounters/defaultTemplates.ts`):
  - Hand-made variants for party sizes 3, 4, 5 and 6. Each sums exactly to the app's budget for that size.
  - Elite or weak shifts are baked into `relativeLevel`; the tags such as "Elite Boss" are labels only.

| Template | Threat | 4 PCs | Official counterpart |
|---|---|---|---|
| Boss and Lackeys | Severe | boss +2, 4 × lackey –4 | same |
| Boss and Lieutenant | Severe | boss +2, lieutenant 0 | same |
| Worthy Opponents | Severe | 3 × opponent 0 | Elite Enemies |
| Lieutenant and Lackeys | Moderate | lieutenant 0, 4 × lackey –4 | same |
| Mated Pair | Moderate | 2 × opponent 0 | same |
| Troop | Moderate | troop 0, 2 × leader –2 | same |
| Mook Squad | Low | 6 × lackey –4 | same |
| Solo Boss | Extreme | boss +4 | Table 10-2 PL+4 row |

- Party-size variants are picked by `partySize`, not computed.
- There is no Pathfinder Society Challenge Points mode.
- The migration helper `inferCreatureRole` (`models/encounters/migrate.adapter.ts`) guesses a role from the name.

## Accomplishment XP, narrative slots, allies

- **`ACCOMPLISHMENT_XP_AWARD = { story: 0, minor: 10, moderate: 30, major: 80 }`** (`components/BuilderPage/builderXp.ts`).
  - Narrative slots **add** their accomplishment XP to the encounter's threat XP (`computeBuilderXP`).
  - This is the house rule that **charges synergy, terrain or story pressure against the budget**. It is not the official use of accomplishment XP, which is a reward.
  - A repeating narrative (`repeatInterval`) counts once.
  - On save, a narrative becomes a `NarrativeSlot` with `accomplishmentLevel`; its type is `ongoing` if it repeats, otherwise `default`.
- **Sides:**
  - `ally` slots **subtract** their XP. This is the Battlecry!-style offset; the core books have no rule.
  - `other` and `neutral` slots are ignored.

## Reinforcements and the threat tracker

- **`computeEncounterXpUsage`** (`builderXp.ts`):
  - Immediate XP is everything that isn't a reinforcement, including narrative XP.
  - Reinforcement XP is simulated by `simulateEncounterThreat`:
    - The party removes `20 × partySize/4` XP per round.
    - Attrition adds 5 % of (current threat + accumulated attrition) to the threat each round, so it compounds upwards; at most 20 rounds.
    - `effectiveXp` is the peak simultaneous XP. The display rounds it up to a multiple of 5.
  - All reinforcement slots are merged into one wave, at the earliest `reinforcementRound`.
- **`ThreatTracker.tsx`** shows effective vs raw XP, a per-round chart and the threat bands. Its label comes from `Threat.fromExperienceBudget`, and its bands from `getMergedThresholds` (`threatThresholds.ts`), which groups `Threat.thresholds` by base threat. The bar and the saved difficulty therefore always agree for the same XP.
- **Saved difficulty** (`components/BuilderPage/builderConvert.ts`, `toConcreteEncounter`): `Threat.fromExperienceBudget(computeBuilderXP)`, with the "+" grades collapsed to their base threat. It ignores reinforcements.

## Not modelled

- incapacitation or any trait effects (the traits tab is labels only, and traits aren't saved);
- elite or weak stat and HP changes;
- action advantage;
- power spikes;
- reusing a creature from an earlier encounter;
- mixed-level parties;
- a warning for creatures outside ±4.

## Tests

| Spec | Pins |
|---|---|
| `models/utility/level/Level.spec.ts` | XP tables, elite and weak at the edges, formatting |
| `models/utility/experienceBudget/ExperienceBudget.spec.ts` | budgets, party-size adjustments, inversion |
| `models/utility/threat/Threat.spec.ts` | XP → threat |
| `tests/builderXp.spec.ts` | allies, accomplishments, reinforcement simulation |
| `tests/ThreatTracker.spec.ts` | band layout; bar and saved difficulty agree |
| `models/encounters/EncounterTemplate.spec.ts` | template XP |

## Known quirks

Check the code before relying on these.

- `elite-offense` is +0.75 level for XP but +0.5 for display (#98).
- `Math.trunc` on fractional level differences rounds toward zero: positive fractions round down, negative ones round up. Partial adjustments therefore often change nothing, and a –1.25 difference costs like –1 (#99).
- Several reinforcement waves collapse into one, at the earliest round, and the saved difficulty ignores reinforcements (#100).
- Weak on a level 0 or –1 creature gives –1 or –2. The rules don't cover weak at those levels.
- The default template "Lieutenant and Lackeys" variant texts say "(-3) lackeys" or "Weak Lackey", where the data is –4.
- Builder traits aren't saved (#101). Combat-ready state, hidden-from-players and initiative description aren't saved either (#94).
- `migrateOldTemplate` drops adjustments and events. It isn't used at runtime.
