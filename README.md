# FliptapWars

**Unofficial fan-made game.** FliptapWars is a free, non-commercial tribute to Filipino battle rap culture. It is not affiliated with, endorsed by or sponsored by FlipTop Battle League, Uprising Records or any emcee shown. Characters are caricatures; all moves, stats and storylines are fictional. The optional "buy me a coffee" only supports development; nothing in the game is sold. Rights holders can request changes or removal through the in-game suggestion box or this repository's issues.

Play online at https://sfutie4-ops.github.io/ring-brawlers/ — or run `python3 build.py` and open the generated `index.html`.

Working on the code (people or AI agents such as ChatGPT Codex / Claude Code): read [AGENTS.md](AGENTS.md). Merges to `main` are built, tested and published automatically.

## Controls

| PC | Phone | Action |
|---|---|---|
| A / D or ← → | stick | move |
| S / ↓ | stick ▼ | crouch |
| W / ↑ | stick ▲ | "up" for commands |
| Space | ✕ | jump |
| J | □ | punch |
| K | △ | kick |
| L | ○ | signature power (hold for charged) |
| hold Q | L1 | charge mana |
| E | L2 | ultimate |
| hold back | hold stick away | block (tap just before a hit to parry) |
| Esc | ❚❚ | pause (Settings has the command list, how to play, sound and the coffee button) |

Commands (→ = toward the opponent): double-tap → / ← dash (free, 2 s cooldown) · ← ↑ + punch uppercut (free, 2 s cooldown) · ↓ → + punch wave · ↓ ↑ + punch rising strike · ↓ ↓ + punch fighter skill · ↓ → + kick slide · ↓ ← + kick dive · ↓ ↓ + kick evade.

## Latest changes

- **Story mode**: six fights from easy to hard, ending with **Golden Loonie** (gold glow, honeycomb shield that soaks 75% of each hit until it breaks, +18% damage). Boss rules only apply in story mode.
- **Defeat countdown**: 10 → 0 to REMATCH or CHOOSE FIGHTER (−750 per retry) while the boss and Anygma laugh; at 0 you return to the menu and can post your run.
- **ISABUHAY CHAMPION** trophy screen and a trophy badge on the menu (counted per device).
- **Public rankings + comment wall** (anyone can read them). Score per stage = 1000 + HP left ×30 + time left ×20 + best combo ×150 (boss ×2), +5000 champion bonus, −750 per retry. Names/comments are length-limited, swear-filtered and links are stripped; one post per device every 2 minutes (checked in the game and on the server).
- Backend: `api-server/` (Vercel function + Vercel Blob) deployed as `fliptapwars-api`. **Moderation**: open the game with `#admin` at the end of the URL, open Rankings, and tap ✕ on an entry; the admin key is the `ADMIN_KEY` environment variable in the Vercel project.

- **Street theme across every screen**: ink panels, hard drop shadows, spray-paint strokes, stickers and tape, Bangers + Permanent Marker fonts (OFL / Apache, in `assets/fonts`). Animated logo, trading-card fighter select with P1 sticker, taped arena posters, slam-in panels, game-style toggles in Settings, compact move card on Pause.
- **Buy me a coffee** now uses the GCash / InstaPay QR (`assets/coffee/qr.png`, regenerated from the original code, verified to scan to the same payment code). SAVE QR makes a FliptapWars-styled poster to upload in GCash; no account number is stored in the game anymore.
- **Suggestion box**: sticker-style categories, star pops, mic-drop send animation and a SALAMAT stamp.

