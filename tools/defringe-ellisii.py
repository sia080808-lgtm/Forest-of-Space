#!/usr/bin/env python3
"""Remove the pale background halo left around the Ellisii layers.

The layers were cut from the approved art on a cream background. Pixels near the
cut edge kept some of that cream, and the body layer kept a detached pale rim
under the nest leaf. Both were hidden in the still art but showed as a thin line
when the nest leaf lifts (held/walk). This script:

1. clears pale pixels (much brighter than the layer's own paint) within a few
   pixels of transparency,
2. drops small detached fragments,
3. recolours the remaining soft edge from the nearest opaque paint, keeping alpha.

Re-running only trims a few more soft edge pixels. Usage:
  python3 tools/defringe-ellisii.py [layer ...]
"""
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

DIR = Path(__file__).resolve().parent.parent / 'app/src/main/assets/web/assets/forest/species'
RIM = 10
TIP_Y = 410
LAYERS = ['body', 'leaf', 'fronds', 'foot-left', 'foot-right']


def near_transparent(alpha, radius):
    hole = Image.fromarray(((alpha < 8) * 255).astype(np.uint8))
    return np.array(hole.filter(ImageFilter.MaxFilter(2 * radius + 1))) > 0


def components(mask):
    h, w = mask.shape
    label = np.zeros((h, w), np.int32)
    sizes = [0]
    for y0, x0 in zip(*np.nonzero(mask)):
        if label[y0, x0]:
            continue
        n = len(sizes)
        label[y0, x0] = n
        q = deque([(y0, x0)])
        size = 0
        while q:
            y, x = q.popleft()
            size += 1
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    yy, xx = y + dy, x + dx
                    if 0 <= yy < h and 0 <= xx < w and mask[yy, xx] and not label[yy, xx]:
                        label[yy, xx] = n
                        q.append((yy, xx))
        sizes.append(size)
    return label, np.array(sizes)


def defringe(name):
    path = DIR / f'ellisii-{name}.png'
    a = np.array(Image.open(path).convert('RGBA')).astype(np.int32)
    rgb, alpha = a[..., :3], a[..., 3]
    lum = rgb.mean(-1)
    solid = alpha >= 250
    paint = np.median(lum[solid & ~near_transparent(alpha, 6)])
    pale = (alpha > 0) & (lum > paint + 35) & near_transparent(alpha, 5)
    alpha[pale] = 0
    label, sizes = components(alpha >= 8)
    keep = sizes >= 300
    keep[0] = False
    alpha[~keep[label]] = 0
    if name == 'body':
        # The body runs out to the nest leaf's outer rim. When the leaf lifts and turns,
        # that rim shows as a thin dark sliver, so tuck the covered rim in under the leaf.
        leaf = np.array(Image.open(DIR / 'ellisii-leaf.png').convert('RGBA'))[..., 3].astype(np.int32)
        union = np.maximum(alpha, leaf)
        tuck = (leaf >= 8) & near_transparent(union, RIM)
        tuck[TIP_Y:] = False  # keep the body under the leaf tip, which sits on the body's side
        alpha[tuck] = 0
    # Recolour the soft edge from nearby opaque paint so no cream bleeds through.
    core = (alpha >= 250) & ~near_transparent(alpha, 1)
    fill = rgb.copy()
    known = core.copy()
    for _ in range(6):
        if known.all():
            break
        acc = np.zeros(rgb.shape, np.float64)
        cnt = np.zeros(alpha.shape, np.float64)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                sh_k = np.roll(np.roll(known, dy, 0), dx, 1)
                sh_c = np.roll(np.roll(fill, dy, 0), dx, 1)
                acc += sh_c * sh_k[..., None]
                cnt += sh_k
        grow = ~known & (cnt > 0)
        fill[grow] = (acc[grow] / cnt[grow, None]).round().astype(np.int32)
        known |= grow
    edge = (alpha > 0) & ~core
    rgb[edge] = np.where(known[edge, None], fill[edge], rgb[edge])
    out = np.dstack([rgb, alpha]).clip(0, 255).astype(np.uint8)
    out[alpha == 0] = 0
    Image.fromarray(out, 'RGBA').save(path, optimize=True)
    return int(pale.sum()), int((~keep[label] & (a[..., 3] >= 8)).sum())


if __name__ == '__main__':
    for n in sys.argv[1:] or LAYERS:
        cleared, dropped = defringe(n)
        print(f'{n}: pale edge {cleared}px cleared, fragments {dropped}px dropped')
