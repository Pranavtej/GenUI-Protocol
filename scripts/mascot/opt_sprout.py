"""Option D — Sprout: a little tree-spirit that is an AST. It grows child nodes, and the leaves become UI widgets."""

import math

from pix import Canvas, contact_sheet, ease_out_back, ellipse, line, rect, save_gif

FRAMES = 28
ROOT = (32, 49)
CHILDREN = [(16, 31), (48, 31)]
LEAVES = [(7, 12), (24, 12), (40, 12), (57, 12)]
PARENT = [0, 0, 1, 1]


def icon(cv, kind, cx, cy, s, hot=False):
    """A tiny widget glyph about 12x9, scaled by s."""
    if s <= 0.05:
        return
    hw, hh = max(1, round(5 * s)), max(1, round(4 * s))
    body = "y" if hot else {"card": "w", "chart": "w", "button": "b", "toggle": "g"}[kind]
    cv.paint(rect(cx - hw, cy - hh, cx + hw, cy + hh), body)
    if s < 0.6:
        return
    if kind == "card":
        cv.fill(rect(cx - hw, cy - hh, cx + hw, cy - hh + 2), "b")
        cv.fill(rect(cx - hw + 2, cy - 1, cx + hw - 2, cy), "G")
        cv.fill(rect(cx - hw + 2, cy + 2, cx + hw - 5, cy + 3), "G")
    elif kind == "chart":
        for k, h in enumerate((3, 6, 4, 7)):
            x0 = cx - hw + 2 + k * 2
            cv.fill(rect(x0, cy + hh - 1 - h, x0 + 1, cy + hh - 1), "b" if k % 2 == 0 else "k")
    elif kind == "button":
        cv.fill(rect(cx - 3, cy, cx + 3, cy + 1), "w")
    else:
        cv.paint(rect(cx - hw, cy - hh, cx + hw, cy + hh), "k")
        cv.fill(rect(cx + 1, cy - 2, cx + hw - 1, cy + 2), "w")


def node(cv, cx, cy, s, kind="sq"):
    if s <= 0.05:
        return
    r = max(2, round(5 * s))
    cv.paint(ellipse(cx, cy, r, r), "l")
    cv.fill({(cx - r // 2, cy - r // 2)}, "w")


def pop(f, start, dur=5):
    if f < start:
        return 0.0
    return ease_out_back(min(1.0, (f - start) / dur))


def frame(f):
    cv = Canvas()
    t = f / FRAMES * 2 * math.pi
    bob = round(math.sin(t * 2) * 1)
    shrink = max(0.0, 1 - max(0, f - 23) / 4)             # everything folds away at the end of the loop
    swap = 17 <= f <= 20                                    # a "patch" arrives and one leaf changes

    # branches first (behind the nodes)
    grow1 = min(1, max(0, (f - 2) / 4)) * shrink
    for c in CHILDREN:
        end = (ROOT[0] + (c[0] - ROOT[0]) * grow1, ROOT[1] - 6 + bob + (c[1] - ROOT[1] + 6) * grow1)
        cv.fill(line(ROOT[0], ROOT[1] - 8 + bob, end[0], end[1]), "o")
    for i, lf in enumerate(LEAVES):
        g = min(1, max(0, (f - (6 + i)) / 4)) * shrink
        c = CHILDREN[PARENT[i]]
        end = (c[0] + (lf[0] - c[0]) * g, c[1] + (lf[1] - c[1]) * g)
        cv.fill(line(c[0], c[1], end[0], end[1]), "o")

    # leaves (widgets)
    kinds = ["card", "chart", "button", "toggle"]
    for i, lf in enumerate(LEAVES):
        s = pop(f, 8 + i * 1.5) * shrink
        kind = kinds[i]
        hot = False
        if i == 1 and swap:
            kind = "button" if f >= 19 else "chart"
            hot = f in (17, 18)
        icon(cv, kind, lf[0], lf[1], s, hot)

    # child nodes
    for i, c in enumerate(CHILDREN):
        node(cv, c[0], c[1], pop(f, 3 + i) * shrink)

    # root: the creature
    cv.fill(ellipse(32, 58, 11, 1.8), "g")
    rs = 1 + (0.06 * math.sin(t * 2))
    ry = round(8 * rs)
    cv.paint(ellipse(32, ROOT[1] + 1 + bob, 10, ry), "t")
    for (x, y) in ellipse(32, ROOT[1] + 1 + bob, 10, ry):
        if (x - 32) + (y - ROOT[1]) < -9:
            cv.px[(x, y)] = (120, 214, 198)
        elif y > ROOT[1] + ry - 3:
            cv.px[(x, y)] = (31, 111, 101)
    # a tiny sprout on top
    cv.paint(rect(31, ROOT[1] - ry - 4 + bob, 33, ROOT[1] - ry + 1 + bob), "k")
    cv.paint({(34, ROOT[1] - ry - 4 + bob), (35, ROOT[1] - ry - 5 + bob), (34, ROOT[1] - ry - 5 + bob), (35, ROOT[1] - ry - 4 + bob)}, "k")
    ey = ROOT[1] - 2 + bob
    for ex in (27, 34):
        if f == 14:
            cv.fill(rect(ex, ey + 1, ex + 3, ey + 2), "e")
        else:
            cv.fill(rect(ex, ey - 1, ex + 3, ey + 3), "w")
            cv.fill(rect(ex + 1, ey, ex + 3, ey + 2), "e")
    cv.fill({(30, ey + 5), (31, ey + 6), (32, ey + 6), (33, ey + 5)}, "e")
    cv.fill({(25, ey + 4), (26, ey + 4), (37, ey + 4), (38, ey + 4)}, "p")
    return cv.image()


if __name__ == "__main__":
    frames = [frame(i) for i in range(FRAMES)]
    paths = save_gif(frames, "d-sprout", ms=85, sizes=(8, 4))
    contact_sheet(frames[::2], paths[0].with_name("_sheet-d.png"), cols=7)
    print(paths)
