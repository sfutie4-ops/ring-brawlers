#!/usr/bin/env python3
"""Rebuild the single-file game.

index.html = src/template.html + src/style.css + art data + src/game.js

The art (sprite atlases as base64 + frame metadata) lives only inside
index.html, as the three lines starting with `const CH=`, `const FX_META=`
and `const FX_SRC=`. This script lifts those lines out of the current
index.html and wraps the new code around them, so the game stays one
self-contained offline file.

Usage:  python3 build.py
"""
import pathlib, sys

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
data = []
for key in ("const CH=", "const FX_META=", "const FX_SRC="):
    lines = [l for l in html.split("\n") if l.startswith(key)]
    if len(lines) != 1:
        sys.exit(f"expected exactly one line starting with {key!r} in index.html, found {len(lines)}")
    data.append(lines[0])

out = (root / "src/template.html").read_text(encoding="utf-8")
for mark, text in (
    ("/*__CSS__*/", (root / "src/style.css").read_text(encoding="utf-8").strip()),
    ("/*__DATA__*/", "\n".join(data)),
    ("/*__JS__*/", (root / "src/game.js").read_text(encoding="utf-8").strip()),
):
    if out.count(mark) != 1:
        sys.exit(f"template must contain {mark} exactly once")
    out = out.replace(mark, text)

(root / "index.html").write_text(out, encoding="utf-8")
print(f"index.html written ({len(out) / 1e6:.1f} MB)")
