# art-inbox — new art for FliptapWars

Drop new designs and sprite sheets here (made in ChatGPT or anywhere else). Nothing in this folder is
used by the game until someone wires it in: Claude Code or Codex slices the image, writes the frame
data into `assets/` or `addons/`, and adds it to the build. Upload on GitHub with **Add file → Upload
files** into `art-inbox/`, or attach the file in a Codex / Claude Code task.

Each upload = the image + a short note `<name>.txt` saying what it is and where it should go
(e.g. "new look for Abra", "sticker for a 10-hit combo", "menu background").

## Rules for every image

- **Real transparent background** (PNG with alpha). Not white, not a fake checkerboard. Backgrounds/arenas are the only exception.
- **Same art style as the game:** bold dark outline, cel shading, big-head caricature (see `assets/motion/lobby.webp`, `assets/redraw/batas.webp`).
- **No text, logos or watermarks** in the art (the game draws its own text). No official FlipTop logos.
- **Unofficial caricatures only;** keep it friendly — no slurs, no real sponsor brands.
- PNG or WebP, at least the sizes below. Bigger is fine; the build scales and compresses.

## 1. Fighter sprite sheet (a new look for a fighter)

- **Grid of 4 columns × 7 rows = 28 cells, every cell the same size, at least 320 × 400 px** (sheet ≥ 1280 × 2800).
- One pose per cell, **full body, facing right**, same height and scale in every cell,
  **feet on the same line near the bottom of the cell**, nothing crossing into the next cell.
- Poses in this exact order (left→right, top→bottom):

| # | pose | # | pose |
|---|---|---|---|
| 0 | idle fighting stance | 8 | kick (high front/side kick) |
| 1 | walk A | 9 | uppercut (fist up) |
| 2 | walk B | 10 | low slide kick (body near the floor) |
| 3 | guard / block (forearms up) | 11 | power / energy push (palms forward) |
| 4 | crouch, ready to dash | 12 | getting hit (recoil) |
| 5 | dash / lunge forward | 13 | knocked down (lying on the floor) |
| 6 | jump (knees tucked, in the air) | 14 | getting up (one knee) |
| 7 | punch (straight jab) | 15 | victory pose |

  Cells 16–27: **signature poses** for that emcee's skills and ultimate (props allowed, e.g. Batas's axe), described in the note.

## 2. Gag / sticker / crowd animation (story antics)

- **4 frames in one row**, each cell **256 × 160 px or larger**, transparent, same scale in every frame.
- Note must say **what makes it appear** (the game shows nothing at random — e.g. "after a 10-hit combo",
  "when the timer hits 30 s") and whether it is a **sticker** (above the fight), **crowd** (pops over the
  railing) or **back** (on the stage floor behind the fighters).

## 3. Portrait / bust (menus, loading screen)

- One fighter per image, **chest-up, at least 640 × 700 px**, transparent, looking slightly toward the centre.

## 4. Background / arena

- **1920 × 1080 or larger**, no characters in it, floor line roughly at the lower 13% for arenas.
  Menu/loading backgrounds: keep the middle third calm (logo and fighters go there).

## Prompt to paste into ChatGPT (fighter sheet)

> Make a game sprite sheet on a fully transparent background: a grid of 4 columns × 7 rows, equal cells of
> 320 × 400 px. One full-body pose per cell, character facing right, same size and scale in every cell, feet
> on the same baseline near the bottom of each cell, nothing overlapping the cell edges, no text or logos.
> Style: bold black outline, cel-shaded, big-head street caricature of a Filipino battle rapper named
> «NAME»: «describe outfit / hair / accessories». Poses in order: 0 idle fighting stance, 1 walk A, 2 walk B,
> 3 guard with forearms up, 4 crouch ready to dash, 5 dash lunge forward, 6 jump with knees tucked, 7 straight
> punch, 8 high kick, 9 uppercut, 10 low slide kick, 11 palms-forward energy push, 12 recoil from a hit,
> 13 lying knocked down, 14 getting up on one knee, 15 victory pose, 16–27 signature moves: «describe».

ChatGPT images often come out smaller or with a fake transparent background. Check the file before
uploading; if a sheet can't be made in one image, upload it as several images and say so in the note.
