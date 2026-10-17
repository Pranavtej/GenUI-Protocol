"""Option B — Morph: a jelly blob (the protocol) that becomes whatever the document says: a card, a button, a checkbox."""

import math

from pix import Canvas, GRID, contact_sheet, ellipse, lerp, line, rect, rrect, save_gif

GROUND = 55
SHAPES = {   # name: (half-width, half-height, corner radius)
    "blob": (15, 12, 12),
    "card": (21, 17, 2),
    "button": (21, 7, 7),
    "box": (12, 12, 3),
}
KEYS = [("blob", 0), ("card", 4), ("card", 10), ("blob", 14), ("button", 18), ("button", 24), ("blob", 28), ("box", 32), ("box", 40), ("blob", 44)]
TOTAL = 44
FRAMES = TOTAL


def ease(t):
    return t * t * (3 - 2 * t)


def state(f):
    """Returns (shape params, amount toward the current UI shape 0..1, which UI shape, hop)."""
    for (n0, t0), (n1, t1) in zip(KEYS, KEYS[1:]):
        if t0 <= f <= t1:
            u = 0 if t1 == t0 else (f - t0) / (t1 - t0)
            e = ease(u) if n0 != n1 else 0
            a, b = SHAPES[n0], SHAPES[n1]
            params = tuple(lerp(a[i], b[i], e) for i in range(3))
            ui = n1 if n0 == "blob" else n0
            amount = e if n0 == "blob" else (1 - e if n1 == "blob" else 1)
            hop = -3.5 * math.sin(math.pi * u) if n0 != n1 else 0
            return params, amount, ui, hop, (n0, n1, u)
    return SHAPES["blob"], 0, "blob", 0, ("blob", "blob", 0)


def frame(f):
    cv = Canvas()
    (hw, hh, r), amount, ui, hop, (n0, n1, u) = state(f)
    # idle jelly wobble when it is a plain blob
    wob = 0
    if n0 == "blob" and n1 == "blob":
        wob = math.sin(f / TOTAL * 2 * math.pi * 3) * 0.8
        hw, hh = hw + wob, hh - wob
    # a tiny press on the button
    if ui == "button" and n0 == n1 == "button" and 19 <= f <= 21:
        hh -= 1.5
        hw += 1
    cx = 32
    cy = GROUND - hh + hop
    # ground shadow
    cv.fill(ellipse(cx, GROUND + 2, hw * 0.8 + 1, 1.6), "g")
    shape = rrect(cx, cy, hw, hh, r)
    ui_mode = amount > 0.55
    base = {"card": "w", "button": "b", "box": "w", "blob": "t"}[ui] if ui_mode else "t"
    cv.paint(shape, base)

    if not ui_mode:                       # jelly shading
        for (x, y) in shape:
            if (x - cx) + (y - cy) < -(hw + hh) * 0.62:
                cv.px[(x, y)] = (120, 214, 198)
            elif y > cy + hh - 3:
                cv.px[(x, y)] = (31, 111, 101)

    top = cy - hh
    if ui_mode and amount > 0.8:
        if ui == "card":
            cv.fill(rect(cx - hw + 1, top + 1, cx + hw - 1, top + 8), "b")
            cv.fill(rect(cx - hw + 3, top + 11, cx - 3, top + 23), "g")
            for k, wd in enumerate((14, 11, 8)):
                cv.fill(rect(cx - 1, top + 11 + k * 4, cx - 1 + wd, top + 13 + k * 4), "G")
            cv.fill(rect(cx - 1, top + 25, cx + 8, top + 28), "k")
        elif ui == "button":
            cv.fill(rect(cx - 6, cy + 2, cx + 6, cy + 3), "w")
        elif ui == "box":
            prog = min(1, max(0, (f - 33) / 4))          # the check mark draws itself
            pts = list(line(cx - 6, cy + 3, cx - 3, cy + 7)) + list(line(cx - 3, cy + 7, cx + 6, cy - 1))
            pts = sorted(set(pts), key=lambda p: p[0])
            for (x, y) in pts[: round(len(pts) * prog)]:
                cv.fill({(x, y), (x, y + 1)}, "k")

    # eyes: always there, so it is clearly the same creature
    ey = round(top + hh * 0.5) if not ui_mode else {"card": round(top + 2), "button": round(cy - 3), "box": round(top + 4)}[ui]
    blink = f in (2, 3) or f in (40, 41)
    for ex in (cx - 7, cx + 4):
        if blink:
            cv.fill(rect(ex, ey + 2, ex + 3, ey + 3), "e")
        else:
            cv.fill(rect(ex, ey, ex + 3, ey + 4), "w")
            cv.fill(rect(ex + 1, ey + 1, ex + 3, ey + 3), "e")
    # happy mouth on the plain blob
    if not ui_mode:
        my = ey + 6
        cv.fill({(cx - 1, my), (cx, my), (cx - 2, my - 1), (cx + 1, my - 1)}, "e")
    return cv.image()


if __name__ == "__main__":
    frames = [frame(i) for i in range(FRAMES)]
    paths = save_gif(frames, "b-morph", ms=75, sizes=(8, 4))
    contact_sheet(frames[::2], paths[0].with_name("_sheet-b.png"), cols=6)
    print(paths)
