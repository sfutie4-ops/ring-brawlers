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
| Sprite boundary / mesh overlay | V or Mesh button |

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
