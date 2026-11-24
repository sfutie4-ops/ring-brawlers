#!/usr/bin/env python3
"""Rebuild the single-file game.

index.html = src/template.html + src/style.css + src/theme.css + art data + src/game.js + src/story.js
(FliptapWars: unofficial fan-made build, merged with the Complete Edition creator files.)

The base fighter art and effects come from src/base-art.js when supplied.
Additional art comes from the asset folders in the full project. The compact
distribution can also rebuild from the artwork already embedded in index.html.

Usage:  python3 build.py
"""
import pathlib, sys, base64, json, hashlib, re, io, shutil
from scripts.complete_assets import BASE_FIGHTERS, load_complete

root = pathlib.Path(__file__).parent
redraw_names = {3:"batas",5:"aklas",6:"zaito",12:"badang"}
def redesigned(fighter, name):
    folder = root / "assets/redraw"
    record = json.loads((folder/(name+".json")).read_text())
    return {**fighter,**record,"redraw":name,"img":"data:image/webp;base64,"+
        base64.b64encode((folder/(name+".webp")).read_bytes()).decode()}
art_seed = root / "src/base-art.js"
html = (art_seed if art_seed.is_file() else root / "index.html").read_text(encoding="utf-8")
data = []
complete_fighters, complete_data, complete_players = load_complete(root)
for key in ("const CH=", "const FX_META=", "const FX_SRC="):
    lines = [l for l in html.split("\n") if l.startswith(key)]
    if len(lines) != 1:
        sys.exit(f"expected exactly one line starting with {key!r} in index.html, found {len(lines)}")
    if key == "const CH=":
        fighters = json.loads(lines[0][len(key):-1])[:BASE_FIGHTERS]
        fighters.extend(complete_fighters)
        for ci,name in redraw_names.items():
            fighters[ci] = redesigned(fighters[ci], name)
        data.append(key + json.dumps(fighters, separators=(",", ":")) + ";")
    else:
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
     extra.append(None if name in redraw_names.values() else "data:image/webp;base64,"+base64.b64encode((root/"assets/moves"/(name+".webp")).read_bytes()).decode())
    data.append("const EXTRA_ART="+json.dumps(extra,separators=(",",":"))+";")
    ultimate_art = []
    for name in ("royal-bust", "cerberus-breath", "triple-timer", "black-hole",
                 "triple-meaning", "anygma", "ritual-casts"):
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
    for name in ("cast-actions", "mountain-climb", "zaito-effects",
                 "unique-early", "unique-mid", "unique-late", "technique-effects",
                 "shehyee-replacement", "smugglaz-replacement", "apekz-replacement",
                 "loonie-priest", "abra-renewed", "verdict-axe",
                 "third-eye", "lotus-smash", "sinio-ink", "comic-effects"):
        raw = (cinematic_dir / (name + ".webp")).read_bytes()
        cinematic_art[name] = "data:image/webp;base64," + base64.b64encode(raw).decode("ascii")
    data.append("const CINEMATIC_ART=" + json.dumps(cinematic_art, separators=(",", ":")) + ";")
    data.append("const CINEMATIC_FRAMES=" + (cinematic_dir / "frames.json").read_text(encoding="utf-8").strip() + ";")

motion = root / "assets/motion"
motion_frames = json.loads((motion / "manifest.json").read_text())
def motion_url(name):
    return "data:image/webp;base64," + base64.b64encode((motion / (name + ".webp")).read_bytes()).decode()
backstage = json.loads((motion / "backstage.json").read_text())
for name, frames in backstage.items():
    backstage[name] = dict(src=motion_url("backstage-"+name), frames=frames)
signatures = json.loads((motion / "signatures.json").read_text())
for name, frames in signatures.items():
    signatures[name] = dict(src=motion_url("ultimate-"+name), frames=frames)
motion_data = dict(signatures=signatures,backstage=backstage,lobby=motion_url("lobby"), faces=motion_url("faces"),mascots=motion_url("mascots"), props=motion_url("props"),
                   gestures=motion_url("gestures"),gestureFrames=json.loads((motion/"gestures.json").read_text()),fighters=[
    dict(name=name,frames=frames,src=motion_url(name)) if name not in redraw_names.values() else dict(name=name)
    for name,frames in motion_frames.items()])
