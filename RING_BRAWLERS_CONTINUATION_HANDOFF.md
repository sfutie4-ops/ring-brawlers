# RING BRAWLERS — CONTINUATION & INCOMPLETENESS HANDOFF

**Project:** Unofficial FlipTop-inspired, caricature-style browser fighting game  
**Audit date:** 16 November 2026  
**Status:** **Playable prototype, not finished or phone-verified.**  
**Purpose of this file:** Give the next developer/ChatGPT conversation a reliable starting point, a clear list of incomplete work, implementation instructions, and acceptance tests **without rebuilding the game from scratch**.

> **Start here:** Use the previously recovered `ring_brawlers.zip` as the source of truth. Keep its working combat systems. This handoff is **instructions only**, not a replacement game or proof of changes. Do not say a feature is fixed unless it is implemented and tested.

## 1. Recovered source and what's actually in it

The recovered `ring_brawlers.zip` contains 17 entries:

- `ring_brawlers.html` — self-contained offline browser game with JavaScript/CSS and embedded artwork.
- `assets/loonie_atlas.png`, `abra_atlas.png`, `shehyee_atlas.png`, `batas_atlas.png`, `smugglaz_atlas.png`, `aklas_atlas.png`, `zaito_atlas.png`, `apekz_atlas.png`, `sinio_atlas.png` — nine 6×4 fighter atlases, 24 images per fighter.
- `assets/effects_atlas.png` — 24 effect cells.
- `assets/atlas_manifest.json` — frame rectangles, foot pivots, bounds, sampled silhouettes, convex-hull/mesh metadata, and animation mappings.
- `README.md`, `ROSTER_DESIGN.md`, `GENERATION_NOTES.md` — original implementation and design notes.
- `Caricature_Roster.png` and `Caricature_Roster_Preview.mp4` — visual reference and silent showcase video.

**Original built-in content (do not throw it away):** 9 playable emcees; 216 generated fighter cells; a standard punch, kick, 20-energy upper-slot move, 30-energy wave, 100-energy super; unique character-specific effects/mechanics; jump, guard, dash, combo, health/energy, AI opponents, training dummy, multiple rounds, pause, optional synthesized sound, reduced motion, keyboard and touch controls, fixed-step simulation, visual mesh inspection mode.

**Important distinction:** The separately recovered Library also shows additional generated sprite images (individual named fighter sprite sheets, three ultimate/action sheets, and extra combat VFX). They are **not the same as files inside the ZIP and are not automatically integrated into the playable build**. Verify them visually and import them only when frame boundaries, identities, pivots, transparency, and animation sequences check out.

**Technical packaging trap:** The HTML contains **embedded** PNG data and manifest-like metadata. Changing `assets/*.png` in the ZIP does **not** change what the HTML renders unless the new artwork/metadata is also re-embedded or the architecture is switched to loading external files. Preserve the offline-playable goal.

## 2. Incompleteness audit — ordered by priority

The following statuses refer to **the files inspected**, not assumptions about future builds.

