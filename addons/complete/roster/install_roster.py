"""Create an offline Ring Brawlers copy with the five new fighters."""

import argparse
import base64
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

def replace_once(html, marker, replacement):
    if html.count(marker) != 1:
        raise ValueError(f"Unsupported game build; expected one {marker[:70]!r} anchor.")
    return html.replace(marker, replacement, 1)

def fighter_data(key, fighter, data):
    sheet = data["sheets"][key + "_combat"]
    frames = []
    for frame in sheet["frames"]:
        x, y, w, h = frame["rect"]
        ax, ay = frame["pivot"]
        bx, by, bw, bh = frame["bounds"]
        frames.append(dict(x=x,y=y,w=w,h=h,ax=ax,ay=ay,bounds=dict(x=bx,y=by,w=bw,h=bh)))

    def action(offset):
        return [offset,offset,offset+1,offset+2,offset+2,offset+3]

    img = base64.b64encode((HERE / sheet["file"]).read_bytes()).decode("ascii")
    character = dict(
        name=fighter["name"], scale=sheet["legacyScale"], portraitRevision=True, frames=frames,
        animations=dict(idle=[0,1,2,3],walk=[0,1,2,3],punch=action(4),kick=action(4),
                        upper=action(8),wave=action(12),sp=action(16),dash=[5],
                        jump=[1,2],block=[0],hit=[20],airborne=[21],down=[22],win=[23]),
        img="data:image/png;base64,"+img,
    )
    if key == "badang":
        character["animations"]["win"] = data["clips"][fighter["animationMap"]["round_win"]]["frames"]
    if key == "target":
        character["portraitRevision"] = False
        character["animations"].update(hit=[0],airborne=[1],down=[0],win=[3],
                                       sp=data["clips"][fighter["controls"]["sp"]]["frames"])
    return character

