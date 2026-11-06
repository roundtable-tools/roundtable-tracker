#!/usr/bin/env python3
"""Generate the character sheet's action data from Archive of Nethys.

Writes src/components/CharacterSheet/data/pf2eActions.json with:
  - basic: basic and specialty basic actions (Player Core)
  - skills: skill actions per skill, with the trained-only flag
  - exploration: general exploration activities
  - feats: every feat that takes an action (free action, reaction, 1-3
    actions), keyed by lower-case name, for the feats a character has
  - classActions: actions that carry a class's trait (Channel Elements,
    Rage), keyed by lower-case name, for the class features a character has
  - featRefs: for every feat, the skill, exploration and basic actions its
    rules text links to (Lie to Me -> Lie), so the sheet can pre-select the
    actions a character's feats change
  - spells: action cost, rank and traits of every spell, for the spells page,
    also under the legacy names of remastered spells (Magic Missile)
  - ancestries / heritages: their traits (rarity left out), keyed by
    lower-case name; heritages only when they add traits

and src/components/CharacterSheet/data/pf2eReference.json with short rules
text for the sheet's reference page, keyed by lower-case name: feats, traits,
classFeatures, subclasses (rackets, instincts, doctrines, ... under several
spellings, since Pathbuilder writes "Thief Racket" for AoN's racket "Thief"),
backgrounds (with the skills and feat they grant as `details`), heritages and
items (equipment, weapons, armor and shields that have a description) and
spells (also under legacy names).

and src/components/CharacterSheet/data/pf2eItemStats.json: Bulk, hands,
traits, weapon type and range, and armor numbers of every item.

AoN has no field linking actions to skills, so the skill lists below follow
Player Core's skill chapter. Remastered documents win over their legacy
versions. The files are written only after every fetch succeeds, and not at
all when an action listed below is missing on AoN.
Run from web-roundtable-tracker/:  python3 scripts/generate-pf2e-actions.py
"""

import json
import os
import re
import sys
import urllib.request
from pathlib import Path

ENDPOINT = "https://elasticsearch.aonprd.com/aon/_search"
DATA_DIR = Path(__file__).resolve().parent.parent / (
    "src/components/CharacterSheet/data"
)
OUT = DATA_DIR / "pf2eActions.json"
REFERENCE_OUT = DATA_DIR / "pf2eReference.json"
ITEM_STATS_OUT = DATA_DIR / "pf2eItemStats.json"
# Feat and class feature text is kept whole up to this length, so short
# rules aren't cut mid-way (Tinkering Fingers lost its last sentence at 360).
REFERENCE_TEXT_LIMIT = 1000
LONG_TEXT_LIMIT = 700
TRAIT_TEXT_LIMIT = 600
ITEM_TEXT_LIMIT = 1000

# AoN category of each class's subclass, and the word Pathbuilder puts
# around the option's name ("Thief Racket", "Fury Instinct").
SUBCLASS_CATEGORIES = {
    "racket": "Racket", "instinct": "Instinct", "doctrine": "Doctrine",
    "druidic-order": "Order", "bloodline": "Bloodline", "muse": "Muse",
    "patron": "Patron", "arcane-school": "School", "arcane-thesis": "Thesis",
    "research-field": "Research Field", "hunters-edge": "Edge",
    "methodology": "Methodology", "way": "Way", "innovation": "Innovation",
    "mystery": "Mystery", "conscious-mind": "Mind",
    "subconscious-mind": "Mind", "style": "Style", "implement": "Implement",
    "cause": "Cause", "practice": "Practice", "hybrid-study": "Study",
    "element": "Element", "apparition": "Apparition", "tenet": "Tenet",
}
TEXT_LIMIT = 320

BASIC = [
    "Aid", "Crawl", "Delay", "Drop Prone", "Escape", "Interact", "Leap",
    "Ready", "Release", "Seek", "Sense Motive", "Stand", "Step", "Stride",
    "Strike", "Take Cover", "Arrest a Fall", "Avert Gaze", "Burrow", "Dismiss",
    "Fly", "Grab an Edge", "Mount", "Point Out", "Raise a Shield", "Sustain",
]

EXPLORATION = [
    "Avoid Notice", "Defend", "Detect Magic", "Follow the Expert", "Hustle",
    "Investigate", "Repeat a Spell", "Scout", "Search", "Refocus",
]

