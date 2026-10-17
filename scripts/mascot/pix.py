"""Tiny pixel-art toolkit: a 64x64 canvas, shapes, ASCII sprites and a transparent-GIF writer (Pillow only)."""

import math
from pathlib import Path

from PIL import Image

GRID = 64
SCALE = 8
OPTIONS = Path(__file__).resolve().parents[2] / "docs" / "assets" / "mascot" / "options"

PAL = {
    "o": (31, 58, 69),       # outline
    "t": (42, 157, 143),     # teal
    "d": (31, 111, 101),     # dark teal
    "l": (120, 214, 198),    # light teal
    "w": (255, 255, 255),
    "g": (203, 213, 225),    # light grey
    "G": (148, 163, 184),    # mid grey
    "b": (37, 99, 235),      # blue
    "B": (30, 64, 175),      # dark blue
    "r": (244, 132, 95),     # orange
    "R": (214, 98, 66),
    "y": (250, 204, 21),     # yellow
    "k": (22, 163, 74),      # green
    "e": (31, 58, 69),       # eye
    "p": (244, 114, 182),    # pink
}
N8 = ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (1, -1), (-1, 1), (-1, -1))


def inb(p):
    return 0 <= p[0] < GRID and 0 <= p[1] < GRID


def ellipse(cx, cy, rx, ry):
    return {(x, y) for y in range(GRID) for x in range(GRID) if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1}


def rect(x0, y0, x1, y1):
    """Inclusive-exclusive integer rectangle."""
    return {(x, y) for x in range(int(x0), int(x1)) for y in range(int(y0), int(y1)) if inb((x, y))}


def rrect(cx, cy, hw, hh, r):
    """Rounded rectangle by signed distance."""
    out = set()
    r = min(r, hw, hh)
    for y in range(GRID):
        for x in range(GRID):
            qx, qy = abs(x + .5 - cx) - (hw - r), abs(y + .5 - cy) - (hh - r)
            d = math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0) - r
            if d <= 0:
                out.add((x, y))
    return out


def polygon(pts):
    out, n = set(), len(pts)
    for y in range(GRID):
        for x in range(GRID):
            px, py, inside, j = x + .5, y + .5, False, n - 1
            for i in range(n):
                xi, yi = pts[i]
                xj, yj = pts[j]
                if (yi > py) != (yj > py) and px < (xj - xi) * (py - yi) / (yj - yi) + xi:
                    inside = not inside
                j = i
            if inside:
                out.add((x, y))
    return out


def line(x0, y0, x1, y1):
    x0, y0, x1, y1 = int(round(x0)), int(round(y0)), int(round(x1)), int(round(y1))
    pts, dx, dy = set(), abs(x1 - x0), -abs(y1 - y0)
    sx, sy, err = (1 if x0 < x1 else -1), (1 if y0 < y1 else -1), dx + dy
    while True:
        pts.add((x0, y0))
        if (x0, y0) == (x1, y1):
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy
    return {p for p in pts if inb(p)}


def shift(shape, dx, dy):
    return {(x + dx, y + dy) for x, y in shape}


def rotate_pts(pts, deg, pivot):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [(pivot[0] + (x - pivot[0]) * c - (y - pivot[1]) * s, pivot[1] + (x - pivot[0]) * s + (y - pivot[1]) * c) for x, y in pts]


