"""Add the animated spectator layer to the offline Badang Edition."""

import argparse
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent

def replace_once(html, anchor, replacement):
    if html.count(anchor) != 1:
        raise ValueError(f"Unsupported build: expected one {anchor[:75]!r} marker.")
    return html.replace(anchor,replacement,1)

def install(path):
    html = path.read_text(encoding="utf-8")
    if "function createBackgroundStands(" in html:
        raise ValueError("This edition already includes the animated stands.")
    if "const badangIndex=" not in html:
        raise ValueError("Use the standalone HTML from FlipTop Badang Signature Edition.")

    source = (ROOT/"background-stands.js").read_text(encoding="utf-8")
    frames = json.loads((ROOT/"assets/stands-atlas.json").read_text(encoding="utf-8"))
    texture = base64.b64encode((ROOT/"assets/stands-atlas.png").read_bytes()).decode("ascii")
    anchor = "let last=performance.now(),accumulator=0;"
    html = replace_once(html,anchor,source + f"""
const standTexture = new Image();
standTexture.src = 'data:image/png;base64,{texture}';
const stands = createBackgroundStands(CH, standTexture, {json.dumps(frames,separators=(',',':'))});
let standStart=0, standFighters=[];
""" + anchor)
    anchor = "function newMatch(same){if(!ready)return;"
    html = replace_once(html,anchor,anchor+"standStart=clock;")
    anchor = "P2=mk(enemy,660,-1,false);"
    html = replace_once(html,anchor,anchor+"standFighters=[CH[P1.ci].name,CH[P2.ci].name];")
    anchor = "if(P1){for(const g of ghosts)"
    if "ringAntics.draw(ctx,'back',W,H,GY)" in html:
        anchor = "if(P1){ringAntics.draw(ctx,'back',W,H,GY);for(const g of ghosts)"
    call = "stands.draw(ctx,{width:W,height:H,time:Math.max(0,clock-standStart),excluded:standFighters,reducedMotion:reduced});"
    html = replace_once(html,anchor,anchor.replace("for(const g of ghosts",call+"for(const g of ghosts"))
    # The cutout sprites are cosmetic; use the base game if they are still decoding.
    output = path.with_name(path.stem+"_live_stands.html")
    with output.open("x",encoding="utf-8") as stream:
        stream.write(html)
    return output

if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("game",type=Path)
    args = cli.parse_args()
    try:
        print(install(args.game))
    except (OSError,ValueError) as err:
        cli.exit(1,f"{err}\n")
