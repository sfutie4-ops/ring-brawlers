"""Pack the Complete Edition assets into the standalone game."""
import base64
import json
from pathlib import Path

BASE_FIGHTERS = 9


def _read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def _url(path):
    mime = {".png": "image/png", ".webp": "image/webp",
            ".ogg": "audio/ogg", ".mp3": "audio/mpeg"}[path.suffix]
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode("ascii")


def _fighters(assets, redraw):
    data = _read(assets / "roster/manifest.json")
    characters, stats = [], []
    for key, fighter in data["fighters"].items():
        sheet = data["sheets"][key + "_combat"]
        frames = []
        for frame in sheet["frames"]:
            x, y, w, h = frame["rect"]
            ax, ay = frame["pivot"]
            bx, by, bw, bh = frame["bounds"]
            frames.append(dict(x=x,y=y,w=w,h=h,ax=ax,ay=ay,bounds=dict(x=bx,y=by,w=bw,h=bh)))

        def clip(action, fallback):
            clip_id = fighter["animationMap"].get(action)
            return data["clips"][clip_id]["frames"] if clip_id else fallback

        def action(indices):
            first, windup, impact, recover = indices
            return [first, first, windup, impact, impact, recover]

        idle = clip("idle", [0, 1, 2, 3])
        basic = action(clip("basic_strike", [4, 5, 6, 7]))
        controls = {k:data["clips"][v] for k,v in fighter["controls"].items()}
        animations = dict(idle=idle,walk=idle,punch=basic,kick=basic,
                          upper=action(controls["upper"]["frames"]),
                          wave=action(controls["wave"]["frames"]),
                          sp=controls["sp"]["frames"],dash=[5],jump=[1,2],
                          block=[0],hit=clip("hit", [0]),airborne=clip("airborne", [1]),
                          down=clip("down", [0]),win=clip("match_win", [3]))
        animations.update(rise=animations["upper"],slide=[0,5,5,6,7,0],
                          dive=basic,evade=[0,5,5,1,2,0],power=animations["wave"])
        characters.append(dict(id=key,name=fighter["name"],scale=sheet["legacyScale"],
                               frames=frames,animations=animations,img="" if (redraw/(key+".webp")).exists()
                               else _url(assets/"roster"/sheet["file"])))
        stats.append(dict(fighter["game"],id=key,name=fighter["name"],props=fighter.get("props"),
                          **{k:controls[k]["name"] for k in ("upper","wave","sp")}))
    return characters, stats


def load_complete(root):
    local = root / "addons/complete"
    assets = local if local.is_dir() else root.parent / "assets"
    audio = local / "bgm" if local.is_dir() else root.parent / "optional/bgm"
    fighters, stats = _fighters(assets, root/"assets/redraw")
    scenes = _read(assets / "scenes/manifest.json")
    vfx = _read(assets / "vfx/manifest.json")
    sources = {f"{group}/{key}":_url(assets/folder/record["file"])
               for group, folder, records in (("scene","scenes",scenes["sheets"]),("vfx","vfx",vfx))
               for key, record in records.items()}
    arena = assets / "arena/assets/antics_vol2"
    antics = _read(arena / "manifest.json")
    music = {title:_url(audio/file) for title,file in [
        ("Offline","Offline.ogg"),("Try Me","Try_Me.ogg")]}  # CC0 tracks only, see addons/complete/bgm/BGM_SOURCES.md
    data = dict(stats=stats,scenes=scenes,vfx=vfx,sources=sources,antics=antics,music=music,
                anticImages={key:_url(arena/clip["png"]) for key,clip in antics["animations"].items()},
                stands=_read(assets/"stands/assets/stands-atlas.json"),
                standsImage=_url(assets/"stands/assets/stands-atlas.png"))
    scripts = "\n".join((assets/path).read_text(encoding="utf-8") for path in (
        "arena/antics-player.js","stands/background-stands.js","featured.js"))
    return fighters, data, scripts
