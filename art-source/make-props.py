#!/usr/bin/env python3
"""Draws the yard props that didn't come from a sprite sheet.

Everything here is built from shaded primitives at 4x and downsampled, which
is what keeps them sitting next to the painted sprites rather than looking
like flat vector clip art. Re-run to regenerate:

    python3 art-source/make-props.py

Output goes straight into assets/props/. Each sprite is trimmed to its own
ink, because game.js derives collision from the sprite's aspect ratio and a
stray transparent margin would quietly widen the footprint.
"""

import math
import os
from PIL import Image, ImageDraw, ImageFilter

SS = 4                     # supersample factor
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'props')


# ---------------------------------------------------------------- helpers

def canvas(w, h):
    return Image.new('RGBA', (w * SS, h * SS), (0, 0, 0, 0))


def vgrad(w, h, top, bot):
    """A vertical ramp between two colours, at supersampled size."""
    col = Image.new('RGB', (1, h))
    px = col.load()
    for y in range(h):
        t = y / max(1, h - 1)
        px[0, y] = tuple(round(top[i] + (bot[i] - top[i]) * t) for i in range(3))
    return col.resize((w, h), Image.BILINEAR).convert('RGBA')


def shaded(size, mask, top, bot):
    """Fill a mask with a vertical ramp."""
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    layer.paste(vgrad(size[0], size[1], top, bot), (0, 0), mask)
    return layer


def mask_of(size, draw_fn):
    m = Image.new('L', size, 0)
    draw_fn(ImageDraw.Draw(m))
    return m


def contour(layer, px=3, colour=(14, 16, 18, 235)):
    """A dark rim around whatever is opaque, the way the painted sprites read."""
    a = layer.split()[3]
    grown = a.filter(ImageFilter.MaxFilter(px * 2 * SS + 1))
    rim = Image.new('RGBA', layer.size, colour)
    out = Image.new('RGBA', layer.size, (0, 0, 0, 0))
    out.paste(rim, (0, 0), grown)
    out.alpha_composite(layer)
    return out


def sheen(layer, mask, cx, cy, rx, ry, strength=150, blur=14):
    """A soft bright blob clipped to the shape, standing in for a specular."""
    glow = Image.new('L', layer.size, 0)
    ImageDraw.Draw(glow).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=strength)
    glow = glow.filter(ImageFilter.GaussianBlur(blur * SS))
    clipped = Image.new('L', layer.size, 0)
    clipped.paste(glow, (0, 0), mask)
    white = Image.new('RGBA', layer.size, (255, 255, 255, 255))
    layer.paste(white, (0, 0), clipped)
    return layer



def stroke_tube(d, pts, width, base, light, spec, lit=-0.26):
    """A round-looking metal tube: full-width dark base, a narrower lit core
    offset toward the light, then a thin specular. Cheaper than real shading
    and it survives being scaled down to 40 pixels, which a gradient does not."""
    w = int(width * SS)
    off = int(width * lit * SS)
    scaled = [(x * SS, y * SS) for x, y in pts]
    d.line(scaled, fill=base, width=w, joint='curve')
    d.line([(x + off, y + off) for x, y in scaled], fill=light,
           width=max(1, int(w * 0.42)), joint='curve')
    d.line([(x + int(off * 1.5), y + int(off * 1.5)) for x, y in scaled], fill=spec,
           width=max(1, int(w * 0.16)), joint='curve')


def ground_shadow(size, cx, cy, rx, ry, alpha=90, blur=7):
    sh = Image.new('L', size, 0)
    ImageDraw.Draw(sh).ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=alpha)
    sh = sh.filter(ImageFilter.GaussianBlur(blur * SS))
    out = Image.new('RGBA', size, (0, 0, 0, 0))
    out.paste(Image.new('RGBA', size, (18, 26, 16, 255)), (0, 0), sh)
    return out


def finish(name, layer, out_h):
    """Trim, downsample and write."""
    bbox = layer.split()[3].point(lambda v: 255 if v > 6 else 0).getbbox()
    layer = layer.crop(bbox)
    w = max(1, round(layer.width * out_h * SS / layer.height / SS))
    layer = layer.resize((w, out_h), Image.LANCZOS)
    path = os.path.normpath(os.path.join(OUT, name + '.png'))
    layer.save(path)
    print('%-12s %4dx%-4d  %s' % (name, layer.width, layer.height, path))
    return layer