# Skill actions; a trailing * marks trained-only actions.
SKILLS = {
    "acrobatics": ["Balance", "Tumble Through", "Maneuver in Flight*", "Squeeze*"],
    "arcana": ["Recall Knowledge", "Borrow an Arcane Spell*", "Decipher Writing*",
               "Identify Magic*", "Learn a Spell*"],
    "athletics": ["Climb", "Force Open", "Grapple", "High Jump", "Long Jump",
                  "Reposition", "Shove", "Swim", "Trip", "Disarm*"],
    "crafting": ["Recall Knowledge", "Repair", "Craft*", "Identify Alchemy*"],
    "deception": ["Create a Diversion", "Impersonate", "Lie", "Feint*"],
    "diplomacy": ["Gather Information", "Make an Impression", "Request"],
    "intimidation": ["Coerce", "Demoralize"],
    "medicine": ["Administer First Aid", "Treat Disease*", "Treat Poison*",
                 "Treat Wounds*"],
    "nature": ["Command an Animal", "Recall Knowledge", "Identify Magic*",
               "Learn a Spell*"],
    "occultism": ["Recall Knowledge", "Decipher Writing*", "Identify Magic*",
                  "Learn a Spell*"],
    "performance": ["Perform"],
    "religion": ["Recall Knowledge", "Decipher Writing*", "Identify Magic*",
                 "Learn a Spell*"],
    "society": ["Recall Knowledge", "Subsist", "Create Forgery*",
                "Decipher Writing*"],
    "stealth": ["Conceal an Object", "Hide", "Sneak"],
    "survival": ["Sense Direction", "Subsist", "Cover Tracks*", "Track*"],
    "thievery": ["Palm an Object", "Steal", "Disable a Device*", "Pick a Lock*"],
}

FIELDS = ["name", "actions", "trait", "markdown", "primary_source_raw",
          "remaster_id", "legacy_id", "category", "class"]
STAT_FIELDS = ["bulk_raw", "hands", "weapon_type", "range_raw", "ac", "dex_cap",
               "check_penalty", "speed_penalty", "strength", "armor_category",
               "hardness", "hp", "hp_raw"]