| Priority | Feature / concern | Current evidence | Required action and definition of done |
|---|---|---|---|
| **P0** | **Real-phone QA** | Original README explicitly says phone layout/input, audio and device performance were not verified in a real browser. | Test on Android Chrome and at least one second mobile browser/device; reproduce a complete match, multitouch, pause, resume, and rematch. Record device, orientation, and issues. |
| **P0** | **Haptics** | No `navigator.vibrate`, `vibrate(`, or haptic implementation is present in the recovered HTML. | Implement **optional** `navigator.vibrate()` feedback with feature detection, short pulses for UI taps/light hits, stronger but restrained patterns for super/KO. Add a Haptics On/Off control; quietly no-op on unsupported platforms or reduced-feedback settings. Test on supported Android hardware. |
| **P0** | **Phone button placement / size** | CSS has touch buttons; in a `max-height:480px` layout, buttons are only **35 px high**. | Redesign landscape controls as thumb zones: movement/jump/guard/dash on left, punch/kick/upper/wave/super on right. Make targets ideally ≥44–48 CSS px where feasible; avoid attack buttons overlapping game HUD or device safe areas. Support compact-phone widths, not just desktop. Test 360×800 portrait, 800×360 landscape, and at least one taller phone. |
| **P0** | **Touch reliability** | Existing pointer handlers and pointer capture exist; device behavior is unverified. | Test multi-finger move+jump+attack, holding guard, rapid double taps, pointer leaving button, pause while fingers are down, incoming calls/tab switches, and touch cancellation. No stuck buttons, lost inputs, scrolling/zooming, or double action triggering. |
| **P0** | **Control/hit feedback clarity** | Existing effects are present, but actual phone readability is unverified. | Add clearly different VFX for hit/block/whiff/critical, energy denial/cooldown cues, visible combo chain feedback, and legible special-button labels. Include a readable optional HUD tutorial. |
| **P1** | **Frame coverage** | Each fighter atlas has 24 cells: 2 guard, 4 walk, 6 punch, 6 kick, 6 uppercut. There are **no dedicated frame strips for every special, idle variation, jump, landing, damage, KO, or ultimate** in this baseline atlas. | Generate and integrate additional **distinct animations** where warranted. At minimum: idle loop, jump/landing, dash, hit reaction, knockdown/stand-up, guard/block, and signature super intro/active/recovery for each fighter. Existing code transforms may remain as fallback, but unique attacks must visually look unique. |
| **P1** | **Motion polish** | Fixed 120 Hz simulation, interpolation, eased transforms and effects exist; no optical-flow or rig deformation was claimed. | Improve anticipation, impact freeze, recovery, smear/afterimages, spacing, and frame timings. Avoid adding frames that change facial identity or shift the fighter's apparent foot position. Use authored in-betweens where needed. Keep a readable silhouette during supers. |
| **P1** | **Art outlines / alpha edges / mesh** | Atlas packing includes 32 px gutters, pivot/bounds data, transparent cleanup, and inspection meshes. Combat does **not** use pixel-perfect or mesh collisions. | Inspect every newly imported atlas cell at 100% and against dark/light backgrounds. Prevent edge halos and frame bleed. Recompute normalized frame bounds/pivots and conservative hit regions. Use actual combat hitboxes/hurtboxes, not the decorative convex mesh, unless implementing and validating a new collision engine. |
| **P1** | **More distinctive fighter skills** | The nine fighter kits exist but share the core punch/kick/upper/wave/super slots; uniqueness is largely in stats, projectile behavior and super mechanics. | Keep existing personalities but give each fighter a recognizable signature animation, hit effect, icon, sound cue and strategic identity. Differentiate counters, traps, multi-hits, feints and crowd-control without simply making everything stronger. See roster section below. |
| **P1** | **VFX/sound polish** | 24 effects cells and procedural particles/synth sound exist. The showcase is a silent scripted render, not browser playtesting. | Create more impact types, hit sparks, dust, projectile trails, screen shake (reduced-motion compatible), guard sparks, block feedback, super transitions, and optional audio mixing. Verify effects don't hide gameplay. |
| **P1** | **Performance under load** | Original README claims simulation checks but actual mobile FPS, memory, heat and audio were untested. | Profile on low/mid-range Android hardware. Use limited particle budgets and pooling; cache tinted images; clamp device pixel ratio if needed; retain stable game speed at 30/60/120 Hz display callbacks. No accidental 18 MB HTML reparse during combat. |
| **P1** | **Repeatable automated tests** | README describes canvas/simulation checks, but the ZIP contains **no standalone test suite or scripts**. | Add a reproducible smoke-test script/HTML harness covering image loading, roster selection, inputs, per-fighter supers, hitboxes, hit/block/KO, pause, AI/training, persistence of settings, and mobile viewport CSS. Document how to run it. |
| **P2** | **Usability and accessibility** | Some control labels, reduced motion and pause exist. No complete accessibility audit. | Add first-run quick tutorial, rebindable controls where feasible, color-independent status, low-flash option, high-contrast HUD, font scaling and large-action-label toggle. |
| **P2** | **Fullscreen/orientation and installability** | No fullscreen/orientation-request implementation or installable web-app setup is present. | Optionally add a safe fullscreen button, landscape suggestion and PWA manifest/service worker, while keeping the standalone HTML usable without installation. Never require orientation lock to play. |
| **P2** | **Packaging and licensing** | Current output is an unofficial fan game; original profiles and portraits are referenced, but artist endorsement is not claimed. | Keep clear unofficial attribution; do not use copyrighted battle footage, recordings, lyrics or official branding without proper permission. Avoid claiming the artists collaborated or endorsed it. |

## 3. Character identity — preserve and upgrade these kits

Retain the role logic and design basis in `ROSTER_DESIGN.md`. The following are **fictional gameplay interpretations**, not descriptions of the emcees as people.

