"""Embed Antics Vol. 2 into a separate copy of the original Ring Brawlers HTML."""
import argparse
import base64
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('game', type=Path, help='Path to the original ring_brawlers.html')
args = parser.parse_args()
source = args.game.read_text(encoding='utf-8')
if 'const ringAntics = ' in source:
    raise SystemExit('This game already has the Antics Vol. 2 patch.')

base = ROOT / 'assets' / 'antics_vol2'
manifest = json.loads((base / 'manifest.json').read_text(encoding='utf-8'))
embedded = {
    name: 'data:image/png;base64,' + base64.b64encode((base / clip['png']).read_bytes()).decode()
    for name, clip in manifest['animations'].items()
}
runtime = (ROOT / 'antics-player.js').read_text(encoding='utf-8')
data = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'))
uris = json.dumps(embedded, separators=(',', ':'))
boot = f'\n{runtime}\nconst ringAntics = createRingAntics({data}, "", {uris});\n'
replacements = [
    ("function startRound(){", "function startRound(){ringAntics.reset();if(!reduced)ringAntics.event(round===1?'rival_intro':'round_reset');"),
    ("function step(dt){clock+=dt;", "function step(dt){ringAntics.step(dt,{ambient:phase==='fight',idle:phase==='fight'&&P1.st==='idle'&&P2.st==='idle',reducedMotion:reduced});clock+=dt;"),
    ("if(P1){for(const g of ghosts)", "if(P1){ringAntics.draw(ctx,'back',W,H,GY);for(const g of ghosts)"),
    ("ctx.restore();if(!P1)return;hud(P1,false);", "ctx.restore();if(!P1)return;ringAntics.draw(ctx,'overlay',W,H,GY);hud(P1,false);"),
    ("if(d.counter>0&&!at.isCounter){", "if(d.counter>0&&!at.isCounter){if(!reduced)ringAntics.event('counter_success');"),
    ("a.comboTime=1.15;if(a.human)", "a.comboTime=1.15;if(!reduced){if(a.combo===3)ringAntics.event('combo_three');else if(dmg>=13)ringAntics.event('heavy_bar_landed');}if(a.human)"),
    ("let draw=P1.hp===P2.hp;", "let draw=P1.hp===P2.hp;if(!reduced){ringAntics.event(draw?'judges_reveal':'round_win');if(!draw)ringAntics.event('round_end');}"),
    ("let last=performance.now(),accumulator=0;", boot + "\nlet last=performance.now(),accumulator=0;"),
]
for before, _ in replacements:
    if source.count(before) != 1:
        raise SystemExit('Unsupported game version. Use the manual install steps in START_HERE.md. No files changed.')
for before, after in replacements:
    source = source.replace(before, after, 1)
out = args.game.with_name(args.game.stem + '_antics.html')
try:
    with out.open('x', encoding='utf-8') as f:
        f.write(source)
except FileExistsError:
    raise SystemExit(f'Output already exists: {out}. Rename it before running again.')
print(out)