class Canvas:
    def __init__(self):
        self.px = {}

    def fill(self, shape, key):
        for p in shape:
            if inb(p):
                self.px[p] = PAL[key]

    def paint(self, shape, key, outline=True, ocolor="o"):
        shape = {p for p in shape if inb(p)}
        if outline:
            for p in {(x + dx, y + dy) for x, y in shape for dx, dy in N8} - shape:
                if inb(p):
                    self.px[p] = PAL[ocolor]
        self.fill(shape, key)

    def sprite(self, rows, x, y, flip=False, scale=1.0, skip=" ."):
        """ASCII sprite; each char is a PAL key. `scale` resamples with nearest-neighbour about the sprite centre."""
        h, w = len(rows), max(len(r) for r in rows)
        sw, sh = max(1, round(w * scale)), max(1, round(h * scale))
        ox, oy = x - (sw - w) / 2, y - (sh - h) / 2
        for j in range(sh):
            for i in range(sw):
                si, sj = min(w - 1, int(i / scale)), min(h - 1, int(j / scale))
                ch = rows[sj][si] if si < len(rows[sj]) else " "
                if ch in skip:
                    continue
                px = (round(ox + (sw - 1 - i if flip else i)), round(oy + j))
                if inb(px):
                    self.px[px] = PAL[ch]

    def image(self):
        img = Image.new("RGBA", (GRID, GRID), (0, 0, 0, 0))
        for p, c in self.px.items():
            img.putpixel(p, c + (255,))
        return img


def outline_sprite(rows, fill_outline="o"):
    """Adds a 1px outline (8-neighbour) around every non-empty pixel of an ASCII sprite."""
    h, w = len(rows), max(len(r) for r in rows)
    grid = [[(rows[j][i] if i < len(rows[j]) else ".") for i in range(w)] for j in range(h)]
    pad = [["."] * (w + 2) for _ in range(h + 2)]
    for j in range(h):
        for i in range(w):
            pad[j + 1][i + 1] = grid[j][i]
    out = [r[:] for r in pad]
    for j in range(h + 2):
        for i in range(w + 2):
            if pad[j][i] in " .":
                if any(0 <= j + dj < h + 2 and 0 <= i + di < w + 2 and pad[j + dj][i + di] not in " ." for di, dj in N8):
                    out[j][i] = fill_outline
    return ["".join(r) for r in out]


def save_gif(frames, name, ms=90, scale=SCALE, sizes=(SCALE,)):
    """Writes transparent GIFs (one per scale) sharing one palette across frames. Returns the paths."""
    OPTIONS.mkdir(parents=True, exist_ok=True)
    key = (255, 0, 255)

    def flatten(img):
        alpha = img.getchannel("A").point(lambda a: 255 if a > 0 else 0)
        flat = Image.new("RGB", img.size, key)
        flat.paste(img.convert("RGB"), mask=alpha)
        return flat

    montage = Image.new("RGB", (GRID, GRID * len(frames)), key)
    for i, f in enumerate(frames):
        montage.paste(flatten(f), (0, i * GRID))
    pal_img = montage.quantize(colors=40, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    pal = pal_img.getpalette()
    tr = min(range(len(pal) // 3), key=lambda k: sum((pal[3 * k + c] - key[c]) ** 2 for c in range(3)))
    paths = []
    for s in sizes:
        seq = [flatten(f.resize((GRID * s, GRID * s), Image.NEAREST)).quantize(palette=pal_img, dither=Image.Dither.NONE) for f in frames]
        path = OPTIONS / (f"{name}.gif" if s == SCALE else f"{name}-{GRID * s}.gif")
        seq[0].save(path, save_all=True, append_images=seq[1:], duration=ms, loop=0, transparency=tr, disposal=2, optimize=False)
        paths.append(path)
    return paths


def contact_sheet(frames, path, cols=6, bg=(255, 255, 255), scale=4):
    rows = math.ceil(len(frames) / cols)
    sz = GRID * scale
    sheet = Image.new("RGB", (cols * sz, rows * sz), bg)
    for k, f in enumerate(frames):
        panel = Image.new("RGBA", (sz, sz), bg + (255,))
        panel.alpha_composite(f.resize((sz, sz), Image.NEAREST))
        sheet.paste(panel.convert("RGB"), ((k % cols) * sz, (k // cols) * sz))
    sheet.save(path)


def ease_out_back(t):
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2


def lerp(a, b, t):
    return a + (b - a) * t
