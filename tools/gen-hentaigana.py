#!/usr/bin/env python3
"""変体仮名テーブルを Unicode NamesList.txt から生成する。

字母（元になった漢字）を記憶で書くと誤りが入るので、
Unicode が各符号位置に付けている "* derived from XXXX" 注記を一次情報として使う。

    curl -O https://www.unicode.org/Public/UCD/latest/ucd/NamesList.txt
    python3 tools/gen-hentaigana.py NamesList.txt > src/core/data/hentaigana.js
"""
import re
import sys

# U+1B002-U+1B11E。U+1B11F(ARCHAIC WU) は同梱フォントに字形がないため除く。
FIRST, LAST = 0x1B002, 0x1B11E

ROMAJI_TO_KANA = {
    "A": "あ", "I": "い", "U": "う", "E": "え", "O": "お",
    "KA": "か", "KI": "き", "KU": "く", "KE": "け", "KO": "こ",
    "SA": "さ", "SI": "し", "SU": "す", "SE": "せ", "SO": "そ",
    "TA": "た", "TI": "ち", "TU": "つ", "TE": "て", "TO": "と",
    "NA": "な", "NI": "に", "NU": "ぬ", "NE": "ね", "NO": "の",
    "HA": "は", "HI": "ひ", "HU": "ふ", "HE": "へ", "HO": "ほ",
    "MA": "ま", "MI": "み", "MU": "む", "ME": "め", "MO": "も",
    "YA": "や", "YU": "ゆ", "YO": "よ",
    "RA": "ら", "RI": "り", "RU": "る", "RE": "れ", "RO": "ろ",
    "WA": "わ", "WI": "ゐ", "WU": "う", "WE": "ゑ", "WO": "を",
    "N": "ん",
}


def parse_names_list(path):
    """符号位置 -> (名前, 字母の符号位置) を拾う。"""
    entries = {}
    current = None
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            head = re.match(r"^([0-9A-F]{4,6})\t(.+)$", line)
            if head:
                current = int(head.group(1), 16)
                entries[current] = {"name": head.group(2), "jibo": None}
            elif current is not None:
                derived = re.match(r"^\t\* derived from ([0-9A-F]{4,6})$", line)
                if derived:
                    entries[current]["jibo"] = chr(int(derived.group(1), 16))
    return entries


def build_rows(entries):
    rows = []
    for cp in range(FIRST, LAST + 1):
        entry = entries.get(cp)
        if not entry or not entry["name"].startswith("HENTAIGANA LETTER "):
            continue
        body = entry["name"].removeprefix("HENTAIGANA LETTER ")
        parts = body.split("-")
        syllables = [p for p in parts if not p.isdigit()]
        variant = next((int(p) for p in parts if p.isdigit()), None)

        # 読みが一意でない字（A-WO, NI-TE, N-MU-MO ...）は出題プールから外す。
        multi = len(syllables) > 1
        reading = "".join(ROMAJI_TO_KANA[s] for s in syllables)

        rows.append({
            "char": chr(cp),
            "cp": cp,
            "reading": reading,
            "jibo": entry["jibo"],
            # 各音の第1異体字を「よく見る字」とする。
            "tier": 1 if variant == 1 else 2,
            "multi": multi,
        })
    return rows


def render(rows):
    out = [
        "// 自動生成ファイル — 直接編集しない。",
        "// tools/gen-hentaigana.py が Unicode NamesList.txt から生成する。",
        "// 字母は Unicode の `* derived from` 注記に由来する。",
        "",
        "export const HENTAIGANA = [",
    ]
    for r in rows:
        out.append(
            "  {{ char: '{char}', reading: '{reading}', jibo: '{jibo}',"
            " tier: {tier}, multi: {multi} }},".format(
                char=r["char"], reading=r["reading"], jibo=r["jibo"],
                tier=r["tier"], multi="true" if r["multi"] else "false",
            )
        )
    out += ["]", ""]
    return "\n".join(out)


if __name__ == "__main__":
    names_list = sys.argv[1] if len(sys.argv) > 1 else "NamesList.txt"
    rows = build_rows(parse_names_list(names_list))
    if len(rows) != 285:
        sys.exit(f"想定外の件数: {len(rows)} (285を期待)")
    sys.stdout.write(render(rows))
