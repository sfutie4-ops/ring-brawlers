# AGENTS.md — working on FliptapWars

Read this before changing anything. It applies to every AI coding agent (ChatGPT Codex, Claude Code, …) and to people.

FliptapWars is a free, unofficial, fan-made browser fighting game (a tribute to Filipino battle rap).
Live site: https://sfutie4-ops.github.io/ring-brawlers/ — one HTML page plus an `a/` folder of art and music.

## How the game is put together

`python3 build.py` (Python 3 + Pillow) assembles the game:

| Input | What it is |
|---|---|
| `src/template.html` | page markup: loader, menu, pause, result, modals, phone controls |
| `src/style.css` + `src/theme.css` | base styles + the FliptapWars street theme (colours/fonts as CSS variables in `theme.css`) |
| `src/game.js` | the engine: input, commands, physics, combat, camera, drawing, HUD, boot/loading, menu cards |
| `src/story.js` | story mode, boss, trophy, rankings, comment wall, patrons, suggestion box, menu side boards |
| `src/bfantics.js` | story antics (stickers, crowd reactions, stagehand) and cutscene captions |
| `src/antics.js`, `src/complete.js` | Complete Edition skits, finale cutscenes, crowd stands, sock cutaway + cat attack, music |
| `src/arena.js`, `src/tactics.js`, `src/techniques.js`, `src/ultimates.js`, `src/ultimate-*.js`, `src/cinematics.js`, `src/expansion.js` | arenas/props, defence & status effects, fighter skills, ultimates, sprite frame selection, extra moves |
| `src/base-art.js` | **generated art seed (19 MB). Never edit by hand.** |
| `assets/`, `addons/` | art, fonts, the GCash QR (`assets/coffee/qr.png`), CC0 music (`addons/complete/bgm/`) |

Output: `index.html` (~1 MB) and `a/<hash>.<ext>` files. **Both are generated and git-ignored: never edit them, never commit them.**
`python3 build.py --single` makes an old-style one-file build (~70 MB) for offline use.

The page loads in two stages (see `menuArt()` / `fightArt()` in `game.js`): fighter sheets + arenas first (menu opens), everything else in the background. New art needed before the menu goes in `menuArt()`, art needed only in fights goes in `fightArt()` or loads on first use.

## Check your change

```
python3 build.py
python3 scripts/check_site.py      # scripts parse, every a/ file exists, page stays small
node tests/site-smoke.cjs          # headless Chromium: all fighter cards, a full match to the result screen, phone pause
```
`site-smoke.cjs` needs `npm install --no-save playwright@1.63.0` and `npx playwright install chromium`.
(The other files in `tests/` are from the older 100-HP build and are not maintained.)

Also check phones: the game is played in landscape (about 915×412 CSS px); controls sit over the arena corners.

## Keeping it smooth (60–144 Hz)

- The simulation runs in fixed 120 Hz steps and drawing interpolates between them. Tie anything that spawns or moves to time (`dt`), never to the number of frames drawn.
- Nothing is built or decoded mid-fight. Cached art (skins, glows, silhouettes) is painted once on `artCanvas(w,h)` in `game.js`, and the match warm-up (`queueMatchWarmup()`) builds and decodes a match's art during the VS screen. New art a fight draws belongs in that warm-up.
- `node tests/perf-bench.cjs` (also `--gpu`, `--phone`) plays an AI match and prints frame times. Run it on `main` and on your branch when you touch drawing code.

## Publishing

- Work on a branch and open a pull request. The GitHub Action (`.github/workflows/publish.yml`) builds and tests every pull request.
- When a pull request is merged into `main`, the Action builds, tests and publishes to the `gh-pages` branch automatically. The site updates a minute or two later.
- Do not push to `gh-pages` yourself. If the Action is down, the owner (or an agent they ask) can run `scripts/publish_site.sh` after a build.
- `api-server/` (rankings, comments, patrons, suggestion inbox) is deployed separately on Vercel by the owner. Do not change it or `RANK_API` in `story.js` unless asked.

## New art (designs, sprite sheets)

New art arrives in `art-inbox/<kind>/…` with a same-name `.txt` note; folders, file names and the ChatGPT prompt are in `art-inbox/README.md`. Keep those names when the art moves into `assets/`/`addons/` (lowercase, hyphens, `-vN`). Uploads that don't follow the layout: ask the owner rather than guessing what they are.
To wire it in: slice it into the existing formats (fighter looks: `assets/redraw/<name>.webp` + `.json`, frames with
anchor `ax/ay` at the feet; gag clips: `addons/battlefield-antics/`; portraits: `assets/motion/lobby.webp`), hook it up in
`build.py` / the JS, build, run the checks, and look at it on desktop and phone. Leave the original upload in the inbox
until the change is merged, then delete it in the same pull request that wires it in.

## Rules that must not be broken

- **GCash:** donations go through the QR image only. Never put the owner's phone number, account name or any other personal detail in code, text, comments or commit messages.
- **Secrets:** the admin key, tokens and API keys never go in the repo.
- **Fan-made status:** keep the "unofficial fan-made" notices (loader, menu, About). No official FlipTop logos, footage, audio or lyrics.
- **Music:** only tracks with a clear free licence (CC0). Record the source in `addons/complete/bgm/BGM_SOURCES.md`.
- **Nothing random on screen:** every gag, sticker or cutscene must be caused by something the player can see (see `BF_BEATS` in `bfantics.js` and the reason lines in `antics.js`).
- **Keep what players rely on:** phone controls (stick + ✕ ○ □ △ L1 L2), command list, story mode, rankings/patrons/comments boards, the street theme, landscape lock.

## Game numbers worth knowing

Canvas 960×540, floor `GY=470`, `MAX_HP=200`, one round of 120 s (`MATCH_SECONDS`), 14 fighters in roster order
Loonie, Abra, Shehyee, Batas, Smugglaz, Aklas, Zaito, Apekz, Sinio, Dello, Tipsy D, BLKD, Badang, Target.
Score per story stage = (1000 + HP×15 + time×10 + best combo×150) × 2 for the boss.
