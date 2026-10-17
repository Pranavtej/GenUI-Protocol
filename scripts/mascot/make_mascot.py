"""Generates the GenUI mascot: a pixel-art courier bird delivering a UI card. Pure Pillow, no external assets.

    python3 scripts/mascot/make_mascot.py            # writes docs/assets/mascot/*
"""

import math
from pathlib import Path

from PIL import Image

GRID = 64          # logical pixels
SCALE = 8          # output = 512 x 512
FRAMES = 8
FRAME_MS = 90

OUT = Path(__file__).resolve().parents[2] / "docs" / "assets" / "mascot"

PAL = {
    "outline": (31, 58, 69),
    "teal": (42, 157, 143),
    "teal_dark": (31, 111, 101),
    "teal_light": (88, 196, 178),
    "belly": (255, 255, 255),
    "beak": (244, 132, 95),
    "beak_dark": (214, 98, 66),
    "tie": (29, 53, 87),
    "foot": (244, 132, 95),
    "card_edge": (154, 165, 168),
    "card": (255, 255, 255),
    "card_bar": (37, 99, 235),
    "card_line": (203, 213, 225),
    "card_ok": (22, 163, 74),
    "speed": (190, 205, 210),
    "eye": (31, 58, 69),
}


def ellipse(cx, cy, rx, ry):
    return {(x, y) for y in range(GRID) for x in range(GRID) if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1}


def polygon(pts):
    """Filled polygon by even-odd scanline on pixel centres."""
    out = set()
    n = len(pts)
    for y in range(GRID):
        for x in range(GRID):
            px, py = x + 0.5, y + 0.5
            inside = False
            j = n - 1
            for i in range(n):
                xi, yi = pts[i]
                xj, yj = pts[j]
                if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
                    inside = not inside
                j = i
            if inside:
                out.add((x, y))
    return out


def rotate(pts, deg, pivot):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [(pivot[0] + (x - pivot[0]) * c - (y - pivot[1]) * s, pivot[1] + (x - pivot[0]) * s + (y - pivot[1]) * c) for x, y in pts]


def shift(pts, dx, dy):
    return [(x + dx, y + dy) for x, y in pts]


class Canvas:
    def __init__(self):
        self.px = {}

    def paint(self, shape, color, outline=True, clip=None):
        shape = {p for p in shape if 0 <= p[0] < GRID and 0 <= p[1] < GRID}
        if clip is not None:
            shape &= clip
        if outline:
            border = {(x + dx, y + dy) for x, y in shape for dx, dy in N8} - shape
            for p in border:
                if 0 <= p[0] < GRID and 0 <= p[1] < GRID:
                    self.px[p] = PAL["outline"]
        for p in shape:
            self.px[p] = color

    def dots(self, pts, color):
        for p in pts:
            if 0 <= p[0] < GRID and 0 <= p[1] < GRID:
                self.px[p] = color

    def image(self):
        img = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
        for p, c in self.px.items():
            img.putpixel(p, c + (255,))
        return img


N8 = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))


def make_card():
    """The UI card the bird delivers, as a small sprite: handle strings on top, then a window with a title bar,
    a KPI tile, text lines and a green 'live' bar. Returns ({(x, y): colour}, width, height)."""
    W, H = 22, 20
    px = {}
    for x in range(W):
        for y in range(3, H):
            edge = x in (0, W - 1) or y in (3, H - 1)
            px[(x, y)] = PAL["card_edge"] if edge else PAL["card"]
    for x in range(1, W - 1):
        for y in range(4, 8):
            px[(x, y)] = PAL["card_bar"]
    for x in range(2, 9):
        for y in range(10, 17):
            px[(x, y)] = PAL["card_line"]
    for x in range(11, 19):
        for y in (10, 11, 13):
            px[(x, y)] = PAL["card_line"]
    for x in range(11, 16):
        for y in (15, 16):
            px[(x, y)] = PAL["card_ok"]
    for x in (4, 17):                      # strings up to the feet
        for y in range(0, 3):
            px[(x, y)] = PAL["outline"]
    return px, W, H