def add_badang_hooks(html):
    patches = [
        ("if(move==='upper'){f.vx=f.face*260;", "if(move==='upper'){f.vx=f.face*(a.lunge??260);"),
        ("if(f.st==='upper'&&!a.counter)f.air=", "if(f.st==='upper'&&!a.counter&&!a.grounded)f.air="),
        ("if(at.kind==='upper'&&!armored){", "if(at.kind==='upper'&&!armored&&!at.grounded){"),
        ("if(st==='walk'||st==='idle'&&frames.length>1)",
         "if(st==='win'&&f.ci===badangIndex)index=reduced?3:f.t>=.48?3:f.t>=.32?2:f.t>=.18?1:0;else if(st==='walk'||st==='idle'&&frames.length>1)"),
        ("let times=f.ci===6&&st==='sp'?", "let times=f.ci===badangIndex&&st==='upper'?[0,.065,.12,.16,.29,.40]:f.ci===6&&st==='sp'?"),
        ("winner.st='win';winner.t=0;",
         "winner.st='win';winner.t=0;if(winner.ci===badangIndex){winner.face=1;winner.air=0;winner.prevAir=0;}"),
        ("else if(s.path==='fan')s.y=s.originY+(s.lane-1)*s.t*90;",
         "else if(s.path==='fan')s.y=s.originY+(s.lane-1)*s.t*90;else if(s.path==='papaya')s.y=s.originY-57*Math.sin(Math.min(1,s.t/.85)*Math.PI);"),
        ("s.life=0;effect(1,s.x,s.y,100,s.face)", "s.life=0;if(s.path==='papaya')effect('papaya_splat',s.x,s.y,110,s.face,.32);else effect(1,s.x,s.y,100,s.face)"),
        ("if(hit(f,o,a))f.hit=true", "if(hit(f,o,a)){f.hit=true;if(a.sneaky)effect('sneaky_hands',o.x-f.face*25,GY-o.air-85,95,f.face,.18)}"),
        ("<h2 id=\"resultTitle\"></h2>", "<h2 id=\"resultTitle\"></h2><canvas id=\"badangResult\" width=\"300\" height=\"225\" role=\"img\" aria-label=\"Badang's victory pose with his water bottle\"></canvas>"),
        ("$('result').style.display='flex';clearInput()", "showBadangResult();$('result').style.display='flex';clearInput()"),
        ("drawFX(2,Math.floor(s.t*18)%6,s.x,s.y,s.at.rapid?80:110,s.face,1,0,s.color);drawSkillGlyph(s)",
         "if(s.path==='papaya')drawBadangProp(badangProps.papayaFlight[Math.floor(s.t*8)%2],s.x,s.y,101,s.face,1,Math.sin(s.t*10)*.28);else{drawFX(2,Math.floor(s.t*18)%6,s.x,s.y,s.at.rapid?80:110,s.face,1,0,s.color);drawSkillGlyph(s)}"),
        ("ctx.fillRect(0,210,W,95);text(msg,480,273,", "const badangWin=phase==='ko'&&[P1,P2].some(f=>f.ci===badangIndex&&f.st==='win');ctx.fillRect(0,badangWin?129:210,W,badangWin?64:95);text(msg,480,badangWin?174:273,"),
    ]
    for anchor,replacement in patches:
        html = replace_once(html,anchor,replacement)
    helpers = """
function drawBadangProp(index,x,y,size,face,alpha=1,angle=0){
  const frame=CH[badangIndex].frames[index];
  const scale=size/(frame.scale*Math.max(frame.bounds.w,frame.bounds.h));
  drawSprite(frame,x,y,face,alpha,false,scale,scale,angle);
}
function showBadangResult(){
  const canvas=$('badangResult');
  const won=[P1,P2].some(f=>f.ci===badangIndex&&f.wins>=2);
  canvas.style.display=won?'block':'none';
  if(!won)return;
  const frames=CH[badangIndex].f.win, fr=frames[frames.length-1], b=fr.bounds;
  const g=canvas.getContext('2d'), s=Math.min((canvas.width-8)/b.w,(canvas.height-8)/b.h);
  g.clearRect(0,0,canvas.width,canvas.height);
  g.drawImage(fr.im,fr.x+b.x,fr.y+b.y,b.w,b.h,(canvas.width-b.w*s)/2,
    (canvas.height-b.h*s)/2,b.w*s,b.h*s);
}
"""
    html = replace_once(html,"function drawFX(",helpers+"\nfunction drawFX(")
    return replace_once(html, "if(!fxImage)return;ctx.save();ctx.translate(x,y);ctx.scale(face,1);",
        "if(row==='papaya_splat'||row==='sneaky_hands'){drawBadangProp(row==='papaya_splat'?badangProps.papayaSplat:badangProps.sneakyHands,x,y,size,face,alpha);return;}if(!fxImage)return;ctx.save();ctx.translate(x,y);ctx.scale(face,1);")

