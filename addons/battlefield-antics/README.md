# Ring Brawlers — Battlefield Antics 100

A new batch of 100 transparent PNG animation strips and 400 generated source poses. Each strip contains four consecutive frames. The ZIP is an asset add-on for Ring Brawlers.

| Category | Count | Intended use |
| --- | ---: | --- |
| Crowd | 10 | Reactions at the barricade or between rounds |
| Referee | 10 | Optional timing, judging, and overtime cues |
| Venue mascots | 10 | Side-stage loops inspired by Filipino street life |
| Prop beats | 10 | Moving audio gear behind the fighters |
| Battle terms | 10 | Visual jokes for counters, multis, whiffs, and punchlines |
| Formats | 10 | Story or mode cues for tags, tournaments, and tryouts |
| Event props | 10 | Visual nods to FlipTop events and venues |
| Stage crew | 10 | Background staff loops and between-round gags |
| Callback gags | 10 | Optional matchup details and emcee callbacks |
| Field bits | 10 | Small ambience near the back of the stage |

## Preview and import

Extract the full ZIP. Open `preview.html` to search all 100 animations, filter by category, or run the stage demo with six ambient props. The preview reads the extracted PNGs locally.

In `manifest.json`, each asset lists the PNG path, frame rectangles in x/y/width/height order, feet or base pivot, timing in milliseconds, and playback order. Draw `background` behind fighters, `crowd` near the barricade, and `overlay` above the stage. All assets are decorative and have collision disabled. Use an existing engine event where it matches the suggested trigger, or bind the clip to a new cosmetic event.

For ambient scenes, start with two or three small loops staggered by a few hundred milliseconds. If the action needs attention, pause decorative loops briefly during a hit or ultimate. For one-shot overlays, return to the normal HUD after the last frame. Apply matchup checks and cooldowns before queuing a callback.

Example triggers include a successful rebuttal for Rebuttal Boomerang, a three-hit combo for Multis Domino, and 3.5 seconds of mutual idle time for Dead Air Moth. Tokay Scorecard can pop during Dello–Zaito judging. Zaito’s subtitle callback can be bound to a future Charron matchup or previewed with any opponent. The archive contains the art and clip metadata for those optional hooks.

## Research and adaptation

- **Formats and alter egos.** FlipTop covers Isabuhay, Dos Por Dos, Royal Rumble, five-on-five, three-ways, beatbox showdowns, freestyle contests, and alter-ego matchups. The tag handoff, lights, rotating microphones, and mask wink are game interpretations. The official feature identifies Freak Sanchez as Tipsy D. [The Beauty of Alter Ego Battles](https://www.fliptop.com.ph/articles/the-beauty-of-alter-ego-battles)
- **Won Minutes and tryouts.** The league describes Won Minutes as a return to strict one-minute rounds. Its terminology notes connect tryouts under Process of Illumination to opportunities at Won Minutes. The hourglass and spotlight reflect those cues. [Ang Pagbabalik ng Won Minutes](https://www.fliptop.com.ph/articles/ang-pagbabalik-ng-won-minutes) · [Terminology Part 13](https://www.fliptop.com.ph/articles/kahulugan-ng-mga-sikat-na-termino-sa-fliptop-part-13)
- **Battle techniques.** Rebuttal is the basis for the returning bubble. The angle fold, stacked syllables, bell and missing-line moth dramatize competitive delivery. [Terminology Part 3](https://www.fliptop.com.ph/articles/kahulugan-ng-mga-sikat-na-termino-sa-fliptop-part-3) · [Terminology Part 7](https://www.fliptop.com.ph/articles/kahulugan-ng-mga-sikat-na-termino-sa-fliptop-part-7)
- **Event identity.** The Ahon retrospective discusses the inaugural event and later championship finals. The event archive lists Gapo de Gulat, Bara Ko, Barako, and other venues and events. The pennant, coffee cup, and stage motifs are fictional visual puns. [The Importance of Ahon](https://www.fliptop.com.ph/articles/the-importance-of-ahon) · [Events archive](https://www.fliptop.com.ph/videos/battle?page=12) · [Aspakan 2](https://www.fliptop.com.ph/videos/battle/aspakan-2)
- **Matchup callbacks.** Zaito’s official profile discusses the Charron subtitle battle. BLKD’s profile describes influential technical writing, adapted here as the Blueprint Roll. The tokay references carry forward the user’s Dello–Zaito gag. [Zaito profile](https://www.fliptop.com.ph/emcees/zaito) · [BLKD profile](https://www.fliptop.com.ph/emcees/blkd) · [Dello vs Zaito](https://www.youtube.com/watch?v=l3vDaYALwBA)

All mascots, clips, stage crew, and reactions are original game gags. Event references provide context for an unofficial game add-on. No game footage, battle audio, or lyrics are included.