| Fighter | Existing distinct mechanics to preserve | Upgrade direction (animation / readability / skill expression) |
|---|---|---|
| **Loonie** | Rhyme Chain three-shot wave, stronger chains, five-beat **Hari ng Tugma** | Visualize chained rhyme rings connecting successive hits; five separate super beats, combo-meter pulse and final impact punctuation. |
| **Abra** | Fast mobility, longer dash dodge, slowing **Gayuma Spark**, rushing **Illusion Rush** | Distinct feint/double-afterimage frames; make decoy location and slow clearly readable; avoid creating unavoidable hits. |
| **Shehyee** | Three-second angle mark and bonus-mark cash-out with guard break | Mark appears over target; telegraph expiration; add pressure-step and unmistakable **Angle Breaker** finisher frame. |
| **Batas** | One-hit startup armor, heavy projectile, guard-break **Final Verdict** | Armor glint that disappears after absorbing a hit; heavy shake/impact + readable slow startup. |
| **Smugglaz** | Four-shot wave, eight-shot **Double-Time**, quick hit-stop | Rapid-fire word-shard trail with alternating positions and timed per-shot silhouettes; prioritize clarity over particle count. |
| **Aklas** | Blink, zigzag orb, three-lane **Unorthodox** super | Distinct blink vanish/reappear, zigzag telegraph and three visibly separated firing lanes; maintain fair reaction time. |
| **Zaito** | Timed **Rebuttal** counter, bouncing wave, delayed **Punchline Delay** | Clear counter stance with sparkle on successful timing; suspense telegraph before delayed punchline; do not make timing arbitrary. |
| **Apekz** | Setup/payoff mark, three escalating super shots | Setup glyph, visible payoff trigger and staged three-impact **Triple Meaning** sequence. |
| **Sinio** | Energy gain on blocked pressure, slowing wave, broad short-range **Crowd Control** | Joke bubble/pop and audience-light motif as original game art; make range and energy pickup readable without concealing the hitbox. |

For every new move, document: **startup / active / recovery time; hitbox and hurtbox; damage; energy; cooldown; stun/knockback; VFX/SFX; counters and tradeoffs.** Test that it works on keyboard and touch.

## 4. Implementation instructions — in sequence

### Phase A — secure the baseline

1. Extract `ring_brawlers.zip`. Preserve an untouched backup.
2. Run/open `ring_brawlers.html` locally, preferably in a browser rather than an HTML preview renderer. Confirm all nine characters load, a match starts, and fighters animate. Phone support for local file URLs differs by browser; use a simple local HTTP server during development when useful.
3. Record a baseline test checklist and capture existing controls/menu screenshots. Don't rewrite the combat engine before proving the existing game functions.
4. Read `README.md`, `ROSTER_DESIGN.md`, `GENERATION_NOTES.md` and inspect the frame mappings in `assets/atlas_manifest.json`.

### Phase B — finish mobile interaction before visual expansion

1. Give the play area and controls separate responsive zones, with safe-area padding and predictable hit regions. Consider a `viewport` meta tag supporting `viewport-fit=cover` only when safe-area support is correctly designed.
2. Replace the cramped short-height touch layout with thumb-oriented movement and action clusters. Make super prominent but guarded against accidental activation.
3. Keep pointer-capture and multi-pointer support; track each pointer ID. Clear pointers on `pointercancel`, `lostpointercapture`, `blur`, `visibilitychange`, pause and return to menu.
4. Add optional haptic preference with `navigator.vibrate?.(...)` or an explicit feature check. Give subtle feedback on button activation, hit, guarded hit and KO. Do not generate nonstop vibration while a button is held; silence when settings disable it or API is unavailable.
5. Test **move + jump + attack** simultaneously and **move + guard** sustained; ensure buttons remain pressed until their own pointer releases.
6. Test orientation/viewport changes, keyboard fallback, pause and rematch. Address any HUD overlap.

### Phase C — art, combat and animation upgrade