def search(body):
    req = urllib.request.Request(
        ENDPOINT, data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return [h["_source"] for h in json.load(resp)["hits"]["hits"]]


def current(category, extra_filter=None, with_legacy=False):
    """All documents of a category; legacy ones with a remaster are dropped
    unless with_legacy is set."""
    filters = [{"term": {"category": category}}]
    if extra_filter:
        filters.append(extra_filter)
    must_not = [] if with_legacy else [{"exists": {"field": "remaster_id"}}]
    return search({
        "size": 10000,
        "_source": FIELDS + ["id"],
        "query": {"bool": {"filter": filters, "must_not": must_not}},
    })


RARITY = {"Common", "Uncommon", "Rare", "Unique"}


def traits_by_name(docs):
    """Traits per lower-case name; remastered documents win over legacy."""
    out = {}
    for d in sorted(docs, key=lambda d: bool(d.get("remaster_id"))):
        traits = [t for t in (d.get("trait") or []) if t not in RARITY]
        key = d["name"].lower()
        if traits and key not in out:
            out[key] = traits
    return out


def clean(md):
    md = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", md)  # links -> text
    md = re.sub(r"<br\s*/?>", " ", md)
    md = re.sub(r"<[^>]+>", "", md)
    md = md.replace("**", "")
    # Markdown italics (_+1 striking_) and horizontal rules.
    md = re.sub(r"(?<!\w)_([^_]+)_(?!\w)", r"\1", md)
    md = re.sub(r"(?m)^\s*-{3,}\s*$", " ", md)
    # Link-only sentences that mean nothing on paper.
    md = re.sub(r"\s*See (?:here|this page) for (?:more )?details\.", "", md)
    return re.sub(r"\s+", " ", md).strip()


def shorten(text):
    if len(text) <= TEXT_LIMIT:
        return text
    cut = text[:TEXT_LIMIT]
    end = cut.rfind(". ")
    return cut[: end + 1] if end > TEXT_LIMIT // 2 else cut.rstrip() + "…"


def field(md, label):
    # "**Trigger** text" or "**Trigger**\ntext"
    m = re.search(r"\*\*" + label + r"\*\*\s+(.+?)(?:\n|$)", md)
    return clean(m.group(1)) if m else None


def rules_body(md):
    """The description: after the first horizontal rule (feats, actions) or,
    on pages without one (traits, backgrounds, heritages, subclasses), after
    the Source line; up to the next section."""
    if "\n---\n" in md:
        body = md.split("\n---\n", 1)[1]
    else:
        m = re.search(r"\*\*Source\*\*[^\n]*\n", md)
        body = md[m.end():] if m else md
    return re.split(r"\n\*\*Source\*\*|<title", body)[0]


def entry(doc):
    md = doc.get("markdown", "")
    # Outcome lines (Critical Success, ...) are dropped to keep cards short.
    body = re.split(
        r"\n\*\*(?:Critical Success|Success|Failure|Critical Failure)\*\*",
        rules_body(md),
    )[0]
    body = re.sub(r"\*\*(Trigger|Requirements|Frequency)\*\*[^\n]*\n?", "", body)
    source = doc.get("primary_source_raw") or ""
    source = (source.replace("Player Core 2", "PC2").replace("Player Core", "PC")
              .replace("GM Core", "GMC"))
    out = {
        "name": doc["name"],
        "actions": doc.get("actions") or "",
        "traits": [t for t in (doc.get("trait") or [])
                   if t not in ("Common", "General", "Skill")],
        "text": shorten(clean(body)),
        "source": source,
    }
    for key, label in (("trigger", "Trigger"), ("requirements", "Requirements"),
                       ("frequency", "Frequency")):
        value = field(md, label)
        if value:
            out[key] = value
    return out


def own_markdown(doc):
    """A variant (Marked Playing Cards under Playing Cards) carries its parent's
    page; its own part starts at a level-2 title with its name."""
    md = doc.get("markdown", "")
    m = re.search(r'<title[^>]*level="2"[^>]*>\s*(?:\[)?' + re.escape(doc["name"])
                  + r'(?:\]\([^)]*\))?\s*</title>', md)
    return md[m.start():] if m else md


def reference_entry(doc, limit=REFERENCE_TEXT_LIMIT, skip_flavor=False):
    body = rules_body(own_markdown(doc))
    # Subclass and background pages open with a flavor paragraph.
    paragraphs = [p for p in re.split(r"\n\s*\n", body) if clean(p)]
    if skip_flavor and len(paragraphs) > 1:
        body = "\n\n".join(paragraphs[1:])
    text = clean(body)
    if len(text) > limit:
        cut = text[:limit]
        end = cut.rfind(". ")
        text = cut[: end + 1] if end > limit // 2 else cut.rstrip() + "…"
    source = (doc.get("primary_source_raw") or "").replace(
        "Player Core 2", "PC2").replace("Player Core", "PC").replace("GM Core", "GMC")
    return {"name": doc["name"], "text": text, "source": source}


def background_details(doc):
    """The sentences naming the skills and feat a background grants."""
    text = clean(rules_body(doc.get("markdown", "")))
    picked = [s for s in re.split(r"(?<=\.)\s+", text)
              if re.search(r"\btrained\b|\bskill feat\b", s)]
    return " ".join(picked)


def reference():
    out = {}
    feats = by_name(current("feat"))
    out["feats"] = {
        k: {**reference_entry(d),
            "traits": [t for t in (d.get("trait") or []) if t not in RARITY]}
        for k, d in sorted(feats.items())
    }
    out["traits"] = {k: reference_entry(d, TRAIT_TEXT_LIMIT)
                     for k, d in sorted(by_name(current("trait")).items())}
    # Several classes share feature names (Deity, Anathema), so each is also
    # stored as "<name>|<class>"; the plain name keeps the first one.
    features = current("class-feature")

    def feature_entry(d):
        cls = d.get("class")
        cls = cls[0] if isinstance(cls, list) and cls else cls
        return {**reference_entry(d), **({"class": cls} if cls else {})}

    class_features = {k: feature_entry(d)
                      for k, d in sorted(by_name(features).items())}
    for d in sorted(features, key=lambda d: "Player Core" not in
                    (d.get("primary_source_raw") or "")):
        for cls in (d.get("class") if isinstance(d.get("class"), list)
                    else [d.get("class")]):
            if cls:
                class_features.setdefault(f"{d['name']}|{cls}".lower(),
                                          feature_entry(d))
    out["classFeatures"] = class_features
    subclasses = {}
    for category, word in SUBCLASS_CATEGORIES.items():
        for d in current(category):
            e = {**reference_entry(d, LONG_TEXT_LIMIT, skip_flavor=True),
                 "kind": word}
            name = d["name"]
            for variant in (name, f"{name} {word}", f"{word} of {name}",
                            f"{word} of the {name}"):
                subclasses.setdefault(variant.lower(), e)
    out["subclasses"] = subclasses
    out["backgrounds"] = {
        k: {**reference_entry(d, LONG_TEXT_LIMIT, skip_flavor=True),
            "details": background_details(d)}
        for k, d in sorted(by_name(current("background")).items())
    }
    # Items without a description (e.g. Bedroll) are left out.
    item_docs = [d for c in ("equipment", "weapon", "armor", "shield")
                 for d in current(c)]
    out["items"] = {k: e for k, e in (
        (k, reference_entry(d, ITEM_TEXT_LIMIT))
        for k, d in sorted(by_name(item_docs).items())) if e["text"]}
    out["spells"] = {k: reference_entry(d)
                     for k, d in sorted(by_name(current("spell")).items())}
    out["heritages"] = {k: reference_entry(d, LONG_TEXT_LIMIT)
                        for k, d in sorted(by_name(current("heritage")).items())}
    return out


def trait_labels(md):
    """Traits as the page shows them, with values ("Thrown 10 ft.",
    "Versatile S"); AoN's trait field drops the values."""
    block = re.search(r"<traits>(.*?)</traits>", md, re.S)
    labels = re.findall(r'<trait label="([^"]+)"', block.group(1)) if block else []
    return [t for t in labels if t not in RARITY]


def first_int(value):
    m = re.search(r"-?\d+", str(value or ""))
    return int(m.group()) if m else 0


def item_stats():
    """Bulk, hands, traits, weapon type and range, and armor numbers of every
    item, keyed by lower-case name, for the sheet's strikes, armor notes and
    inventory Bulk."""
    out = {}
    for category in ("equipment", "weapon", "armor", "shield"):
        docs = search({
            "size": 10000,
            "_source": FIELDS + STAT_FIELDS,
            "query": {"bool": {
                "filter": [{"term": {"category": category}}],
                "must_not": [{"exists": {"field": "remaster_id"}}],
            }},
        })
        for key, d in sorted(by_name(docs).items()):
            bulk = d.get("bulk_raw")
            entry = {"bulk": "L" if bulk == "L" else
                     (float(bulk) if re.fullmatch(r"\d+(\.\d+)?", str(bulk or "")) else 0)}
            hands = first_int(d.get("hands"))
            if hands > 0:
                entry["hands"] = hands
            # Pages without a traits block still have the trait field, only
            # without values.
            traits = trait_labels(d.get("markdown", "")) or [
                t for t in (d.get("trait") or []) if t not in RARITY]
            if traits:
                entry["traits"] = ", ".join(traits)
            if category == "weapon" and d.get("weapon_type"):
                entry["weaponType"] = d["weapon_type"].lower()
                if d.get("range_raw"):
                    entry["range"] = d["range_raw"]
            if category == "armor" and d.get("armor_category"):
                entry["armor"] = {
                    "category": d["armor_category"].lower(),
                    "ac": d.get("ac") or 0,
                    "dexCap": d.get("dex_cap") if d.get("dex_cap") is not None else 5,
                    "strength": d.get("strength") or 0,
                    "checkPenalty": first_int(d.get("check_penalty")),
                    "speedPenalty": first_int(d.get("speed_penalty")),
                    "flexible": "Flexible" in traits,
                }
            if category == "shield":
                # hp_raw is "20 (10)": Hit Points and, in brackets, Broken
                # Threshold.
                bt = re.search(r"\((\d+)\)", str(d.get("hp_raw") or ""))
                entry["shield"] = {
                    "ac": d.get("ac") or 0,
                    "hardness": d.get("hardness") or 0,
                    "hp": d.get("hp") or 0,
                    "bt": int(bt.group(1)) if bt else (d.get("hp") or 0) // 2,
                }
            out.setdefault(key, entry)
    return out


def by_name(docs):
    found = {}
    for d in docs:
        # Prefer a Player Core document when names repeat.
        key = d["name"].lower()
        if key not in found or "Player Core" in (d.get("primary_source_raw") or ""):
            found[key] = d
    return found


def legacy_spell_names(current_docs):
    """Lower-case legacy name of each remastered spell -> the lower-case name
    of its remaster (magic missile -> force barrage)."""
    names = {d["id"]: d["name"].lower() for d in current_docs}
    legacy = search({
        "size": 10000,
        "_source": ["name", "remaster_id"],
        "query": {"bool": {"filter": [
            {"term": {"category": "spell"}},
            {"exists": {"field": "remaster_id"}},
        ]}},
    })
    out = {}
    for d in legacy:
        ids = d["remaster_id"] if isinstance(d["remaster_id"], list) else [d["remaster_id"]]
        target = next((names[i] for i in ids if i in names), None)
        if target:
            out.setdefault(d["name"].lower(), target)
    return out


def with_legacy_names(spells, legacy_names):
    """The spell map plus each legacy name pointing at its remaster's entry."""
    out = dict(spells)
    for legacy, target in legacy_names.items():
        if target in spells:
            out.setdefault(legacy, spells[target])
    return out


def write_json(path, value):
    """Write through a temporary file, so an interrupted run keeps the old
    file whole."""
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")),
                   encoding="utf-8")
    os.replace(tmp, path)


