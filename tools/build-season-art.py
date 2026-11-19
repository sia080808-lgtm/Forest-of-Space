# 0.8.0 사계절 (SRS v2.31 SE-08): seasonal versions of the fern frame, the fern clumps and the leaf-shade plant, made from
# the original pixels of each picture (user: "계절별 그림 따로"). Summer is the original picture.
#  spring: fresh yellow-green, the frond tips lighter (new growth)
#  autumn: the greens turn ochre, orange and rust in soft patches (low-frequency noise), tips a little redder
#  winter: the greens fade to a cool grey-green, and snow lies on the upward-facing edges (pixels with open sky above)
# Brown stems, outlines and paper keep their colour; only green-ish pixels change. Alpha is unchanged.
# Output: assets/forest/seasons/<name>-<season>.png. Usage: python3 tools/build-season-art.py
import numpy as np, os, colorsys
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app/src/main/assets/web/assets/forest')
OUT = os.path.join(ROOT, 'seasons'); os.makedirs(OUT, exist_ok=True)
SRC = {'frame': 'frame.png', 'shade-plant': 'shade-plant.png', **{f'fern-{i}': f'ferns/fern-{i}.png' for i in range(1, 7)}}

def hsv(rgb):
    r, g, b = [rgb[..., i] / 255 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-6
    rc = np.where(m, (mx - r) / np.where(m, d, 1), 0); gc = np.where(m, (mx - g) / np.where(m, d, 1), 0); bc = np.where(m, (mx - b) / np.where(m, d, 1), 0)
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1; h[~m] = 0
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx

def rgb_of(h, s, v):
    i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.dstack([r, g, b]) * 255

def noise(shape, scale, seed):
    rng = np.random.default_rng(seed)
    n = ndimage.gaussian_filter(rng.random(shape), scale)
    return (n - n.min()) / max(1e-6, n.max() - n.min())

def season(name, im, se):
    a = np.asarray(im).astype(np.float32); rgb, al = a[..., :3], a[..., 3]
    h, s, v = hsv(rgb)
    # leafy pixels: the painting's leaves are olive / yellow-green (hue about 40~60 degrees), so hue 22~170 with some
    # saturation counts as leaf; brown stems (hue < 22) and paper keep their colour
    hd = h * 360
    green = np.clip((hd - 22) / 10, 0, 1) * np.clip((170 - hd) / 20, 0, 1) * np.clip((s - .1) / .12, 0, 1) * (al > 8)
    H, W = h.shape
    dist = ndimage.distance_transform_edt(al > 40); tip = np.clip(1 - dist / 8, 0, 1)
    if se == 'spring':
        # fresh green with lighter, yellower tips (new growth)
        nh = (76 - 12 * tip) / 360 + 0 * h; ns = np.clip(s * 1.02, 0, 1); nv = np.clip(v * (1.02 + .06 * tip), 0, 1)
    elif se == 'autumn':
        n = noise((H, W), max(H, W) / 16, 7 + len(name))
        nh = (10 + 30 * n - 6 * tip) / 360                              # rust (4) .. amber (40), in soft patches
        ns = np.clip(s * 1.5 + .12, 0, 1); nv = np.clip(v * (.97 - .05 * n), 0, 1)
    elif se == 'winter':
        nh = 175 / 360 + 0 * h; ns = s * .22; nv = np.clip(v * .96 + .05, 0, 1)
    else:
        return im
    out = rgb_of(nh % 1, ns, nv)
    res = rgb * (1 - green[..., None]) + out * green[..., None]
    if se == 'winter':
        # snow on upward-facing edges: an opaque pixel whose pixels just above are open sky gets white, a few px deep
        solid = al > 60
        up = np.zeros_like(solid); k = max(2, H // 300)
        for dy in range(1, k + 3):
            sh = np.zeros_like(solid); sh[dy:] = solid[:-dy]
            up |= ~sh if dy <= 2 else False
        cap = solid & up
        depth = np.zeros_like(al)
        for dy in range(0, k * 2):
            sh = np.zeros_like(cap); sh[dy:] = cap[:H - dy] if dy else cap
            depth = np.maximum(depth, sh * (1 - dy / (k * 2)))
        depth = ndimage.gaussian_filter(depth * solid, 1.2) * (ndimage.gaussian_filter(noise((H, W), 3, 11), 1) > .35)
        snow = np.array([246, 249, 252], np.float32)
        res = res * (1 - depth[..., None] * .9) + snow * depth[..., None] * .9
        al = np.maximum(al, depth * 235)
    return Image.fromarray(np.dstack([np.clip(res, 0, 255), al]).astype(np.uint8), 'RGBA')

for name, f in SRC.items():
    im = Image.open(os.path.join(ROOT, f)).convert('RGBA')
    for se in ('spring', 'autumn', 'winter'):
        season(name, im, se).save(os.path.join(OUT, f'{name}-{se}.png'), optimize=True)
    print(name)
