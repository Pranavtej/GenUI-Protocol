"""Option A — Curly: a smiling face held between curly braces (a JSON smiley) that pops UI widgets out of its head."""

import math

from pix import Canvas, GRID, contact_sheet, ease_out_back, ellipse, line, rect, save_gif

FRAMES = 24
BRACE = [(7, 0), (5, 1), (4, 3), (4, 9), (3, 11), (1, 12), (3, 13), (4, 15), (4, 21), (5, 23), (7, 24)]


def brace(cv, x, y, mirror, color="b"):
    pts = set()
    path = [((GRID_W - px) if mirror else px, py) for px, py in BRACE]
    for (x0, y0), (x1, y1) in zip(path, path[1:]):
        pts |= line(x0, y0, x1, y1)
    thick = {(a + dx, b + dy) for a, b in pts for dx in (0, 1, 2) for dy in (0, 1)}
    cv.paint({(a + x, b + y) for a, b in thick}, color)


GRID_W = 7


def widget(cv, kind, cx, cy, s):
    """UI glyphs that pop out of the head. `s` is the scale 0..1.1 (overshoot makes it pop)."""
    if s <= 0.05:
        return
    if kind == "card":
        hw, hh = round(10 * s), round(7 * s)
        cv.paint(rect(cx - hw, cy - hh, cx + hw, cy + hh), "w")
        cv.fill(rect(cx - hw, cy - hh, cx + hw, cy - hh + max(1, round(3 * s))), "b")
        for k in range(2):
            y = cy - hh + round((5 + k * 3) * s)
            cv.fill(rect(cx - hw + round(2 * s), y, cx + hw - round((3 + k * 4) * s), y + 1), "G")
    elif kind == "chart":
        hw, hh = round(10 * s), round(7 * s)
        cv.paint(rect(cx - hw, cy - hh, cx + hw, cy + hh), "w")
        for k, h in enumerate((0.4, 0.75, 0.55, 1.0)):
            bh = max(1, round(h * (2 * hh - 3)))
            x0 = cx - hw + round((1.5 + k * 4.5) * s)
            cv.fill(rect(x0, cy + hh - 1 - bh, x0 + max(1, round(3 * s)), cy + hh - 1), "b" if k % 2 == 0 else "k")
    else:
        hw, hh = round(10 * s), round(4 * s)
        cv.paint(rect(cx - hw, cy - hh, cx + hw, cy + hh), "b")
        cv.fill(rect(cx - round(5 * s), cy, cx + round(5 * s), cy + 1), "w")


def sparkle(cv, cx, cy, r):
    for d in range(1, r + 1):
        cv.fill({(cx + d, cy), (cx - d, cy), (cx, cy + d), (cx, cy - d)}, "y")
    cv.fill({(cx, cy)}, "y")


def frame(f):
    cv = Canvas()
    t = f / FRAMES * 2 * math.pi
    breathe = math.sin(t)                 # 0..1 closing in
    spread = 1 - breathe * 0.5            # the braces hug the face a little
    bob = round(math.sin(t * 2) * 0.8)

    # ground shadow
    cv.fill(ellipse(32, 56, 14, 1.8), "g")

    # braces (the 'JSON')
    bx = 7 + round(spread * 2) - 1
    brace(cv, bx - 3, 25, False)
    brace(cv, 64 - bx - GRID_W - 6, 25, True)

    # face
    fy = 40 + bob
    cv.paint(ellipse(32, fy, 12, 11), "t")
    for (x, y) in ellipse(32, fy, 12, 11):
        if (x - 32) + (y - fy) < -13:
            cv.px[(x, y)] = (120, 214, 198)
        elif y > fy + 7:
            cv.px[(x, y)] = (31, 111, 101)
    # cheeks and smile
    cv.fill({(24, fy + 3), (25, fy + 3), (39, fy + 3), (40, fy + 3)}, "p")
    cv.fill({(29, fy + 4), (30, fy + 5), (31, fy + 5), (32, fy + 5), (33, fy + 5), (34, fy + 4)}, "e")

    # which widget is out, and how far
    cycle = FRAMES // 3
    idx, u = divmod(f, cycle)
    kind = ("card", "chart", "button")[idx % 3]
    u = u / cycle
    s = ease_out_back(min(1, u * 2.2)) if u < 0.55 else max(0, 1 - (u - 0.55) / 0.35)
    wy = 17 - round(s * 0)
    # little neck line from the head to the widget while it is out
    if s > 0.3:
        cv.fill(line(32, fy - 11, 32, wy + 8), "G")
    widget(cv, kind, 32, wy, s)
    if 0.0 <= u < 0.25:
        sparkle(cv, 17, 14, 2 if u > 0.1 else 1)
        sparkle(cv, 48, 12, 1 if u < 0.15 else 2)

    # eyes look at the widget, blink once per loop
    blink = f == 13
    look = -1 if s > 0.4 else 0
    for ex in (26, 36):
        if blink:
            cv.fill(rect(ex, fy - 2, ex + 3, fy - 1), "e")
        else:
            cv.fill(rect(ex, fy - 4, ex + 3, fy), "w")
            cv.fill(rect(ex + 1, fy - 3 + look, ex + 3, fy - 1 + look), "e")
    return cv.image()


if __name__ == "__main__":
    frames = [frame(i) for i in range(FRAMES)]
    paths = save_gif(frames, "a-curly", ms=90, sizes=(8, 4))
    contact_sheet(frames[::2], paths[0].with_name("_sheet-a.png"), cols=6)
    print(paths)
