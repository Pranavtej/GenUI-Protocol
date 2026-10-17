"""Builds the final mascot assets (Builder) from the generator in opt_builder.py.

    python3 scripts/mascot/mascot.py

Writes to docs/assets/mascot/: genui-mascot.gif (512px) and -256.gif, genui-mascot.png (still), genui-avatar.png
(opaque, for an org/profile picture), favicon.ico, and docs/assets/social-preview.png (1280x640).
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

import opt_builder
from pix import GRID, OPTIONS, save_gif

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs" / "assets" / "mascot"
STILL = 20        # the frame where the dashboard is complete
FONT_DIR = Path("/usr/share/fonts/opentype/inter")


def font(name, size):
    for candidate in (FONT_DIR / name, Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size=size)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    frames = [opt_builder.frame(i) for i in range(opt_builder.FRAMES)]

    # animated GIFs (save_gif writes next to the options; move them into place)
    import shutil
    paths = save_gif(frames, "genui-mascot", ms=85, sizes=(8, 4))
    for p in paths:
        shutil.move(p, OUT / p.name)

    still = frames[STILL]
    still.resize((GRID * 8, GRID * 8), Image.NEAREST).save(OUT / "genui-mascot.png")

    # favicon: the robot's head (a whole dashboard is unreadable at 16px), padded square
    crop = still.crop((5, 19, 24, 41))
    side = max(crop.size) + 2
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.alpha_composite(crop, ((side - crop.width) // 2, (side - crop.height) // 2))
    ico = [sq.resize((s, s), Image.NEAREST) for s in (16, 32, 48)]
    ico[2].save(OUT / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=ico[:2])

    # avatar: opaque soft background, mascot large and centred
    av = Image.new("RGBA", (512, 512), (230, 246, 243, 255))
    full = still.crop(still.getbbox())
    k = 440 // max(full.size)
    big = full.resize((full.width * k, full.height * k), Image.NEAREST)
    av.alpha_composite(big, ((512 - big.width) // 2, (512 - big.height) // 2))
    av.convert("RGB").save(OUT / "genui-avatar.png")

    # social preview (GitHub repository settings -> Social preview)
    W, H = 1280, 640
    card = Image.new("RGBA", (W, H), (248, 250, 252, 255))
    scale = 9
    spr = still.resize((GRID * scale, GRID * scale), Image.NEAREST)
    card.alpha_composite(spr, (30, (H - spr.height) // 2))
    d = ImageDraw.Draw(card)
    d.rectangle((0, H - 10, W, H), fill=(42, 157, 143))
    x = 650
    d.text((x, 200), "GenUI Protocol", font=font("Inter-Bold.otf", 76), fill=(15, 23, 42))
    d.text((x, 308), "Let AI agents answer with interfaces,", font=font("Inter-Regular.otf", 31), fill=(71, 85, 105))
    d.text((x, 352), "not just text.", font=font("Inter-Regular.otf", 31), fill=(71, 85, 105))
    d.text((x, 440), "Open protocol  ·  React & Angular  ·  MCP server", font=font("Inter-SemiBold.otf", 24), fill=(31, 111, 101))
    card = card.convert("RGB")
    card.save(ROOT / "docs" / "assets" / "social-preview.png")
    print("wrote", OUT)


if __name__ == "__main__":
    main()