CARD = make_card()


def blit_rotated(cv, sprite, anchor, deg):
    """Draws a sprite rotated about its top-centre `anchor` using inverse mapping, so edges stay crisp."""
    px, W, H = sprite
    a = math.radians(deg)
    c, s_ = math.cos(a), math.sin(a)
    ox, oy = W / 2, 0
    for y in range(GRID):
        for x in range(GRID):
            dx, dy = x + 0.5 - anchor[0], y + 0.5 - anchor[1]
            sx = dx * c + dy * s_ + ox
            sy = -dx * s_ + dy * c + oy
            p = (int(math.floor(sx)), int(math.floor(sy)))
            if p in px:
                cv.px[(x, y)] = px[p]


def frame(i):
    t = i / FRAMES * 2 * math.pi
    bob = round(math.sin(t) * 1.5)                  # body bobs once per loop
    flap = math.cos(t)                              # wings: 1 = up, -1 = down
    swing = math.sin(t - 1.0) * 4                   # the card lags the body and swings
    cv = Canvas()

    # speed lines behind the tail (they slide left and wrap)
    for k, (y, length) in enumerate(((26, 5), (34, 8), (42, 4))):
        x0 = 2 + ((i * 3 + k * 5) % 14)
        cv.dots({(x, y + bob) for x in range(x0, x0 + length)}, PAL["speed"])

    bx, by = 31, 31 + bob

    # a feather-shaped wing, swept back; pivot at the shoulder
    wing = [(0, 0), (-4, -7), (-5, -14), (-2, -20), (4, -22), (8, -17), (10, -10), (9, -2)]

    def wing_poly(pivot, deg):
        return polygon(rotate(shift(wing, pivot[0], pivot[1]), deg, pivot))

    back_pivot = (bx - 4, by - 4)
    cv.paint(wing_poly(back_pivot, 34 * flap - 18), PAL["teal_dark"])

    tail = polygon(shift([(0, 0), (-13, -5), (-12, 1), (-10, 7), (1, 6)], bx - 9, by + 1))
    cv.paint(tail, PAL["teal"])

    body = ellipse(bx, by + 1, 13, 7.5)
    head = ellipse(bx + 12, by - 6, 7.5, 7)
    union = body | head
    border = {(x + dx, y + dy) for x, y in union for dx, dy in N8} - union
    cv.dots(border, PAL["outline"])
    cv.dots(union, PAL["teal"])

    belly = ellipse(bx + 4, by + 5, 8, 3) & body
    cv.dots(belly, PAL["belly"])
    cv.dots({(x, y) for (x, y) in head if y == by - 11 and bx + 7 <= x <= bx + 16}, PAL["teal_light"])

    # beak (two-tone) and eye
    beak = polygon(shift([(0, 0), (7, 2), (0, 5)], bx + 18, by - 8))
    cv.paint(beak, PAL["beak"])
    cv.dots({(bx + 19, by - 4), (bx + 20, by - 4), (bx + 21, by - 4)}, PAL["beak_dark"])
    if i == 5:                                      # blink
        cv.dots({(bx + 12, by - 7), (bx + 13, by - 7), (bx + 14, by - 7)}, PAL["eye"])
    else:
        cv.dots({(bx + 13, by - 8), (bx + 14, by - 8), (bx + 13, by - 7), (bx + 14, by - 7)}, PAL["eye"])
        cv.dots({(bx + 14, by - 8)}, PAL["belly"])

    # tie
    cv.dots({(bx + 7, by - 1), (bx + 8, by - 1), (bx + 7, by), (bx + 8, by)}, PAL["tie"])
    cv.dots({(x, y) for x in (bx + 7, bx + 8) for y in range(by + 1, by + 5)} | {(bx + 8, by + 5)}, PAL["tie"])

    # legs, then the swinging card hung from the feet
    for lx in (bx - 4, bx + 3):
        cv.dots({(lx, by + 8 + k) for k in range(3)}, PAL["foot"])
    anchor_x = bx - 0.5
    blit_rotated(cv, CARD, (anchor_x, by + 11), swing)

    # front wing last, so it overlaps the body
    front_pivot = (bx - 2, by - 4)
    fw = wing_poly(front_pivot, 38 * flap - 10)
    cv.paint(fw, PAL["teal"])
    # two feather lines along the wing, rotated with it
    for off in (-3, 3):
        line = polygon(rotate(shift([(off - 0.5, -3), (off + 0.5, -3), (off + 0.5, -17), (off - 0.5, -17)], front_pivot[0] + 2, front_pivot[1]), 38 * flap - 10, front_pivot))
        cv.dots(line & fw, PAL["teal_light"])
    return cv.image()


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    frames = [frame(i) for i in range(FRAMES)]
    big = [f.resize((GRID * SCALE, GRID * SCALE), Image.NEAREST) for f in frames]

    # transparent GIF: quantise to a shared palette, index 0 = transparent
    def to_p(img):
        bg = Image.new("RGBA", img.size, (0, 0, 0, 0))
        alpha = img.getchannel("A").point(lambda a: 255 if a > 0 else 0)
        flat = Image.new("RGB", img.size, (255, 0, 255))
        flat.paste(img.convert("RGB"), mask=alpha)
        p = flat.quantize(colors=32, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
        # find the palette index closest to the magenta key and make it transparent
        pal = p.getpalette()
        idx = min(range(len(pal) // 3), key=lambda k: sum((pal[3 * k + c] - (255, 0, 255)[c]) ** 2 for c in range(3)))
        return p, idx

    paletted = [to_p(f) for f in big]
    first, tr = paletted[0]
    # use one palette for all frames so colours don't shimmer
    base_pal = first
    seq = [f.quantize(palette=base_pal, dither=Image.Dither.NONE) for f in [Image.new("RGB", big[0].size, (255, 0, 255)) for _ in big]]
    seq = []
    for img in big:
        alpha = img.getchannel("A").point(lambda a: 255 if a > 0 else 0)
        flat = Image.new("RGB", img.size, (255, 0, 255))
        flat.paste(img.convert("RGB"), mask=alpha)
        seq.append(flat.quantize(palette=base_pal, dither=Image.Dither.NONE))
    seq[0].save(OUT / "genui-mascot.gif", save_all=True, append_images=seq[1:], duration=FRAME_MS, loop=0, transparency=tr, disposal=2, optimize=False)

    big[0].save(OUT / "genui-mascot.png")
    small = [f.resize((GRID * 4, GRID * 4), Image.NEAREST) for f in frames]
    # 2x2 contact sheet for a quick look
    sheet = Image.new("RGBA", (GRID * SCALE * 4, GRID * SCALE * 2), (255, 255, 255, 255))
    for k, f in enumerate(big):
        sheet.alpha_composite(f, ((k % 4) * GRID * SCALE, (k // 4) * GRID * SCALE))
    sheet.convert("RGB").save(OUT.parent.parent.parent / "docs" / "assets" / "mascot" / "_sheet.png")
    sseq = []
    for img in small:
        alpha = img.getchannel("A").point(lambda a: 255 if a > 0 else 0)
        flat = Image.new("RGB", img.size, (255, 0, 255))
        flat.paste(img.convert("RGB"), mask=alpha)
        sseq.append(flat.quantize(palette=base_pal, dither=Image.Dither.NONE))
    sseq[0].save(OUT / "genui-mascot-256.gif", save_all=True, append_images=sseq[1:], duration=FRAME_MS, loop=0, transparency=tr, disposal=2, optimize=False)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
