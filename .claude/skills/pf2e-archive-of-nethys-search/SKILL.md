---
name: pf2e-archive-of-nethys-search
description: Look up Pathfinder 2e (PF2e) rules content on Archive of Nethys (2e.aonprd.com) through its public Elasticsearch API — spells, feats, creatures/monster stat blocks, equipment and prices, actions, conditions, traits, hazards, ancestries, classes, archetypes, deities and more. Use whenever a PF2e question needs the actual rules text or numbers (what does X do, a creature's AC/HP/saves, an item's price, which level-N fire spells exist, feats with trait Y), when building encounters or characters, or when the user says "look it up on AoN / Nethys". Prefer it over answering PF2e rules from memory.
---

# PF2e lookup on Archive of Nethys

Archive of Nethys (AoN) is the official free PF2e rules reference. Its website queries a public,
unauthenticated Elasticsearch index; `scripts/aon.py` wraps it (Python stdlib only, no install).

```bash
AON="python3 -I $(git rev-parse --show-toplevel)/.claude/skills/pf2e-archive-of-nethys-search/scripts/aon.py"
```

## Commands

| Need | Command |
|---|---|
| Find things by name or rules text | `$AON search fireball` |
| Filter by category / level / trait | `$AON search -c spell -t fire -l 3` |
| Level range, rarity, tradition, source | `$AON search -c creature --min-level 3 --max-level 5 -t undead -r uncommon` |
| Only match names | `$AON search --name-only shield` |
| Full text of one entry | `$AON get Fireball` or `$AON get spell-1530` |
| Several entries share a name | `get` lists them with ids and exits 2; rerun with an id, or `-c <category>`, or `--first` |
| Keep AoN links in the output | `$AON get --links Frightened` |
| All fields as JSON (stats, numbers) | `$AON get --json creature-232`, `$AON search ... --json` |
| Category names and counts | `$AON categories` |
| Anything else (aggregations, custom sorts) | `$AON query '{"size":5,"query":{...}}'` or `$AON query @body.json` |

`search` prints one line per hit with category, level, rarity, actions, HP/AC (creatures) or price
(items), id, source, traits, summary and the AoN URL. `--brief` drops summaries, `-n` sets the
number of hits (default 10). With no search text it lists everything matching the filters, sorted
by level.

## Remaster vs legacy

PF2e was remastered (Player Core, GM Core, Monster Core, ...). AoN keeps both versions:
a legacy document has `remaster_id`, its remastered version has `legacy_id`.

- By default the script **hides legacy documents that have a remastered version**, so results are
  current rules. Legacy-only content (never remastered) still shows.
- Pass `--legacy` when the user plays with pre-remaster rules or asks about the old version
  (e.g. alignment, the old schools of magic, Core Rulebook text). Legacy hits are tagged `[legacy]`.
- `get` output ends with `(remaster of …)` / `(legacy version; remastered as …)` when relevant.

## Useful facts about the index

- Common categories: `spell`, `feat`, `creature`, `equipment`, `weapon`, `armor`, `shield`, `action`,
  `condition`, `trait`, `hazard`, `ancestry`, `heritage`, `background`, `class`, `class-feature`,
  `archetype`, `deity`, `ritual`, `creature-ability`, `rules`. Run `categories` for the full list (~100).
- `level` is the spell rank for spells, item level for equipment, creature level for creatures.
- `trait` and `category` filters are case-insensitive exact terms; `name` and `text` are full-text.
- Creature JSON has numeric fields ready for encounter math: `hp`, `ac`, `perception`,
  `fortitude_save`, `reflex_save`, `will_save`, `strength`…`charisma`, `speed`, `skill_mod`,
  `attack_bonus`, `strike_damage_average`, `resistance`, `weakness`, `immunity`, and `*_scale`
  fields (Low/Moderate/High/Extreme) relative to the creature's level.
- Item variants (Minor/Lesser/Moderate healing potion) have ids like `equipment-2943-2812`, but
  `get` prints the whole item page with every variant; the per-variant numbers are in `--json`.
- Documents with `exclude_from_search: true` are hidden, same as on the website.
- `_mapping` is not allowed for anonymous users; inspect a document with `get --json` to see fields.

## How to answer

- Quote or paraphrase the fetched text, not memory, and give the AoN URL so the user can check it.
- Say which version (remaster or legacy) you used when the two differ.
- If a search returns nothing, retry with fewer words, `--name-only` off, or without filters before
  concluding something does not exist.
- Before claiming the game "never" or "nowhere" does something (e.g. "nothing happens at the end of a
  round"), run a full-text search with no category filter, e.g.
  `$AON query '{"query":{"match_phrase":{"text":"end of each round"}}}'`. Creatures, hazards, traits
  and adventure rules count, not only the core rules chapters.
- Keep the rule's exact subject when paraphrasing. "Directly before the turn in which you were
  reduced to 0 HP" means the turn in progress, not the turn of the creature that dealt the damage.
  Quote the sentence when the wording decides the answer.
