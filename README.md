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
