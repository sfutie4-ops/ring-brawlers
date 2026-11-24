#!/usr/bin/env python3
"""HD loading screen art: lit fighter group shot + stage backdrop.

Fighters come from the 14 HD bust portraits (assets/motion/lobby.webp, 4x4 grid of 320x352 in roster
order); the stage is the spotlight arena (assets/menu/spotlight.webp). Each fighter gets a soft pink/cyan
rim light, a warm key light from above, depth grading for the back rows and a fade into the floor haze.
Writes assets/loading/lineup.webp and assets/loading/bg.webp.   Usage: python3 scripts/make_loading_hd.py
"""
import pathlib, random
import numpy as np
from PIL import Image, ImageFilter, ImageChops, ImageEnhance, ImageDraw
root = pathlib.Path(__file__).resolve().parent.parent
OUT = root / "assets/loading"
atlas = Image.open(root / "assets/motion/lobby.webp").convert("RGBA")
def bust(ci):
    x, y = (ci % 4) * 320, (ci // 4) * 352
    c = atlas.crop((x, y, x + 320, y + 352))
    return c.crop(c.getbbox())

def tint(alpha, col, a=1.0):
    s = Image.new("RGBA", alpha.size, col + (0,)); s.putalpha(alpha.point(lambda v: int(v * a))); return s

def lit(ci, scale, depth, flip=False):
    """depth 0 = front, 1 = mid, 2 = back"""
    b = bust(ci)
    w, h = int(b.width * scale), int(b.height * scale)
    b = b.resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=70, threshold=2))
    if flip: b = b.transpose(Image.FLIP_LEFT_RIGHT)
    pad = 40; W, H = w + pad * 2, h + pad
    A = Image.new("L", (W, H)); A.paste(b.split()[3], (pad, pad))
    body = Image.new("RGBA", (W, H), (0, 0, 0, 0)); body.paste(b, (pad, pad))
    # depth grading: back rows darker, cooler and a touch softer
    if depth:
        body = ImageEnhance.Brightness(body).enhance([1, .78, .6][depth])
        cool = tint(A, (40, 50, 110), [0, .18, .3][depth]); body.alpha_composite(cool)
        if depth == 2: body = body.filter(ImageFilter.GaussianBlur(.8))
    out = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # soft outer glow (pink from the left, cyan from the right) + dark contact outline
    glowL = tint(ImageChops.offset(A, -7, 0).filter(ImageFilter.GaussianBlur(9)), (255, 50, 170), .85)
    glowR = tint(ImageChops.offset(A, 7, 0).filter(ImageFilter.GaussianBlur(9)), (40, 200, 255), .85)
    out.alpha_composite(glowL); out.alpha_composite(glowR)
    out.alpha_composite(tint(A.filter(ImageFilter.MaxFilter(5)), (8, 6, 16)))
    out.alpha_composite(body)
    # crisp rim highlights inside the silhouette edge
    rimL = ImageChops.subtract(A, ImageChops.offset(A, 5, 0)).filter(ImageFilter.GaussianBlur(1.4))
    rimR = ImageChops.subtract(A, ImageChops.offset(A, -5, 0)).filter(ImageFilter.GaussianBlur(1.4))
    k = [1, .8, .55][depth]
    out = Image.alpha_composite(out, tint(rimL, (255, 90, 190), .9 * k))
    out = Image.alpha_composite(out, tint(rimR, (90, 220, 255), .9 * k))
    # warm key light from the stage rig above (screen blend, strongest on heads)
    grad = Image.linear_gradient("L").resize((W, H)).point(lambda v: max(0, 255 - int(v * 1.9)))
    key = Image.new("RGBA", (W, H), (255, 214, 150, 0)); key.putalpha(ImageChops.multiply(grad, A).point(lambda v: int(v * .32 * k)))
    rgb = ImageChops.screen(out.convert("RGB"), Image.composite(Image.new("RGB", (W, H), (255, 214, 150)), Image.new("RGB", (W, H)), key.split()[3]))
    out = Image.merge("RGBA", (*rgb.split(), out.split()[3]))
    # the bust's flat bottom edge sinks into haze
    fade = Image.linear_gradient("L").resize((W, H)).point(lambda v: 255 if v < 200 else max(0, 255 - (v - 200) * 255 // 55))
    out.putalpha(ImageChops.multiply(out.split()[3], fade))
    return out, pad

LW, LH = 2000, 900
lu = Image.new("RGBA", (LW, LH), (0, 0, 0, 0))
# back row → front; Zaito stays in the back row
cast = [  # ci, centre x, bottom y, scale, depth, flip
    (5, 300, 650, 1.02, 2, False), (3, 640, 610, 1.0, 2, False), (13, 1360, 610, 1.0, 2, True), (6, 1700, 650, 1.02, 2, True),
    (1, 420, 790, 1.22, 1, False), (8, 700, 770, 1.2, 1, False), (11, 1300, 770, 1.2, 1, True), (10, 1590, 790, 1.22, 1, True),
    (2, 175, 905, 1.38, 1, False), (9, 1835, 905, 1.38, 1, True),
    (4, 560, 900, 1.52, 0, False), (12, 1445, 900, 1.52, 0, True), (7, 260, 960, 1.2, 0, False),
    (0, 1000, 900, 1.8, 0, False)]
for ci, cx, by, sc, depth, flip in cast:
    if ci == 7: continue  # Apekz sits out of the poster (keeps the front row readable)
    im, pad = lit(ci, sc, depth, flip)
    # floor shadow
    sh = Image.new("RGBA", (im.width, 80), (0, 0, 0, 0)); ImageDraw.Draw(sh).ellipse((40, 10, im.width - 40, 70), fill=(0, 0, 0, 120))
    lu.alpha_composite(sh.filter(ImageFilter.GaussianBlur(14)), (int(cx - im.width / 2), min(LH - 80, by - 50)))
    lu.alpha_composite(im, (int(cx - im.width / 2), by - im.height))
lu.save(OUT / "lineup.webp", "WEBP", quality=88, method=6, alpha_quality=90)

# ---------- backdrop: spotlight arena, graded to the street palette ----------
W, H = 1920, 1080
bg = Image.open(root / "assets/menu/spotlight.webp").convert("RGB").resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.6, 60, 2))
a = np.asarray(bg).astype(float)
xs = np.linspace(0, 1, W)[None, :, None]; ys = np.linspace(0, 1, H)[:, None, None]
pink = np.array([255, 40, 170]); cyan = np.array([40, 200, 255])
a = a * 1.08 + (pink * np.clip(1 - xs * 2.4, 0, 1) * .30 + cyan * np.clip(xs * 2.4 - 1.4, 0, 1) * .30) * (.35 + .65 * ys)
a *= 1 - .45 * np.clip((ys - .7) / .3, 0, 1)            # darker floor for the UI
v = np.sqrt((xs - .5) ** 2 * 1.2 + (ys - .45) ** 2); a *= 1 - .35 * np.clip((v - .45) / .5, 0, 1)  # vignette
img = Image.fromarray(a.clip(0, 255).astype(np.uint8)).convert("RGBA")
# brush-paint frame: pink left, cyan right (the FliptapWars street look)
rnd = random.Random(7); P = Image.new("RGBA", (W, H), (0, 0, 0, 0)); pd = ImageDraw.Draw(P)
for side, col in ((0, (255, 40, 170)), (1, (40, 200, 255))):
    for _ in range(40):
        yy = rnd.uniform(-60, H + 60); L = rnd.uniform(140, 460); wd = rnd.uniform(10, 40); d = rnd.uniform(0, 120)
        x0 = (d - rnd.uniform(50, 130)) if side == 0 else W - d + rnd.uniform(50, 130)
        pd.line((x0, yy, x0 + (L * .2 if side == 0 else -L * .2), yy + L), fill=col + (int(rnd.uniform(140, 220)),), width=int(wd))
    for _ in range(110):
        yy = rnd.uniform(0, H); xx = rnd.uniform(16, 260) if side == 0 else W - rnd.uniform(16, 260); r = rnd.uniform(1.2, 4)
        pd.ellipse((xx - r, yy - r, xx + r, yy + r), fill=col + (200,))
grit = (np.random.default_rng(11).random((H, W)) > .2).astype(np.uint8) * 255
P.putalpha(ImageChops.multiply(P.split()[3], Image.fromarray(grit).filter(ImageFilter.GaussianBlur(.8))))
img.alpha_composite(P.filter(ImageFilter.GaussianBlur(1)))
img.convert("RGB").save(OUT / "bg.webp", "WEBP", quality=86, method=6)
import os
if os.environ.get("PREVIEW"):  # optional composite preview, written outside the repo
    prev = img.copy(); prev.alpha_composite(lu.resize((1500, 675), Image.LANCZOS), (210, 300))
    prev.convert("RGB").save(os.environ["PREVIEW"], quality=88)
print({p.name: p.stat().st_size for p in OUT.iterdir()})
