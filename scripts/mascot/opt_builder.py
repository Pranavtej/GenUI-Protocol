"""Option C — Builder: a small robot that catches UI blocks out of the sky and stacks them into a dashboard."""

import math

from pix import Canvas, contact_sheet, ellipse, line, rect, save_gif

FRAMES = 28
FLOOR = 57
BX = 43                                  # centre of the dashboard stack


def robot(cv, x, f, left_up, right_up, jump, blink):
    """Little robot standing with its feet at FLOOR - jump, centred on x."""
    base = FLOOR - jump
    cv.fill(ellipse(x, FLOOR + 1, 8 - jump * 0.4, 1.4), "g")
    # legs
    cv.paint(rect(x - 5, base - 6, x - 1, base), "G")
    cv.paint(rect(x + 1, base - 6, x + 5, base), "G")
    # body
    cv.paint(rect(x - 6, base - 17, x + 6, base - 6), "b")
    cv.fill(rect(x - 3, base - 14, x + 3, base - 10), "B")
    cv.fill({(x - 1, base - 13), (x + 1, base - 13)}, "y")
    # arms: down, or raised
    for side, up in ((-1, left_up), (1, right_up)):
        sx = x + side * 7
        top = base - 15
        if up:
            cv.paint(line(sx, top, sx + side * 2, top - 8) | line(sx + side, top, sx + side * 3, top - 8), "G")
            cv.paint(rect(sx + side * 2 - 1, top - 11, sx + side * 2 + 2, top - 8), "r")
        else:
            cv.paint(line(sx, top, sx + side * 1, top + 8) | line(sx + side, top, sx + side * 2, top + 8), "G")
    # head
    cv.paint(rect(x - 8, base - 31, x + 8, base - 17), "t")
    cv.fill(rect(x - 6, base - 28, x + 6, base - 21), "o")                 # visor
    for ex in (x - 4, x + 1):
        if blink:
            cv.fill(rect(ex, base - 25, ex + 3, base - 24), "l")
        else:
            cv.fill(rect(ex, base - 26, ex + 3, base - 23), "l")
    cv.fill({(x - 2, base - 19), (x - 1, base - 18), (x, base - 18), (x + 1, base - 19)}, "o") if False else None
    # antenna
    cv.fill({(x, base - 32), (x, base - 33)}, "o")
    cv.paint(rect(x - 1, base - 36, x + 2, base - 33), "r")


def block(cv, kind, y, squash=0):
    """The three dashboard blocks; `y` is the top edge."""
    if kind == "chart":
        w, h = 28, 16 - squash
        top = y + squash
        cv.paint(rect(BX - w // 2, top, BX + w // 2, top + h), "w")
        for k, bh in enumerate((6, 10, 8, 12)):
            x0 = BX - w // 2 + 3 + k * 7
            cv.fill(rect(x0, top + h - 2 - bh, x0 + 4, top + h - 2), "b" if k % 2 == 0 else "k")
    elif kind == "kpi":
        w, h = 28, 11 - squash
        top = y + squash
        cv.paint(rect(BX - w // 2, top, BX + w // 2, top + h), "w")
        cv.fill(rect(BX - w // 2 + 3, top + 3, BX - w // 2 + 12, top + 4), "G")
        cv.fill(rect(BX - w // 2 + 3, top + 6, BX - w // 2 + 17, top + 8), "o")
        cv.fill(rect(BX + 6, top + 4, BX + 12, top + 8), "k")
    else:
        w, h = 14, 7 - squash
        top = y + squash
        cv.paint(rect(BX - w // 2, top, BX + w // 2, top + h), "b")
        cv.fill(rect(BX - 4, top + h // 2, BX + 4, top + h // 2 + 1), "w")


def sparkle(cv, cx, cy, r):
    for d in range(1, r + 1):
        cv.fill({(cx + d, cy), (cx - d, cy), (cx, cy + d), (cx, cy - d)}, "y")
    cv.fill({(cx, cy)}, "y")


TARGET = {"chart": FLOOR - 16, "kpi": FLOOR - 16 - 11, "button": FLOOR - 16 - 11 - 7}
DROPS = [("chart", 1), ("kpi", 8), ("button", 15)]       # (kind, frame it is released)


def block_state(kind, release, f):
    """Returns (y, squash) or None while hidden."""
    land = release + 4
    if f < release:
        return None
    if f < land:
        u = (f - release + 1) / (land - release)
        return -16 + (TARGET[kind] + 16) * u * u, 0
    if f == land:
        return TARGET[kind], 2
    return TARGET[kind], 0


def frame(f):
    cv = Canvas()
    celebrate = 21 <= f <= 24
    vanish = f >= 25
    left_up = celebrate
    right_up = celebrate or any(r - 1 <= f <= r + 1 for _, r in DROPS)
    jump = (4 if f in (21, 23) else (6 if f in (22,) else 0)) if celebrate else 0
    blink = f == 12
    robot(cv, 14, f, left_up, right_up, jump, blink)

    # base platform for the stack
    cv.fill(rect(BX - 17, FLOOR, BX + 17, FLOOR + 2), "G")
    if not vanish:
        for kind, release in DROPS:
            st = block_state(kind, release, f)
            if st:
                block(cv, kind, round(st[0]), st[1])
        if f == 5:
            sparkle(cv, BX - 18, FLOOR - 4, 2)
        if f == 12:
            sparkle(cv, BX + 18, FLOOR - 16, 2)
        if f == 19:
            sparkle(cv, BX + 10, TARGET["button"] - 3, 2)
        if celebrate:
            sparkle(cv, BX - 16 + (f - 21) * 2, TARGET["button"] - 6 - (f % 2) * 2, 1 + (f % 2))
            sparkle(cv, BX + 14 - (f - 21), TARGET["kpi"] - 3 + (f % 2) * 2, 1 + ((f + 1) % 2))
    elif f == 25:
        for k in range(8):
            ang = k / 8 * 2 * math.pi
            cv.fill({(round(BX + math.cos(ang) * 14), round(FLOOR - 16 + math.sin(ang) * 10))}, "y")
    return cv.image()


if __name__ == "__main__":
    frames = [frame(i) for i in range(FRAMES)]
    paths = save_gif(frames, "c-builder", ms=85, sizes=(8, 4))
    contact_sheet(frames[::2], paths[0].with_name("_sheet-c.png"), cols=7)
    print(paths)