data.append("const MOTION_ART=" + json.dumps(motion_data,separators=(",", ":")) + ";")
data.append("const COMPLETE_ART=" + json.dumps(complete_data, separators=(",", ":")) + ";")
antic_art={}
antic_dir = root / "assets/antics"
antic_placements = json.loads((antic_dir / "placements.json").read_text())
for name, (columns, cell) in json.loads((antic_dir / "runtime.json").read_text()).items():
    if name in {"aklas", "duel"}:
        continue
    raw = (antic_dir / (name + ".webp")).read_bytes()
    antic_art[name] = ["data:image/webp;base64," + base64.b64encode(raw).decode("ascii"), columns, cell, antic_placements[name]]
# Battlefield Antics 100 (WebP strips + manifest in addons/battlefield-antics)
bf_dir = root / "addons/battlefield-antics"
bf_manifest = json.loads((bf_dir / "manifest.json").read_text(encoding="utf-8"))
bf_clips = {}
def bf_cut(clip):
    """True when a clip's art runs into the top of its frames: those strips were sliced through the middle of the
    figures (a chopped head, or the feet of the row above poking in), so the clip is left out of the game."""
    from PIL import Image
    alpha = Image.open(bf_dir / clip["png"]).convert("RGBA").getchannel("A")
    for f in clip["frames"]:
        x, y, w, h = f["rect"]
        if sum(alpha.getpixel((x + i, y)) > 128 for i in range(w)) > w * .02:
            return True
    return False
bf_skipped = []
for cid, clip in bf_manifest["animations"].items():
    if bf_cut(clip):
        bf_skipped.append(cid)
        continue
    bf_clips[cid] = dict(src="data:image/webp;base64," + base64.b64encode((bf_dir / clip["png"]).read_bytes()).decode("ascii"),
        frames=[f["rect"] + f["pivot"] for f in clip["frames"]], ms=clip["frameMs"], order=clip.get("replayOrder", [0, 1, 2, 3]), loop=clip["loop"], layer={"background": "back"}.get(clip["layer"], clip["layer"]),
        event=clip["event"], cd=clip.get("cooldownMs", 6000) / 1000, title=clip["title"])
if bf_skipped:
    print(f"battlefield antics: left out {len(bf_skipped)} clips whose art is cut off: " + ", ".join(bf_skipped))
data.append("const BF_ANTICS=" + json.dumps(dict(clips=bf_clips), separators=(",", ":")) + ";")
data.append("const ANTIC_ART=" + json.dumps(antic_art, separators=(",", ":")) + ";")

versus_art=[]
for name in ('versus-stage',):
    raw=(root/'assets/menu'/(name+'.webp')).read_bytes()
    versus_art.append('data:image/webp;base64,'+base64.b64encode(raw).decode())
data.append("const VERSUS_ART="+json.dumps(versus_art,separators=(",",":"))+";")
menu_css=[]
for key,name in [('lobby','stage-story-lobby'),('cup','flip-coffee'),('props','flip-props')]:
    art=base64.b64encode((root/'assets/menu'/(name+'.webp')).read_bytes()).decode()
    menu_css.append('--'+key+'-art:url(data:image/webp;base64,'+art+')')
