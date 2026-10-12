#!/usr/bin/env python3
"""Search Pathfinder 2e rules on Archive of Nethys (2e.aonprd.com).

Uses the public, unauthenticated Elasticsearch index that the AoN website itself
queries: POST https://elasticsearch.aonprd.com/aon/_search. Stdlib only.

Subcommands:
  search      find documents by name/text with filters (category, level, trait, ...)
  get         print one document as readable text, by AoN id (spell-1530) or exact name
  categories  list categories with document counts
  query       send a raw Elasticsearch body (JSON string or @file) and print the response
"""

import argparse
import json
import re
import sys
import urllib.error
import urllib.request

ENDPOINT = "https://elasticsearch.aonprd.com/aon/_search"
SITE = "https://2e.aonprd.com"


def es(body):
    req = urllib.request.Request(
        ENDPOINT,
        data=json.dumps(body).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "pf2e-aon-cli/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        sys.exit(f"AoN request failed: HTTP {e.code}: {e.read().decode(errors='replace')[:500]}")
    except urllib.error.URLError as e:
        sys.exit(f"AoN request failed: {e.reason}")


def base_filters(args):
    """Filters shared by search and get-by-name."""
    must_not = [{"term": {"exclude_from_search": True}}]
    filters = []
    if args.category:
        filters.append({"terms": {"category": args.category}})
    if not args.legacy:
        # Legacy (pre-remaster) documents that have a remastered version carry remaster_id.
        must_not.append({"exists": {"field": "remaster_id"}})
    return filters, must_not


def build_search(args):
    filters, must_not = base_filters(args)
    for t in args.trait or []:
        filters.append({"term": {"trait": t}})
    if args.level is not None:
        filters.append({"term": {"level": args.level}})
    rng = {}
    if args.min_level is not None:
        rng["gte"] = args.min_level
    if args.max_level is not None:
        rng["lte"] = args.max_level
    if rng:
        filters.append({"range": {"level": rng}})
    if args.rarity:
        filters.append({"term": {"rarity": args.rarity.lower()}})
    if args.tradition:
        filters.append({"term": {"tradition": args.tradition}})
    if args.source:
        filters.append({"match_phrase": {"source": args.source}})

    must = []
    if args.terms:
        q = " ".join(args.terms)
        if args.name_only:
            must.append({"match": {"name": {"query": q, "operator": "and", "fuzziness": "AUTO"}}})
        else:
            must.append({
                "bool": {
                    "should": [
                        {"match_phrase": {"name": {"query": q, "boost": 20}}},
                        {"match": {"name": {"query": q, "operator": "and", "fuzziness": "AUTO", "boost": 5}}},
                        {"match": {"text": {"query": q, "operator": "and"}}},
                    ],
                    "minimum_should_match": 1,
                }
            })
    body = {
        "size": args.limit,
        "_source": ["id", "name", "category", "level", "rarity", "trait_raw", "summary",
                    "primary_source", "url", "actions", "hp", "ac", "price_raw", "legacy_id", "remaster_id"],
        "query": {"bool": {"must": must or [{"match_all": {}}], "filter": filters, "must_not": must_not}},
    }
    if not args.terms:
        body["sort"] = [{"level": {"order": "asc", "missing": "_first"}}, {"name.keyword": "asc"}]
    return body


def cmd_search(args):
    body = build_search(args)
    res = es(body)
    if "error" in res and "name.keyword" in json.dumps(res["error"]):
        body["sort"] = [{"level": "asc"}]
        res = es(body)
    if args.json:
        print(json.dumps(res["hits"], indent=2, ensure_ascii=False))
        return
    total = res["hits"]["total"]["value"]
    hits = res["hits"]["hits"]
    print(f"{total} match(es), showing {len(hits)}")
    for h in hits:
        s = h["_source"]
        bits = [s.get("category", "?")]
        if s.get("level") is not None:
            bits.append(f"lvl {s['level']}")
        if s.get("rarity") and s["rarity"] != "common":
            bits.append(s["rarity"])
        if s.get("actions"):
            bits.append(s["actions"])
        if s.get("hp") is not None:
            bits.append(f"HP {s['hp']} AC {s.get('ac')}")
        if s.get("price_raw"):
            bits.append(s["price_raw"])
        traits = ", ".join(s.get("trait_raw") or [])
        tag = " [legacy]" if s.get("remaster_id") else ""
        print(f"- {s.get('name')}{tag} ({'; '.join(bits)}) id={s.get('id')} src={s.get('primary_source')}")
        if traits:
            print(f"    traits: {traits}")
        if s.get("summary") and not args.brief:
            print(f"    {s['summary']}")
        print(f"    {SITE}{s.get('url', '')}")


def clean_markdown(md, keep_links=False):
    """Turn AoN's tagged markdown into plain readable markdown."""
    md = re.sub(r'<actions string="([^"]+)"\s*/>', r"[\1]", md)
    # Title block: <title level="1" right="Spell 3" ...>[Name](url) [Two Actions]</title>
    def title(m):
        attrs, inner = m.group(1), m.group(2).strip()
        right = re.search(r'right="([^"]*)"', attrs)
        lvl = re.search(r'level="(\d)"', attrs)
        hashes = "#" * (int(lvl.group(1)) if lvl else 2)
        inner = re.sub(r"\s*\n\s*", " ", inner)
        return f"{hashes} {inner}" + (f" — {right.group(1)}" if right and right.group(1) else "") + "\n"
    md = re.sub(r"<title([^>]*)>(.*?)</title>", title, md, flags=re.S)
    md = re.sub(r"<traits>(.*?)</traits>",
                lambda m: "Traits: " + ", ".join(re.findall(r'label="([^"]+)"', m.group(1))),
                md, flags=re.S)
    md = re.sub(r"</?[a-z][a-z-]*(\s[^>]*)?/?>", "", md)  # remaining layout tags (column, row, ...)
    if keep_links:
        md = re.sub(r"\]\((/[^)]+)\)", lambda m: f"]({SITE}{m.group(1)})", md)
    else:
        md = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", md)
    md = re.sub(r"[ \t]+\n", "\n", md)
    md = re.sub(r"\n{3,}", "\n\n", md)
    return md.strip()


def cmd_get(args):
    target = " ".join(args.target)
    if re.fullmatch(r"[a-z-]+(-\d+)+", target):
        query = {"ids": {"values": [target]}}
    else:
        filters, must_not = base_filters(args)
        query = {"bool": {"must": [{"match_phrase": {"name": target}}], "filter": filters, "must_not": must_not}}
    res = es({"size": 10, "query": query})
    hits = res["hits"]["hits"]
    exact = [h for h in hits if h["_source"].get("name", "").lower() == target.lower()]
    hits = exact or hits
    if not hits:
        sys.exit(f"Nothing found for {target!r}. Try: aon.py search {target}")
    if len(hits) > 1 and not args.first:
        print(f"{len(hits)} documents match {target!r}; pass an id (or --first):", file=sys.stderr)
        for h in hits:
            s = h["_source"]
            print(f"  {s['id']}  {s['name']} ({s.get('category')}, {s.get('primary_source')})", file=sys.stderr)
        sys.exit(2)
    s = hits[0]["_source"]
    if args.json:
        print(json.dumps(s, indent=2, ensure_ascii=False))
        return
    print(clean_markdown(s.get("markdown") or s.get("text") or "", args.links))
    extra = []
    if s.get("remaster_id"):
        extra.append(f"legacy version; remastered as {', '.join(s['remaster_id'])}")
    if s.get("legacy_id"):
        extra.append(f"remaster of {', '.join(s['legacy_id'])}")
    print(f"\n[{s['id']}] {SITE}{s.get('url', '')}" + (f" ({'; '.join(extra)})" if extra else ""))


def cmd_categories(args):
    res = es({"size": 0, "aggs": {"c": {"terms": {"field": "category", "size": 500}}}})
    for b in res["aggregations"]["c"]["buckets"]:
        print(f"{b['key']}\t{b['doc_count']}")


def cmd_query(args):
    raw = args.body
    if raw.startswith("@"):
        with open(raw[1:], encoding="utf-8") as f:
            raw = f.read()
    print(json.dumps(es(json.loads(raw)), indent=2, ensure_ascii=False))


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = p.add_subparsers(dest="cmd", required=True)

    def common(sp):
        sp.add_argument("-c", "--category", action="append",
                        help="category filter, repeatable (spell, feat, creature, equipment, action, condition, ...)")
        sp.add_argument("--legacy", action="store_true",
                        help="include legacy (pre-remaster) documents that have a remastered version")
        sp.add_argument("--json", action="store_true", help="print raw JSON")

    s = sub.add_parser("search", help="search by name/text with filters")
    s.add_argument("terms", nargs="*", help="search text (omit to list everything matching the filters)")
    common(s)
    s.add_argument("-t", "--trait", action="append", help="trait filter, repeatable, case-insensitive")
    s.add_argument("-l", "--level", type=int, help="exact level (spell rank for spells)")
    s.add_argument("--min-level", type=int)
    s.add_argument("--max-level", type=int)
    s.add_argument("-r", "--rarity", help="common, uncommon, rare, unique")
    s.add_argument("--tradition", help="arcane, divine, occult, primal (spells)")
    s.add_argument("-s", "--source", help="source book name, e.g. 'Player Core'")
    s.add_argument("--name-only", action="store_true", help="match only the name, not the full text")
    s.add_argument("-n", "--limit", type=int, default=10)
    s.add_argument("--brief", action="store_true", help="omit summaries")
    s.set_defaults(func=cmd_search)

    g = sub.add_parser("get", help="show one document as text")
    g.add_argument("target", nargs="+", help="AoN id (spell-1530, creature-232) or exact name")
    common(g)
    g.add_argument("--first", action="store_true", help="when a name matches several documents, show the first")
    g.add_argument("--links", action="store_true", help="keep links (as absolute AoN URLs)")
    g.set_defaults(func=cmd_get)

    c = sub.add_parser("categories", help="list categories and counts")
    c.set_defaults(func=cmd_categories)

    r = sub.add_parser("query", help="raw Elasticsearch body")
    r.add_argument("body", help="JSON string or @path/to/body.json")
    r.set_defaults(func=cmd_query)

    args = p.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