def install(source):
    html = source.read_text(encoding="utf-8")
    data = json.loads((HERE/"manifest.json").read_text(encoding="utf-8"))
    atlases, roster, ids = [], [], []
    adjustments = {
        "dello":"m.upper.counter=true;m.wave.volley=volley([.24,.34],[7,6],'straight',500);m.wave.volley[1].speed=395;m.sp.reach=200;",
        "tipsy_d":"m.upper.counter=true;m.wave.volley=volley([.24,.32,.40],[4.8,4.8,5]);m.sp.volley=volley([.25,.36,.47,.58],[5,6,7,9]);m.sp.lunge=0;",
        "blkd":"m.wave.mark='angle';m.wave.slow=.65;m.upper.breakMarked=true;m.upper.consumeMarked=true;m.sp.breakMarked=true;m.sp.consumeMarked=true;m.sp.reach=215;",
        "badang":("Object.assign(m.upper,{dur:.51,hit:.16,end:.29,reach:125,dmg:12,kb:190,lunge:430,guardBreak:true,grounded:true,sneaky:true});"
                  "m.wave.volley=volley([.24],18,'papaya',365);m.sp.guardBreak=true;m.sp.dmg=29;m.sp.lunge=420;"),
        "target":("Object.assign(m.upper,{lunge:475,reach:157,grounded:true,breakMarked:true,consumeMarked:true});"
                  "m.wave.volley=volley([.24],12,'straight',570);m.wave.mark='angle';"
                  "m.sp.volley=volley([.25,.40,.56],[7,9,13],'straight',520);m.sp.lunge=0;"),
    }
    passives = {
        "dello":"Rebuttal King can answer an incoming hit.",
        "tipsy_d":"Quick Rebuttal can answer an incoming hit.",
        "blkd":"Blueprint Bars marks the opponent. Angle Break cashes in that mark.",
        "badang":"Can open a guard with a quick grounded feint.",
        "target":"Mark a rival with Lock-On Bar, then rush in with Pressure Step.",
    }
    for key,fighter in data["fighters"].items():
        # These characters are new to the standalone nine-fighter release.
        ids.append(key)
        atlases.append(fighter_data(key,fighter,data))
        control = fighter["controls"]
        power1,power2,super_move = (data["clips"][control[slot]] for slot in ("upper","wave","sp"))
        roster.append(dict(
            fighter["game"],name=fighter["name"],upper=power1["name"],
            wave=power2["name"],super=super_move["name"],passive=passives[key],
            detail=(f"{power1['name']} pops guards up close. {power2['name']} lobs a large papaya."
                    if key=="badang" else f"{power1['name']}, {power2['name']} and {super_move['name']}."),
        ))
        if control["upper"]!=fighter["loadout"][0]:
            a = atlases[-1]["animations"]
            a["upper"],a["wave"] = a["wave"],a["upper"]

    if "const rosterRefreshStart=" in html:
        raise ValueError("This HTML already contains the roster refresh.")

    html = replace_once(html, "NINE EMCEES • ONE RING", "FOURTEEN EMCEES • ONE RING")
    anchor = "const COL=ROSTER.map"
    additions = "const rosterRefreshStart=ROSTER.length;\n"
    additions += f"const badangIndex=rosterRefreshStart+{ids.index('badang')},badangProps={json.dumps(data['fighters']['badang']['props'])};\n"
    additions += f"ROSTER.push(...{json.dumps(roster)});\nCH.push(...{json.dumps(atlases)});\n"
    html = replace_once(html,anchor,additions+anchor)
    marker = "function moveData(f,move=f.st)"
    setup = "\n".join("{const m=MOVES[rosterRefreshStart+"+str(i)+"];"+adjustments[key]+"}" for i,key in enumerate(ids))
    html = replace_once(html,marker,setup+"\n"+marker)
    html = replace_once(html, "if(f.ci===6){f.counter=.34;", "if(a.counter){f.counter=.34;")
    html = replace_once(html, "if(st==='walk')index=Math.floor(f.t*10)%frames.length;",
                        "if(st==='walk'||st==='idle'&&frames.length>1)index=Math.floor((st==='idle'?clock:f.t)*(st==='idle'?6:10))%frames.length;")
    html = replace_once(html, "if(a.ci===2&&at.kind==='sp'&&d.angle>0)",
                        "if(((a.ci===2&&at.kind==='sp')||at.consumeMarked)&&d.angle>0)")
    html = replace_once(html, "let frames=F[st]||F.idle,index=0;",
                        "let frames=st==='hit'&&f.air>0&&F.airborne?F.airborne:F[st]||F.idle,index=0;")
    html = replace_once(html, "if(f.st==='down'){const t=ease(f.t/.36);",
                        "if(f.st==='down'&&!CH[f.ci].portraitRevision){const t=ease(f.t/.36);")
    html = replace_once(html, "216 caricature frames", "'+CH.reduce((n,c)=>n+c.frames.length,0)+' caricature frames")
    html = add_badang_hooks(html)
    html = replace_once(html, ":f.ci===6&&st==='sp'?",
                        ":CH[f.ci].name==='Target'&&st==='sp'?[0,.07,.14,.25,.35,.43,.56,.69]:f.ci===6&&st==='sp'?")
    html = replace_once(html, "</style>", """
#menu{align-items:safe center}
#badangResult{display:none;width:auto;height:min(28vh,170px);max-width:100%;margin:4px auto}
@media (min-width:761px) and (orientation:landscape){#cards{grid-template-columns:repeat(7,minmax(0,1fr));gap:7px}#cards .card canvas{height:clamp(40px,16vh,110px);object-fit:contain}}
</style>""")
    output = source.with_name(f"{source.stem}_badang_edition.html")
    with output.open("x",encoding="utf-8") as f:
        f.write(html)
    return output

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("game", type=Path, help="Original standalone Ring Brawlers HTML or its Antics copy")
    args = parser.parse_args()
    try:
        print(install(args.game))
    except (OSError,ValueError) as e:
        parser.exit(1, f"{e}\n")