1. Decide and document a single consistent direction: **high-quality exaggerated caricatures, clean thick outlines, cel shading, expressive poses, transparent backgrounds and consistent fighter scale**.
2. Before importing, visually compare optional library sprite sheets to the ZIP atlases. Approve or reject by character identity, costume consistency, transparent margins, phase continuity and no cropped extremities. Do not merge conflicting proportions blindly.
3. Add the missing animation states with explicit timing maps: `idle`, `walk`, `jump`, `land`, `dash`, `guard`, `hit`, `knockdown`, `getup`, `punch`, `kick`, `upper`, `wave`, `super_intro`, `super_active`, `super_recovery` (as applicable).
4. Build/validate sprites with a frame-packing script. Verify transparent edges, fixed pivots, silhouette padding, manifest coordinates and stable ground position. Regenerate manifest metadata after each atlas replacement.
5. Add signature supers to every fighter; each super should have its own anticipation, readable active frames, and recovery. VFX should communicate gameplay rather than replace the fighter animation.
6. Add collision tests for all attack phases and keep guarding, armor, counters, hitstop, energy requirements and invulnerability consistent with the game rules. Keep reduced-motion behavior.
7. Rebuild/replace the embedded atlas data in the self-contained HTML (or implement a reliable external loader plus separately deliver a standalone offline version).

### Phase D — QA, polish and release

1. Run functional automated tests plus real Android device tests. Verify the game remains offline-capable.
2. Test every fighter against every fighter where feasible; at least smoke-test all nine against the same target. Look for soft locks, infinite hitstun, projectile leaks and super animation desync.
3. Benchmark low/medium/high graphics settings on phones; scale particle counts and display resolution when needed. Maintain consistent gameplay speed independent of render FPS.
4. Deliver a **working final ZIP** containing source, assets, README, manifest, test artifacts and credits **and** a direct-play standalone `ring_brawlers.html`. If only one deliverable is allowed later, include all these in one ZIP.
5. Include a concise changelog distinguishing **implemented**, **tested**, **partially tested**, and **not implemented** features. Never state "haptics working" or "mobile optimized" on the basis of code alone.

## 5. Release acceptance checklist

- [ ] All nine fighters can be selected and fight without missing sprites or errors.
- [ ] Art cell margins, frame clipping, anchors, alpha edges and outlines pass visual inspection.
- [ ] Each fighter's upper-slot, wave and ultimate have recognizable behaviors and visual signatures.
- [ ] Every super handles sufficient/insufficient energy, cancellation restrictions, hit/block/whiff and KO correctly.
- [ ] Three-finger mobile interactions do not leave sticky controls or create accidental double presses.
- [ ] Landscape small-screen buttons are readable/tappable with no safe-area/HUD overlap; portrait layout remains usable or clearly redirects.
- [ ] Haptics settings are visible, optional, and verified on at least one supported Android device; unsupported devices fail gracefully.
- [ ] No stutter/game-speed changes from different display callback rates; performance tested on real hardware.
- [ ] Reduced-motion mode limits shake, flashes, afterimages, and excessive impact motion.
- [ ] Sound does not start unexpectedly, and audio works after a user gesture.
- [ ] Single-player AI, training dummy, pause, rematch, rounds, guard, dash and combos still work.
- [ ] Final standalone HTML can open offline, and all assets are updated rather than merely copied beside it.
- [ ] A reproducible test procedure, changelog, instructions, and fan-game disclaimer ship with the release.

## 6. Known limitations of this handoff

- This report examines the **recovered ZIP** and HTML as supplied. It does not mean the game was run on an actual phone during this handoff.
- File contents and README demonstrate implemented mechanics and prior simulation claims, but they do **not** prove actual browser compatibility or measured device performance.
- Additional library-generated art may improve animations, but it requires selection/approval and actual integration.
- External visual-generation tools like Higgsfield/Remotion were **not** used to make the existing atlases; do not claim they were.
- Some requested features are design upgrades rather than literal bugs in the original build.

## 7. Ready-to-paste instruction for the next work session

> **Continue my existing RING BRAWLERS / FlipTop caricature fighting game. Do not restart from scratch.** Use the recovered `ring_brawlers.zip` and this `RING_BRAWLERS_CONTINUATION_HANDOFF.md` as the source of truth. First inspect the ZIP, its README, roster guide, atlas manifest and current HTML. Then implement the outstanding P0 requirements: responsive mobile thumb controls, reliable multitouch, optional haptics, and real-device-ready UI. Next improve outlines, sprite boundaries/foot pivots, animations, per-fighter ultimates, VFX and performance while retaining all nine current skill identities and existing combat rules. Import any newly generated separate sprite sheets only after validating them; remember that the HTML embeds images. Verify everything you can and clearly identify anything that still needs an actual device test. Return a working updated ZIP and standalone playable HTML, plus a concise changelog and test results. Never claim a feature works without implementing and checking it. **Prioritize a playable polished mobile game over decorative previews.**

---
**End of handoff.** This is the one consolidated instructions document requested; the recovered game and art are separate source files referenced above.