out = (root / "src/template.html").read_text(encoding="utf-8")
for mark, text in (
    ("/*__CSS__*/", (root / "src/style.css").read_text(encoding="utf-8").strip() + "\n" + (root / "src/theme.css").read_text(encoding="utf-8").strip()),
    ("/*__DATA__*/", "\n".join(data)),
    ("/*__JS__*/", ((root / "src/game.js").read_text(encoding="utf-8") + "\n" + (root / "src/bfantics.js").read_text(encoding="utf-8") + "\n" + (root / "src/story.js").read_text(encoding="utf-8")).replace("/*__TECHNIQUES__*/", (root / "src/techniques.js").read_text(encoding="utf-8")).replace("/*__CINEMATICS__*/", (root / "src/cinematics.js").read_text(encoding="utf-8")).replace("/*__TACTICS__*/", (root / "src/tactics.js").read_text(encoding="utf-8")).replace("/*__ULTIMATE_PERFORMANCE__*/", (root / "src/ultimate-performance.js").read_text(encoding="utf-8")).replace("/*__ULTIMATE_SCREEN__*/", (root / "src/ultimate-screen.js").read_text(encoding="utf-8")).replace("/*__ULTIMATES__*/", (root / "src/ultimates.js").read_text(encoding="utf-8")).replace("/*__EXPANSION__*/", (root / "src/expansion.js").read_text(encoding="utf-8")).replace("/*__ANTICS__*/", (root / "src/antics.js").read_text(encoding="utf-8")).replace("/*__ARENA__*/", (root / "src/arena.js").read_text(encoding="utf-8")).replace("/*__COMPLETE__*/", complete_players+"\n"+(root/"src/complete.js").read_text(encoding="utf-8")).strip()),
):
    if out.count(mark) != 1:
        sys.exit(f"template must contain {mark} exactly once")
    out = out.replace(mark, text)

# loading-screen art (small WebP files kept in the repo)
for mark, name in (("__LOADER_BG__", "bg.webp"), ("__LOADER_LINEUP__", "lineup.webp"), ("__LOADER_CROWD__", "crowd.webp")):
    out = out.replace(mark, "data:image/webp;base64," + base64.b64encode((root / "assets/loading" / name).read_bytes()).decode("ascii"))
# fonts (OFL / Apache, see assets/fonts) and the coffee QR
for mark, path, mime in (("__FONT_BANGERS__", "assets/fonts/bangers.woff2", "font/woff2"), ("__FONT_MARKER__", "assets/fonts/permanent-marker.woff2", "font/woff2"), ("__COFFEE_QR__", "assets/coffee/qr.png", "image/png")):
    out = out.replace(mark, "data:" + mime + ";base64," + base64.b64encode((root / path).read_bytes()).decode("ascii"))

# ---------- web build: assets as separate cacheable files ----------
# The page itself stays small (code + frame data). Every embedded image, font and music track is written to
# a/<content-hash>.<ext> and referenced by URL, so the browser downloads them in parallel, only when needed
# (music, cutscene sheets and gag clips load on first use) and caches them for the next visit.
# Heavy PNG sprite sheets are re-encoded as WebP. "python3 build.py --single" keeps the old one-file build.
if "--single" not in sys.argv:
    from PIL import Image
    adir = root / "a"
    if adir.exists():
        shutil.rmtree(adir)
    adir.mkdir()
    ext = {"image/webp": "webp", "image/png": "png", "image/jpeg": "jpg", "audio/ogg": "ogg", "audio/mpeg": "mp3", "font/woff2": "woff2"}
    seen = {}
    def externalize(m):
        mime, b64 = m.group(1), m.group(2)
        if len(b64) < 6000 or mime not in ext:
            return m.group(0)
        if b64 in seen:
            return seen[b64]
        raw = base64.b64decode(b64)
        if mime == "image/png" and len(raw) > 150000:
            buf = io.BytesIO()
            Image.open(io.BytesIO(raw)).save(buf, "WEBP", quality=90, alpha_quality=100, method=5)
            if buf.tell() < len(raw) * .8:
                raw, mime = buf.getvalue(), "image/webp"
        name = "a/" + hashlib.sha1(raw).hexdigest()[:14] + "." + ext[mime]
        (root / name).write_bytes(raw)
        seen[b64] = name
        return name
    out = re.sub(r"data:([a-z]+/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)", externalize, out)
    total = sum(p.stat().st_size for p in adir.iterdir())
    print(f"assets: {len(list(adir.iterdir()))} files, {total / 1e6:.1f} MB")

(root / "index.html").write_text(out, encoding="utf-8")
print(f"index.html written ({len(out) / 1e6:.1f} MB)")