# ---------------------------------------------------------------- sprites

def tire():
    """A car tyre dumped flat in the grass. The hole is left transparent so
    the lawn shows through it."""
    W, H = 240, 150
    size = (W * SS, H * SS)
    out = ground_shadow(size, 120 * SS, 106 * SS, 96 * SS, 28 * SS, 145, 8)

    ring = mask_of(size, lambda d: (
        d.ellipse([18 * SS, 20 * SS, 222 * SS, 132 * SS], fill=255),
        d.ellipse([74 * SS, 54 * SS, 166 * SS, 106 * SS], fill=0)))
    rubber = shaded(size, ring, (66, 70, 79), (16, 17, 21))

    # tread blocks cut around the crown
    tread = Image.new('RGBA', size, (0, 0, 0, 0))
    td = ImageDraw.Draw(tread)
    for i in range(34):
        a = i / 34 * 2 * math.pi
        cx = 120 * SS + math.cos(a) * 88 * SS
        cy = 76 * SS + math.sin(a) * 48 * SS
        r = 5 * SS
        td.ellipse([cx - r, cy - r * 0.6, cx + r, cy + r * 0.6], fill=(0, 0, 0, 105))
    clipped = Image.new('RGBA', size, (0, 0, 0, 0))
    clipped.paste(tread, (0, 0), ring)
    rubber.alpha_composite(clipped)

    sheen(rubber, ring, 78 * SS, 40 * SS, 52 * SS, 20 * SS, 120, 12)
    out.alpha_composite(contour(rubber, 2))
    return finish('tire', out, 132)


def trashcan():
    """A galvanised bin, lid on."""
    W, H = 150, 215
    size = (W * SS, H * SS)
    out = ground_shadow(size, 76 * SS, 194 * SS, 58 * SS, 15 * SS, 140, 8)

    body = mask_of(size, lambda d: (
        d.polygon([(24 * SS, 72 * SS), (126 * SS, 72 * SS),
                   (114 * SS, 186 * SS), (36 * SS, 186 * SS)], fill=255),
        d.ellipse([36 * SS, 174 * SS, 114 * SS, 198 * SS], fill=255),
        d.ellipse([24 * SS, 60 * SS, 126 * SS, 84 * SS], fill=255)))
    metal = shaded(size, body, (168, 176, 186), (52, 57, 64))

    detail = Image.new('RGBA', size, (0, 0, 0, 0))
    dd = ImageDraw.Draw(detail)
    for y in (96, 130, 164):
        dd.line([(22 * SS, y * SS), (128 * SS, y * SS)], fill=(0, 0, 0, 85), width=3 * SS)
        dd.line([(22 * SS, (y + 4) * SS), (128 * SS, (y + 4) * SS)], fill=(255, 255, 255, 55), width=2 * SS)
    # the dark side, so the cylinder turns away from the light
    dd.polygon([(98 * SS, 72 * SS), (126 * SS, 72 * SS),
                (114 * SS, 190 * SS), (94 * SS, 190 * SS)], fill=(0, 0, 0, 70))
    clipped = Image.new('RGBA', size, (0, 0, 0, 0))
    clipped.paste(detail, (0, 0), body)
    metal.alpha_composite(clipped)
    sheen(metal, body, 52 * SS, 108 * SS, 13 * SS, 56 * SS, 130, 9)

    lid = mask_of(size, lambda d: (
        d.ellipse([18 * SS, 46 * SS, 132 * SS, 82 * SS], fill=255),
        d.ellipse([58 * SS, 38 * SS, 92 * SS, 54 * SS], fill=255)))
    lid_layer = shaded(size, lid, (188, 196, 206), (86, 92, 101))
    sheen(lid_layer, lid, 56 * SS, 56 * SS, 26 * SS, 8 * SS, 160, 7)

    metal.alpha_composite(lid_layer)
    out.alpha_composite(contour(metal, 2))
    return finish('trashcan', out, 104)


