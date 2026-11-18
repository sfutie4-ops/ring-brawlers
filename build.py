#!/usr/bin/env python3
"""Rebuild the single-file game.

index.html = src/template.html + src/style.css + art data + src/game.js

The base fighter art and effects come from the current index.html.
Additional art comes from the asset folders in the full project. The compact
distribution can also rebuild from the artwork already embedded in index.html.

Usage:  python3 build.py
"""
import pathlib, sys, base64, json

root = pathlib.Path(__file__).parent
html = (root / "index.html").read_text(encoding="utf-8")
data = []
for key in ("const CH=", "const FX_META=", "const FX_SRC="):
    lines = [l for l in html.split("\n") if l.startswith(key)]
    if len(lines) != 1:
        sys.exit(f"expected exactly one line starting with {key!r} in index.html, found {len(lines)}")
    data.append(lines[0])

if not (root / "assets/arenas").is_dir():
    for key in ("ARENA_ART", "EXTRA_ART", "ULTIMATE_ART", "EXPRESSION_ART", "CINEMATIC_ART", "CINEMATIC_FRAMES"):
        prefix = f"const {key}="
        data.append(next(line for line in html.splitlines() if line.startswith(prefix)))
else:
    # Asset data from the full development project.
    arena_art = []
    for name in ("neon-rooftop", "foundry-district", "championship"):
        raw = (root / "assets/arenas" / (name + ".webp")).read_bytes()
        arena_art.append({"name": name, "src": "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")})
    data.append("const ARENA_ART=" + json.dumps(arena_art, separators=(",", ":")) + ";")

    extra=[]
    for name in ("loonie","abra","shehyee","batas","smugglaz","aklas","zaito","apekz","sinio"):
     extra.append("data:image/webp;base64,"+base64.b64encode((root/"assets/moves"/(name+".webp")).read_bytes()).decode())
    data.append("const EXTRA_ART="+json.dumps(extra,separators=(",",":"))+";")
    ultimate_art = []
    for name in ("royal-bust", "cerberus-breath", "triple-timer", "black-hole",
                 "freestyle-rebound", "triple-meaning", "anygma", "ritual-casts"):
        raw = (root / "assets/ultimates" / (name + ".webp")).read_bytes()
        ultimate_art.append({"name": name, "src": "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")})
    data.append("const ULTIMATE_ART=" + json.dumps(ultimate_art, separators=(",", ":")) + ";")

    expression_art = []
    for name in ("focus", "recoil", "ultimate-windup", "ultimate-impact", "cast-expressions"):
        raw = (root / "assets/expressions" / (name + ".webp")).read_bytes()
        expression_art.append({"name": name, "src": "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")})
    data.append("const EXPRESSION_ART=" + json.dumps(expression_art, separators=(",", ":")) + ";")

    cinematic_dir = root / "assets/cinematics"
    cinematic_art = {}
    for name in ("states-early", "states-mid", "states-late", "cast-actions", "mountain-climb", "poop-meteors",
                 "unique-early", "unique-mid", "unique-late", "technique-effects",
                 "shehyee-replacement", "smugglaz-replacement", "apekz-replacement", "roster-faces",
                 "loonie-priest", "abra-renewed", "priest-abra-faces", "verdict-axe",
                 "third-eye", "lotus-smash", "batas-ink", "aklas-ink", "idle-expressions", "sinio-ink", "comic-effects"):
        raw = (cinematic_dir / (name + ".webp")).read_bytes()
        cinematic_art[name] = "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")
    data.append("const CINEMATIC_ART=" + json.dumps(cinematic_art, separators=(",", ":")) + ";")
    data.append("const CINEMATIC_FRAMES=" + (cinematic_dir / "frames.json").read_text(encoding="utf-8").strip() + ";")

out = (root / "src/template.html").read_text(encoding="utf-8")
for mark, text in (
    ("/*__CSS__*/", (root / "src/style.css").read_text(encoding="utf-8").strip()),
    ("/*__DATA__*/", "\n".join(data)),
    ("/*__JS__*/", (root / "src/game.js").read_text(encoding="utf-8").replace("/*__TECHNIQUES__*/", (root / "src/techniques.js").read_text(encoding="utf-8")).replace("/*__CINEMATICS__*/", (root / "src/cinematics.js").read_text(encoding="utf-8")).replace("/*__TACTICS__*/", (root / "src/tactics.js").read_text(encoding="utf-8")).replace("/*__ULTIMATE_PERFORMANCE__*/", (root / "src/ultimate-performance.js").read_text(encoding="utf-8")).replace("/*__ULTIMATE_SCREEN__*/", (root / "src/ultimate-screen.js").read_text(encoding="utf-8")).replace("/*__ULTIMATES__*/", (root / "src/ultimates.js").read_text(encoding="utf-8")).replace("/*__EXPANSION__*/", (root / "src/expansion.js").read_text(encoding="utf-8")).replace("/*__ARENA__*/", (root / "src/arena.js").read_text(encoding="utf-8")).strip()),
):
    if out.count(mark) != 1:
        sys.exit(f"template must contain {mark} exactly once")
    out = out.replace(mark, text)

(root / "index.html").write_text(out, encoding="utf-8")
print(f"index.html written ({len(out) / 1e6:.1f} MB)")
