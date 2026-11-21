# Ring Brawlers · FlipTop Antics Vol. 2

Extract the full ZIP, then open `preview.html` to inspect the 18 animations. The PNG artwork is organized under `assets/antics_vol2/`. The manifest describes frame rectangles, animation timing, placement, and suggested game events.

## Install into the standalone Ring Brawlers HTML

This option targets the `ring_brawlers.html` inside the original `ring_brawlers.zip`.

1. Extract your existing game ZIP first.
2. With Python 3 installed, run the following from this extracted add-on folder. Replace the path with the location of your existing game file.

   ```sh
   python3 install_antics.py "/path/to/ring_brawlers.html"
   ```

3. Open the new `ring_brawlers_antics.html` created beside the original. It keeps its art embedded and runs offline. The original HTML is untouched.
4. Start a match. Look for Seat Swap during the opener, occasional motion at the stage edges, Multis Metronome on the third connected hit, and a round-end cue. The patch also wires successful counters, heavy hits, time-limit draws, and round resets.
5. The installer checks source markers before writing. If it reports an unsupported version, use the manual integration below for that build.

## Install into the Road to the Cypher web project

The following paths are relative to the web project's root.

| From this ZIP | Copy to |
|---|---|
| `assets/antics_vol2/` | `dist/assets/antics_vol2/` |
| `antics-player.js` | `dist/antics-player.js` |

Load the script before your game script. Use `dist/index.html` for Story Mode or `dist/versus.html` for Versus. If the game uses a build step, put the files in its public/static source directory so they are copied to the equivalent output paths.

```html
<script src="antics-player.js"></script>
<!-- Existing story-data.js and game.js scripts go here. -->
```

Create the player after canvas setup. Load the manifest relative to the live page.

```js
let antics;
fetch('assets/antics_vol2/manifest.json')
  .then(response => {
    if (!response.ok) throw new Error('Missing antics manifest');
    return response.json();
  })
  .then(manifest => {
    antics = createRingAntics(manifest, 'assets/antics_vol2/');
  })
  .catch(console.warn);
```

- In **Story Mode**, call `antics?.step(dt, { ambient: true, reducedMotion: reduced })` inside `update(dt)`. Call `antics?.reset()` when starting a level. In `draw()`, draw the `back` layer after `scenery()` and before the fighters, and the `overlay` layer after fighters and combat effects but before `hud()`.
- In **Versus Mode**, step the player inside `step(dt)` using `phase === 'fight'` for the ambient flag. Reset it in `startRound()`. Draw the back layer after the stage background and the overlay layer before `hud(P1, false)`.
- Set the optional `idle` flag in `step` when both fighters are idle. The player triggers an idle gag after four seconds. Both versions can call `antics?.draw(ctx, 'back', W, H, GY)` and `antics?.draw(ctx, 'overlay', W, H, GY)`. In Story Mode use its context variable `g` and ground coordinate `Y`. Use these helpers in screen coordinates. They handle their own canvas save and restore.
- Emit an event once after a result is confirmed. For example, call `antics?.event('counter_success')` in the branch that successfully reflects an attack. Call `antics?.event('combo_three')` when the combo first reaches three, not on every subsequent hit.
- Variant-only cues need the corresponding event. Call `antics?.event('replay_start')`, `'partner_tag'`, `'judges_reveal'`, or `'comedy_hit'` only where your game defines those moments. They play in the preview and can also be triggered directly with `antics?.play('reaction_rewind')` and other manifest IDs.
- Keep the PNGs and their shared manifest together. The add-on draws over the game's existing backgrounds.

## Layer and timing reference

| Moment | Effects | Where |
|---|---|---|
| Rival entrance | Seat Swap | Back, beside the crowd |
| Big connected hit | Bara Freeze, Punchline Zip | Crowd edge, or upper overlay |
| Counter confirmed | Sabay Turo, Rebuttal Stamp | Crowd edge, or upper overlay |
| Third hit of a combo | Multis Metronome | Upper overlay |
| Round win or finish | Hype Towel, Closer Curtain | Crowd edge, or upper overlay |
| Split decision | Score Split | Upper overlay |
| Next round | Monobloc Reset | Back, stage edge |
| Idle standoff | Tape Reel Escape, Tokay Cable Tug | Back, near the floor |
| Quiet background activity | Kariton Squeak, Sampaguita Sway, Sachet Rustle | Back, corners and hanging props |
| Optional replay, comedy, tag | Reaction Rewind, Delayed Laugh, Mic Pass Arc | Crowd edge, or upper overlay |

By default the player caps simultaneous effects at three, leaves the center fight lane clear for background props, and skips optional motion effects when reduced motion is on. Event playback is cosmetic. The add-on uses original fictional gags inspired by FlipTop's crowd reactions, rebuttals, multis, judging, and partner formats.