def swingset():
    """An A-frame swing set: the kids' swing, and a tall sight blocker."""
    W, H = 430, 330
    size = (W * SS, H * SS)
    out = ground_shadow(size, 215 * SS, 300 * SS, 185 * SS, 20 * SS, 130, 9)

    BASE = (26, 52, 61, 255)
    LIGHT = (104, 158, 172, 255)
    SPEC = (196, 230, 238, 255)
    bar_y = 56

    frame = Image.new('RGBA', size, (0, 0, 0, 0))
    fd = ImageDraw.Draw(frame)
    for a, b in ((60, 18), (60, 102), (370, 328), (370, 412)):
        stroke_tube(fd, [(a, bar_y), (b, 296)], 11, BASE, LIGHT, SPEC)
    stroke_tube(fd, [(52, bar_y), (378, bar_y)], 13, BASE, LIGHT, SPEC, lit=-0.3)

    # chains and seats
    rig = Image.new('RGBA', size, (0, 0, 0, 0))
    rd = ImageDraw.Draw(rig)
    for sx in (148, 282):
        for dx in (-19, 19):
            for link in range(18):
                y = bar_y + 8 + link * 9
                rd.ellipse([(sx + dx - 3) * SS, y * SS, (sx + dx + 3) * SS, (y + 7) * SS],
                           outline=(150, 156, 164, 255), width=2 * SS)
                rd.point(((sx + dx - 2) * SS, (y + 2) * SS), fill=(226, 232, 240, 255))
        rd.rounded_rectangle([(sx - 27) * SS, 226 * SS, (sx + 27) * SS, 241 * SS],
                             radius=5 * SS, fill=(30, 32, 37, 255))
        rd.rounded_rectangle([(sx - 25) * SS, 227 * SS, (sx + 25) * SS, 233 * SS],
                             radius=3 * SS, fill=(92, 97, 106, 255))

    frame.alpha_composite(rig)
    out.alpha_composite(contour(frame, 2))
    return finish('swingset', out, 176)


def fence():
    """A run of picket fence: the one prop whose job is to close off a line
    rather than to be walked around."""
    W, H = 420, 150
    size = (W * SS, H * SS)
    out = ground_shadow(size, 210 * SS, 130 * SS, 194 * SS, 13 * SS, 130, 7)

    WOOD_TOP, WOOD_BOT = (232, 227, 210), (150, 143, 124)
    pickets = []
    x = 14
    while x < W - 26:
        pickets.append(x)
        x += 38

    def draw_pickets(d):
        for px_ in pickets:
            d.polygon([(px_ * SS, 44 * SS), ((px_ + 13) * SS, 30 * SS),
                       ((px_ + 26) * SS, 44 * SS), ((px_ + 26) * SS, 128 * SS),
                       (px_ * SS, 128 * SS)], fill=255)

    rails = mask_of(size, lambda d: (
        d.rectangle([10 * SS, 62 * SS, 410 * SS, 76 * SS], fill=255),
        d.rectangle([10 * SS, 100 * SS, 410 * SS, 114 * SS], fill=255)))
    rail_layer = shaded(size, rails, (196, 189, 170), (126, 119, 102))

    pick = mask_of(size, draw_pickets)
    picket_layer = shaded(size, pick, WOOD_TOP, WOOD_BOT)

    # a little grain so the flat faces aren't dead
    grain = Image.new('RGBA', size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain)
    for px_ in pickets:
        gd.line([((px_ + 8) * SS, 46 * SS), ((px_ + 8) * SS, 126 * SS)], fill=(0, 0, 0, 34), width=2 * SS)
        gd.line([((px_ + 19) * SS, 48 * SS), ((px_ + 19) * SS, 126 * SS)], fill=(255, 255, 255, 40), width=2 * SS)
    clipped = Image.new('RGBA', size, (0, 0, 0, 0))
    clipped.paste(grain, (0, 0), pick)
    picket_layer.alpha_composite(clipped)

    rail_layer.alpha_composite(picket_layer)
    out.alpha_composite(contour(rail_layer, 2))
    return finish('fence', out, 96)


if __name__ == '__main__':
    tire()
    trashcan()
    swingset()
    fence()