- Loading screen built from the real game sprites (lineup in `assets/loading/`, regenerated from the sheets), with rain, floodlights, crowd, live load progress and rotating tips; tap or press a key to enter.
- White halo and leftover background removed from fighter sheets (most visible on Zaito's idle frames, also the Liberty statue, Lotus Smash and stray specks on the move sheets).
- Lighting: cast shadows, arena-coloured rim light from the two light sources, ambient grade, floor glow under hits and projectiles.
- Sound: new synth engine with compressor and room reverb; layered punches, kicks, blocks, whooshes, round bell, crowd cheers and arena ambience (rain, foundry hum, crowd). Sound is on by default and starts on the first tap.

- Renamed to **FliptapWars**, with fan-made badges, a first-visit notice and an About page.
- Suggestion box (menu corner and Settings): category, star rating, nickname, message. It opens a prefilled issue on this repository (posting needs a free GitHub account). To accept suggestions without a GitHub account, create a Google Form and set `SUGGEST_FORM` in `src/game.js`.

- Training mode removed. Command list, How to play and Sound are in Settings only.
- Animated command list: each input lights up in order; names follow the selected fighter.
- Performance: the HUD face portrait is baked once per expression (was the most expensive draw call), dynamic resolution steps sharpness down on slow devices, phones start at 1.5x.

## Earlier merge

The new art package (priest Loonie, renewed Abra, replacement Shehyee / Smugglaz / Apekz sheets, ink sheets for Batas, Aklas and Sinio, Cerberus, Third Eye, Axe of Law, Lotus Smash, Triple Timer clones, Anygma referee, facial expressions, comic effects) was merged with a three-way merge onto the existing controller, commands, cooldowns, block, floor damage, crates, effects and menus. Blocking now uses the dedicated block pose from the new sheets for every fighter except Zaito.

Tested in headless Chromium: all keyboard commands, phone stick/buttons in landscape and portrait, control fading, block, a full match to the result card, all nine fighters' block poses and two ultimates. No errors. Not tested on a real phone.

---

# Ring Brawlers — Mana Edition

Play online at https://sfutie4-ops.github.io/ring-brawlers/ — or run `python3 build.py` and open the generated `index.html`.

Working on the code (people or AI agents such as ChatGPT Codex / Claude Code): read [AGENTS.md](AGENTS.md). Merges to `main` are built, tested and published automatically.

## Port notes (this release)

The mana edition (new moves, fighter skills, cinematic ultimates, mana charge, crouch, statuses, generated arenas) is the base. Carried over from the previous release:

- **Phone gamepad:** floating thumb stick (◀ ▶ move, ▲ jump, ▼ crouch, hold away to block) and round buttons. Right thumb: PUNCH in the corner, Kick, Upper, Wave, Ultimate, then Dash, Evade, fighter Skill, Power (hold for charged) and Charge on the outer ring. Rise, Slide and Dive sit above the stick. Skill buttons show a mana-fill ring.
- **Effects:** comic hit words, lightning, energy orbs into the mana bar, health-bar chips, crowd shouts, impact frames on parries and K.O.s.
- **UI:** VS splash, YOU marker, difficulty buttons, Settings and How to play panels, result card with grade and stats.
- **Settings:** swap button sides, button size, see-through buttons, comic pops.

Tested in headless Chromium on desktop and phone sizes (800×360, 360×740): no errors; stick move/jump/crouch, punch while moving, no overlapping or off-screen buttons, full match to the result card. Not tested on a real phone.

# Fighter-specific skills

Press **G** or tap the named skill button. Each fighter has a four-frame action with its own timing and mana cost.

| Fighter | Skill | Mana | Effect |
| --- | --- | ---: | --- |
| Loonie | End Rhyme | 24 | A clean opening palm unlocks a heavier second hit. |
| Abra | Mirage Cross | 29 | Cross behind a nearby opponent and strike back across the gap. |
| Shehyee | Angle Tax | 23 | Spend an Angle Mark on a clean jab to steal up to 16 mana. |
| Batas | Iron Wall | 26 | Plant a barricade that absorbs one hostile shot before it shatters. |
| Smugglaz | Ricochet Relay | 27 | Fire backward and arm the shot when it rebounds off the arena edge. |
| Aklas | Rift Snare | 28 | Set a floor rune that damages and roots a grounded opponent after a brief arming delay. |
| Zaito | Backtalk | 22 | Redirect an incoming shot toward its caster during a short timing window. |
| Apekz | Glacier Hook | 30 | Pull a struck opponent closer so a follow-up can reach. |
| Sinio | Heckle | 30 | Lock an opponent's mana spending and charging for 1.65 seconds on a clean hit. |

The four original PNGs and runtime WebP atlases are in `assets/cinematics/` under `unique-early`, `unique-mid`, `unique-late` and `technique-effects`.

# Cinematic supers and fighter poses

Each super starts with a 2.4-second windup, plus a brief initial hit-stop. The opponent, projectiles and round timer run at 22% speed during the windup. Normal speed returns on the first hit or if the cast is interrupted.

Loonie prays, levitates with glowing gold eyes and delivers «Diin sa bigkas / Korona ang wakas», cuing his half-body guardian to bring the crown down on the final rhyme. Batas summons Lady Liberty, who opens a giant book at the target position. Jump or move clear before the clap. Aklas sniffs fictional dust, reacts with a dazed grin, and opens a black hole that pulls opponents in before the last pulse launches them.

Apekz climbs a generated mountain in Triple Meaning: Summit Kick. The camera tilts up with the climb, then follows him down as his kick lands and triggers two aftershocks. Zaito's existing shadow silhouette rises, swings and compresses at ground impact, timed to newly generated falling meteor, squash, splash and puddle sprites.

Hold **S** or **↓**, or use the touch **Crouch** button. Crouch lowers your stance below high shots. All nine fighters have their own crouch entry, low hold, grounded knockdown and get-up sprites. A new casting-expression sheet adds a second windup expression for every fighter.

Source PNGs and packed runtime sprites are in `assets/cinematics/` and `assets/expressions/`. Validation uses the 120 Hz combat simulation, loader checks and Native Canvas inspection of the choreographed casts. Live browser and phone play remain unverified.

---

# Full-screen ultimates

Each of the nine ultimates grades the arena during its windup and sends a different effect across the screen on impact. The screen patterns include Crown Smash's gold rays, Liberty Clap's folding page trails, Black Hole's inward spiral and Triple Timer's three cyan sweeps. Health, mana and the timer draw above the effects. Reduced motion softens the moving screen patterns.

Native Canvas checks covered all nine impacts and both screen edges. The suite also verified interrupted windups, round resets, damage and existing combat rules. Live browser and phone play remain unverified.

---

# Mana and status effects

- Hold **B** or **Charge** to build 28 mana per second after a short windup. Charging leaves you open to hits. Releasing or pressing a move has a brief recovery. At 100 mana, your fighter gains a golden aura and can spend all of it on an ultimate with **L**.
- Tap **Y** for the 45-mana signature. Hold **Y** for 0.55 seconds and release after the cue for the 60-mana charged signature. Below 60 mana, release uses the standard version if you have at least 45. Charged projectiles apply their bonus on the final projectile.
- **Slow** cuts walking speed. **Root** stops walking, jumps and movement attacks while allowing guard and stationary attacks. **Stun** locks actions briefly. **Freeze** holds the fighter in ice, and a clean follow-up breaks the ice for 5 extra base damage. Apekz can also freeze by landing two Chill waves in quick succession.
- Blocking and parrying stop statuses on attacks you can defend against. After a stun or freeze, temporary control resistance prevents another hard disable from immediately taking hold.
- Batas's standard Faultline can stun. Shehyee's Angle Mark and Aklas's Leftfield Orb can root. Charged signatures have fighter-specific bonuses described on the selection screen.
- Training starts with unlimited mana. Switch to **Training mana: normal** in Options to practice charge timing. Normal and hard CPU opponents can charge from range. Hard can hold for a charged signature.

The two generated 3 × 3 portrait sheets in `assets/expressions/` provide focused and recoiling expressions for all nine fighters. The interface switches portraits as fighters charge, cast, take a hit or enter a status. Charge, release and recovery have distinct movement, aura and impact cues.

Validation covered mana startup and recovery, interruption, fallback at low mana, charged projectile effects, status guards, freeze shatter, control resistance, round resets and all existing ultimate damage cases in the simulation. Live browser and phone play remain unverified.

---

# Generated combat expansion

Nine generated 6×6 sprite sheets provide 324 animation frames: five new actions and a new ultimate animation for every fighter. Artwork was generated before integration. Original PNG sheets and WebP runtime copies are in `assets/moves/`. Actual cell size is 209×209 pixels, with six frames per row. Rows: rising uppercut, slide kick, dive kick, evasive roll, signature power, ultimate. `src/expansion.js` contains move data and timing.

New controls: **Q** rising uppercut (25 energy), **E** slide kick (12), **R** dive kick (22), **T** evade (14), **Y** signature power (45). Existing U/I/L skills remain. On-screen buttons provide the same actions. New actions start from the ground; dive includes a short leap. Hold away to block and tap away just before impact to parry.

Signature mechanics: Loonie fires five golden bars; Abra rushes and slows; Shehyee marks and breaks a marked guard; Batas has armor and a guard-breaking ground strike; Smugglaz fires six fast shots; Aklas fires zigzag bursts and blink-evades; Zaito uses bouncing shots and a brief evade counter; Apekz builds setup for payoff with escalating shots; Sinio delivers a broad slowing sonic strike.

The ultimate and referee update adds 10 new generated sprite sheets. See [the fighter designs, damage and sources](assets/ultimates/README.md). The nine ultimates use distinct damage schedules and hit areas. Anygma opens and calls the rounds as referee. The previous six-frame ultimate art remains in the original expansion sheets for reference.

Validation: all generated frames load; 11 combat checks pass; 11,880 simulation steps exercise the original and expanded moves across all nine fighters. Loading retry recovery passes. Native Canvas frame inspection was used; live browser/device testing remains unverified. Some generated effects extend near cell boundaries, so slight animation variation is possible.

---

# Ring Brawlers — Aftershock Edition

Open `index.html` in a modern browser. Everything is embedded; no server, installation or network is needed to play. The nine original caricature fighters and their distinct moves are retained.

## Loading repair

The standalone file now uses compressed WebP atlas images (same pixel dimensions and frame rectangles) and is about 20 MB with all stages, fighter art, ultimate sheets and the referee embedded. The original PNG artwork stays in the source ZIP. Artwork loads sequentially with progress, a 20-second timeout per image and a retry action. Startup errors are shown on screen. Open the downloaded HTML directly in Chrome or Edge; a document preview may disable JavaScript.

To repack artwork, install Pillow and run `python3 scripts/optimize_art.py`, then `python3 build.py`. Ordinary code-only rebuilds still need just Python.

## Generated arena update

All three arenas now use generated, hand-painted comic-style raster artwork as the actual environment and floor. The old procedural arena drawings have been removed. Arena selection previews use those same images. The generated PNG originals, compressed WebP assets and generation prompts are in `assets/arenas/`. WebP copies retain the original 1672 × 941 dimensions. The build embeds these assets in the HTML so gameplay has no network dependency. Rain, smoke, impact effects, destructible props and damage remain interactive overlays.

## What's new

- Three selectable arenas: Neon Rooftop (rain, puddles, reflected fighters and splashes), Foundry District (furnace lighting and drifting pipe smoke), and Championship (illustrated crowd, ropes and spotlights with animated camera flashes).
- 48 additional effects frames in `assets/aftershock_fx_atlas.png`: smoke, splash, wind, impact, parry and cracks. The exact deterministic atlas is also built in memory by the game, so the standalone HTML works offline.
- Persistent floor cracks, debris, crates/barrels that show damage and break. Strong hits and knockdowns damage the floor; kicks/uppercuts near props and ultimate releases also damage scenery. Scenery resets each round and does not change fighter collision rules.
- Character rim traces, reflected silhouettes on the wet arena, attack impact bursts, layered ultimate wind spirals, smoke and water responses to movement.
- Ultimate camera focus, zoom/recoil and adjustable shake; breathing red screen edges below 28 HP. Reduced motion suppresses camera motion, rain animation and pulsing danger feedback.
- Back is the only block input. The separate guard button, S guard and down-arrow guard bindings are removed.
- Fresh back input within 120 ms before impact parries. A parry takes no damage, grants 14 energy, and staggers a melee attacker. Projectile parries absorb the projectile. Re-arming takes 420 ms. Holding back beyond the window blocks with chip damage. Guard-breaking ultimates bypass both.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | A/D or left/right arrows |
| Crouch | S or down arrow |
| Block | Hold away from opponent |
| Parry | Press away just before impact |
| Jump | W, up arrow or Space |
| Punch / Kick | J / K (also Z / X) |
| Uppercut / Wave / Ultimate | U / I / L (C also ultimate) |
| Dash | Shift |
| Pause | Esc / P |
| Sound / FPS / Mesh | M / F / V |

Touch uses the two direction buttons for movement and back-to-block/parry. The left controls contain jump, dash and directions; there is no guard button.

Settings in fighter select and pause: sound, reduced motion, quality, vibration where supported, FPS, fullscreen where supported, shake (off/light/full), low-health pulse, rim outlines and mesh inspection. Arena and settings are remembered in browser storage when permitted.

## Build

Run `python3 build.py`. It embeds `src/template.html`, `src/style.css`, `src/game.js` and `src/arena.js` into `index.html`. Keep the current `index.html`: the build extracts its original embedded character and effect art. Original atlases are included under `assets/` as well.

The new atlas has 8 columns × 6 rows, 128×128 pixels per cell, 1024×768 pixels overall. `assets/aftershock_fx_manifest.json` gives exact frame rectangles. Rows: smoke, splash, wind, impact, parry, crack. Rendering uses normalized lifetime to select frames; durations vary by effect. `buildEffectAtlas()` in `src/arena.js` is the editable atlas source.

## Validation

11 JS simulation checks pass: parry, sustained block, forward-hit vulnerability, side-switch defense, guard breaks, projectile parry, re-arm cooldown, breakable props, floor scars, absent guard button and absent legacy guard key bindings. A 6,480-step smoke run exercises all 9 fighters across punch, kick, uppercut, wave, ultimate and dash. Arena/ultimate/low-HP frames were rendered through a native Canvas implementation and inspected.

To reproduce, install Node.js and `@napi-rs/canvas`, then run `node tests/native-smoke.cjs`. Test output is written to `.qa/`; this also exports the new atlas PNG. No dependency is required for the game itself.

Full browser and device interaction testing was unavailable in the build environment; the native harness does not validate DOM layout, browser audio, touch routing or real-device performance.

No Higgsfield assets were used. Arena art was generated with the built-in image-generation tool; FX animation frames are generated from the included Canvas source. Existing character assets and their original provenance are retained. The older handoff and generation notes describe the prior edition and are retained as historical references.

Unofficial fictional fan game, not affiliated with or endorsed by FlipTop or the emcees.


---

# Earlier release notes

# Ring Brawlers — Caricature Edition

> **Play online:** the game is `index.html` (same file as the original `ring_brawlers.html`, renamed so the site root opens it). Unofficial fan game, not affiliated with or endorsed by FlipTop or the emcees depicted.


Open `ring_brawlers.html` in a modern browser. Everything needed to play is embedded in that file; it works offline. On a phone, extract the ZIP and open the HTML in a browser supporting local HTML. Landscape gives the largest arena.

## This update

- Nine playable caricature emcees: Loonie, Abra, Shehyee, Batas, Smugglaz, Aklas, Zaito, Apekz, Sinio.
- 216 newly generated fighter frames: 24 per emcee, with guard/walk, six-frame punch, six-frame kick, and six-frame uppercut sequences.
- 24 matching effects frames, plus colored skill glyphs, outlined spark shards, motion streaks, dust, and expanding impact rings.
- New named abilities and different mechanics per character. Read `ROSTER_DESIGN.md` for the researched basis and actual game behavior.
- Consistent 320 × 320 cells and at least 32 transparent pixels around each packed source cell; clean low-alpha background noise, preserved antialiased edges, fixed horizontal pivots, per-frame foot anchors.
- Silhouette contours and triangulated convex hull meshes in `assets/atlas_manifest.json`. The Mesh toggle displays the silhouette, vertices, and mesh wireframe. The meshes are inspection/export geometry; combat uses readable distance/height checks rather than exact pixel collisions.
- Fixed 120 Hz simulation with interpolated character positions, eased pose transforms, breathing, walk bob, recoil, and knockdown motion. Actual screen frame rate depends on device performance. No AI optical-flow frames are claimed.
- Pause, rematch, three AI difficulties, training dummy, optional sound, reduced motion, and touch controls.

## Aftershock + Showtime update

Built on the Aftershock edition (3 arenas, parry, environment damage, extra FX atlas). Added:

- **Impact frames** on supers, parries and KOs: one dark frame with white silhouettes and speed rays (skipped when Motion is reduced).
- **Lightning** arcs on supers and KOs, crackling around a fighter whose super is ready.
- **Comic hit words** (WHAM!, POW!, KABOOM!, DENIED!) on kicks, uppers, supers and parries; crowd shouts in the Championship arena. Toggle: *Comic pops*.
- **Energy orbs** fly from each hit into the attacker's energy bar; health-bar chips burst off on damage.
- **Per-fighter projectile trails** (rings, sparks, shards, lightning, bounce dust…).
- **Living arenas:** lightning storm, blinking windows, flickering neon, puddle ripples and searchlights on the Rooftop; swinging chains, furnace glow, spark showers and embers in the Foundry; parallax depth on both.
- **VS splash** before round 1, **YOU** marker at round start, **SUPER READY** burst.
- **UI:** arena cards show real previews; difficulty is a button row; *Enter the ring* stays visible while the menu scrolls; Settings and How to play open as panels (also from Pause); new result card with winner pose, letter grade (S–D) and 8 match stats.

Tested in headless Chromium (desktop, 800×360 landscape and 360×740 portrait touch): no errors, all three arenas, VS intro, impact frames, KO and the result card. Not tested on a real phone or a real high-refresh screen.

## Feel & visuals update (November 2026)

Fight rules, damage, timings and the nine kits are unchanged, except for a short freeze when a super starts and slightly longer impact freezes on kicks, uppercuts and supers. Everything below is presentation.

- **High-refresh rendering.** Rules still run at a fixed 120 Hz; drawing, particles and the camera now update at the screen's own rate (60/120/144/240 Hz) with interpolated fighters and projectiles. The canvas renders at the display's real pixel density (up to 2×).
- **Camera.** Zooms in as fighters close distance, follows the action, kicks in the direction of each hit, and shakes with a smooth trauma model (position + slight roll). KO: slow motion, zoom on the loser, flash.
- **Particles.** Directional sparks, shards that bounce on the mat, embers, dust (steps, jumps, landings, dashes, knockdowns), shockwave rings, star flares, projectile trails, super charge-up, super-ready aura, speed lines, victory confetti.
- **Animation.** Squash and stretch on jumps/landings/attacks, attack swooshes, white hit flashes, tinted afterimages, walk-in intros, win hop, knockdown bounce.
- **Arena.** Crowd rows bob and jump with the hype, camera flashes pop on big hits, ropes wobble, parallax layers, vignette.
- **HUD & menu.** Portraits, slanted health/energy bars, combo counter, animated ROUND / FIGHT / K.O. banners, super name banner, redesigned fighter select with live preview and stats.
- **Phone.** Larger thumb-zone buttons (two clusters), floating over the arena corners in landscape; optional vibration; fullscreen button.
- **Options** (menu and pause screen, remembered): Sound, Motion, Quality (auto/high/low), Vibration, FPS counter (also **F**), Fullscreen, Mesh.
- **Sound.** Still synthesized and off by default; adds noise-based impacts, whooshes, KO rumble and a last-10-seconds tick.

### Tested / not tested

- Tested in headless Chromium: all nine fighters load and fire every move in training with no errors; a full KO round; phone-size layouts in portrait (360×740) and landscape (800×360); holding move + tapping attack with two touches leaves no stuck buttons.
- **Not tested:** a real phone, real 144 Hz hardware, vibration, audio output, and real-device frame rate. Quality "auto" drops to low detail if frames stay slow.

## Editing the game

Source now lives in `src/` (`template.html`, `style.css`, `game.js`). The art stays embedded in `index.html`. After editing, rebuild the single file with:

```bash
python3 build.py
```

`build.py` lifts the three art lines out of the current `index.html` and wraps the new code around them.

## Controls

| Action | Keyboard |
|---|---|
| Move | A / D or left / right arrows |
| Jump | W, up arrow, or Space |
| Punch / Kick | J / K (Z / X alternatives) |
| Upper-slot skill | U; 20 energy |
| Wave skill | I; 30 energy |
| Dash / blink | Shift; 0.85-second cooldown |
| Super | L or C; 100 energy |
| Guard | Hold away, S, or down arrow |
| Pause | Esc or P |
| Sound | M |
| FPS counter | F |
| Sprite boundary / mesh overlay | V or Mesh option |

Touch skill buttons use the selected fighter's move names. Selection and pause screens explain the selected kit. Sound starts off. Training refills player energy and restores the dummy's health.

## Included files

- `ring_brawlers.html`: self-contained playable game.
- `assets/*_atlas.png`: nine transparent fighter sheets and one effects sheet. Each atlas is 1920 × 1280, six columns by four rows.
- `assets/atlas_manifest.json`: frame rectangles, foot pivots, bounds, silhouette contours, convex mesh vertices, triangle indices, and animation mappings.
- `ROSTER_DESIGN.md`: sourced style study and skill guide.
- `GENERATION_NOTES.md`: generation and packing notes.
- `Caricature_Roster.png`: roster contact sheet.
- `Caricature_Roster_Preview.mp4`: 18-second silent 60 fps scripted render from the game engine, showing wave and super behavior for each character. It is a rendered showcase, not recorded browser playtesting.

## Validation and limits

Passed canvas-based checks: all assets and 216 fighter frames load; all 240 packed frames have padding; every fighter hull triangulates; a three-hit combo connects; projectiles, energy costs, dummy recovery, dash cooldown, pause, rounds, and rematches work. Separate tests cover all nine kits, including armor, counter, marks, payoff, rapid-fire counts, extra energy, and consistent simulated movement across 30/60/120 Hz display callbacks. Rendered combat frames and mesh overlays were inspected.

Full browser layout, real-phone touch input, audio playback, and real-device performance remain unverified because the local browser could not launch in the environment. The artwork is caricature; visual likeness and animation are stylized rather than exact motion capture.

## Editing

The HTML contains readable CSS and JavaScript plus embedded PNG data. Editing external atlas files alone does not change the embedded game: replace the corresponding image data and manifest data in the HTML when importing new art. Reference photographs are not redistributed in this package.