def main():
    actions = by_name(current("action"))
    missing = []

    def pick(name):
        doc = actions.get(name.lower())
        if not doc:
            missing.append(name)
            return None
        return entry(doc)

    data = {
        "basic": [e for e in map(pick, BASIC) if e],
        "exploration": [e for e in map(pick, EXPLORATION) if e],
        "skills": {},
        "feats": {},
    }
    for skill, names in SKILLS.items():
        rows = []
        for raw in names:
            trained = raw.endswith("*")
            e = pick(raw.rstrip("*"))
            if e:
                rows.append({**e, "trained": trained})
        data["skills"][skill] = rows
    if missing:
        sys.exit("missing actions on AoN, nothing written: " + ", ".join(missing))

    feats = current("feat", {"exists": {"field": "actions"}})
    for key, doc in sorted(by_name(feats).items()):
        data["feats"][key] = entry(doc)

    # Actions a class feature grants (Channel Elements, Rage): actions with a
    # class's trait, for the class features in Pathbuilder's specials.
    class_names = {d["name"] for d in current("class")}
    data["classActions"] = {
        key: entry(doc) for key, doc in sorted(actions.items())
        if class_names & set(doc.get("trait") or []) and key not in data["feats"]
    }

    # Action links in feat text: /Actions.aspx?ID=<n>. Legacy feats link to
    # legacy actions, so ids of every version map to the action's name.
    action_names = {
        d["id"].split("-")[1]: d["name"]
        for d in current("action", with_legacy=True)
        if d.get("id", "").startswith("action-")
    }
    listed = {e["name"] for e in data["basic"] + data["exploration"]}
    listed |= {e["name"] for rows in data["skills"].values() for e in rows}
    data["featRefs"] = {}
    for key, doc in sorted(by_name(current("feat")).items()):
        md = doc.get("markdown", "")
        ids = re.findall(r"/Actions\.aspx\?ID=(\d+)", md)
        refs = {action_names[i] for i in ids if action_names.get(i) in listed}
        # Rules text capitalizes action names, often without a link
        # ("attempt to Demoralize"), so match those too. The feat's own name
        # is left out: Repair Module doesn't refer to Repair.
        text = clean(rules_body(md)).replace(doc["name"], "")
        refs |= {n for n in listed if re.search(r"\b" + re.escape(n) + r"(?:s|d)?\b", text)}
        refs = sorted(refs)
        if refs:
            data["featRefs"][key] = refs

    # Spells: action cost, rank and traits, for the spells page.
    spell_docs = search({
        "size": 10000,
        "_source": ["id", "name", "actions", "level", "trait", "primary_source_raw"],
        "query": {"bool": {
            "filter": [{"term": {"category": "spell"}}],
            "must_not": [{"exists": {"field": "remaster_id"}}],
        }},
    })
    legacy_names = legacy_spell_names(spell_docs)
    data["spells"] = with_legacy_names({
        k: {"actions": d.get("actions") or "",
            "rank": d.get("level") or 0,
            "traits": [t for t in (d.get("trait") or []) if t not in RARITY]}
        for k, d in sorted(by_name(spell_docs).items())
    }, legacy_names)

    data["ancestries"] = traits_by_name(current("ancestry", with_legacy=True))
    data["heritages"] = traits_by_name(current("heritage", with_legacy=True))

    stats = item_stats()
    ref = reference()
    ref["spells"] = with_legacy_names(ref["spells"], legacy_names)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    write_json(OUT, data)
    write_json(ITEM_STATS_OUT, stats)
    write_json(REFERENCE_OUT, ref)
    print(f"wrote {ITEM_STATS_OUT} ({ITEM_STATS_OUT.stat().st_size // 1024} KiB, "
          f"{len(stats)} items)")
    print(f"wrote {REFERENCE_OUT} ({REFERENCE_OUT.stat().st_size // 1024} KiB, "
          + ", ".join(f"{len(v)} {k}" for k, v in ref.items()) + ")")
    print(f"wrote {OUT} ({OUT.stat().st_size // 1024} KiB, "
          f"{len(data['feats'])} action feats, {len(data['classActions'])} class "
          f"actions, {len(data['featRefs'])} feats "
          f"linking actions, {len(data['ancestries'])} ancestries)")


if __name__ == "__main__":
    main()
