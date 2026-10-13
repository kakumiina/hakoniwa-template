#!/usr/bin/env python3
"""books/ の Markdown を読んで、書庫用の data.js を作る。

置き方:
  books/<棚フォルダ>/<本>.md   … 棚フォルダ1つ = 本棚1架。フォルダ名の頭の「01-」などの番号は並び順に使われ、表示からは外れる。
  本の頭に次のような front matter を書ける（省略可）:
      ---
      title: 本のタイトル（背表紙と一覧に出る）
      type: reference   # hub / user / feedback / project / reference / other（背表紙の色が変わる）
      ---
  本文の [[別の本のファイル名]] や [文字](別の本.md) は「つながっている本」として金の線で結ばれる。

使い方:  python3 build_data.py   → 同じフォルダの data.js を書き直す
"""
import datetime, json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
BOOKS = os.path.join(HERE, "books")
OUT = os.path.join(HERE, "data.js")
TYPES = ("hub", "user", "feedback", "project", "reference", "other")
LINK_MD = re.compile(r"\]\(([^)\s]+\.md)\)")
LINK_WIKI = re.compile(r"\[\[([^\]]+)\]\]")
MAX_PER_SHELF = 40


def parse(path):
    txt = open(path, encoding="utf-8").read()
    meta, body = {}, txt
    if txt.startswith("---"):
        end = txt.find("\n---", 3)
        if end > 0:
            head, body = txt[3:end], txt[end + 4:]
            for line in head.splitlines():
                m = re.match(r"\s*(title|type):\s*(.*)", line)
                if m:
                    meta[m.group(1)] = m.group(2).strip()
    return meta, body.strip()


def shelf_name(folder):
    return re.sub(r"^\d+[-_ ]*", "", folder) or folder


books, shelves = {}, []
for folder in sorted(d for d in os.listdir(BOOKS) if os.path.isdir(os.path.join(BOOKS, d))):
    ids = []
    for f in sorted(x for x in os.listdir(os.path.join(BOOKS, folder)) if x.endswith(".md")):
        bid = f[:-3]
        if bid in books:
            raise SystemExit(f"同じファイル名の本が2冊あります: {bid}.md")
        meta, body = parse(os.path.join(BOOKS, folder, f))
        typ = meta.get("type", "reference")
        books[bid] = {"t": meta.get("title") or bid, "n": bid, "type": typ if typ in TYPES else "other", "body": body, "links": []}
        ids.append(bid)
    for i in range(0, len(ids), MAX_PER_SHELF):
        chunk = ids[i:i + MAX_PER_SHELF]
        kinds = [books[b]["type"] for b in chunk]
        shelves.append({"id": f"{folder}-{i // MAX_PER_SHELF}",
                        "name": shelf_name(folder) + (f" {i // MAX_PER_SHELF + 1}" if len(ids) > MAX_PER_SHELF else ""),
                        "kind": max(set(kinds), key=kinds.count) if kinds else "other", "books": chunk})

for bid, b in books.items():
    ls = [os.path.basename(x)[:-3] for x in LINK_MD.findall(b["body"])]
    ls += [x.strip() for x in LINK_WIKI.findall(b["body"])]
    b["links"] = [x for x in dict.fromkeys(ls) if x in books and x != bid]

data = {"built": datetime.datetime.now().strftime("%Y-%m-%d %H:%M"), "shelves": shelves, "books": books}
with open(OUT, "w", encoding="utf-8") as fp:
    fp.write("window.LIB_DATA=" + json.dumps(data, ensure_ascii=False) + ";\n")
print(f"books={len(books)} shelves={len(shelves)} size={os.path.getsize(OUT) // 1024}KB")
for s in shelves:
    print(f"  {s['name']}: {len(s['books'])}")
