# 0.8.1 사계절 풍경 (수묵 담채): one seasonal palette applied to every landscape picture, so the whole map turns as one
# landscape (user: "하나의 풍경 느낌이 나게 … 전체 맵이. 다만 수묵화라는 컨셉을 생각하며 색감을 설정"). Made from the
# original pixels of each picture. Summer is the original picture.
# User: "기존 우리 디폴트 화면 배경 색 … 유지하되 다양한 계절별 느낌이 나게 구성": the paper colour never changes; only the
# plants, stones and soil take the season, and the season's scenery (sprouts, fallen leaves, snow) is added by the game.
# Ink-wash rules: ink lines and dark strokes stay; colour is a light, low-saturation wash (saturation capped ~0.35);
# snow is not painted white on top of the picture but left as paper (the picture fades toward the paper colour).
#  spring: pale celadon new leaves, a few soft plum-blossom dabs on the ferns, airy light paper
#  autumn: ochre / sienna washes in soft patches on the leaves, a slightly warmer paper
#  winter: leaves fade to ink grey; upward edges and open ground turn to paper-white snow; cooler paper
# Leaf pixels: hue 22~170 with some saturation (the painting's leaves are olive / yellow-green). Stems, outlines, stones
# and water keep their hue and only take the paper/season grade.
# Output: <out>/<name>-<season>.(png|jpg). Usage: python3 tools/build-season-art.py [outDir]
import numpy as np, os, sys
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app/src/main/assets/web/assets/forest')
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'seasons'); os.makedirs(OUT, exist_ok=True)
# name: (file, kind) kind: 'sprite' (alpha, objects drawn on the floor), 'floor' (opaque ground), 'flora' (ferns: blossoms)
SRC = {'frame': ('frame.png', 'flora'), 'shade-plant': ('shade-plant.png', 'sprite'), 'shade-ground': ('shade-ground.png', 'sprite'),
       'terrain': ('terrain.png', 'sprite'), 'shelter-art': ('shelter-art.png', 'sprite'),
       'garden-dry': ('garden-dry.png', 'floor'),
       **{f'fern-{i}': (f'ferns/fern-{i}.png', 'flora') for i in range(1, 7)}}
PAPER = np.array([252, 239, 224], np.float32)
SNOW = np.array([248, 247, 243], np.float32)        # paper white, a touch warm (rice paper, not blue)

def hsv(rgb):
    r, g, b = [rgb[..., i] / 255 for i in range(3)]
    mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b); d = mx - mn
    m = d > 1e-6; dd = np.where(m, d, 1)
    rc, gc, bc = (mx - r) / dd, (mx - g) / dd, (mx - b) / dd
    h = np.where(r == mx, bc - gc, np.where(g == mx, 2 + rc - bc, 4 + gc - rc)); h = (h / 6) % 1; h[~m] = 0
    return h, np.where(mx > 0, d / np.maximum(mx, 1e-6), 0), mx

def rgb_of(h, s, v):
    i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    return np.dstack([np.choose(i, [v, q, p, p, t, v]), np.choose(i, [t, v, v, q, p, p]), np.choose(i, [p, p, t, v, v, q])]) * 255

def noise(shape, scale, seed):
    n = ndimage.gaussian_filter(np.random.default_rng(seed).random(shape), scale)
    return (n - n.min()) / max(1e-6, n.max() - n.min())

def season(name, im, kind, se):
    a = np.asarray(im.convert('RGBA')).astype(np.float32); rgb, al = a[..., :3].copy(), a[..., 3].copy()
    H, W = al.shape
    h, s, v = hsv(rgb); hd = h * 360
    if kind == 'flora':   # the fern art is olive (hue ~43) and pale
        leaf = np.clip((hd - 22) / 10, 0, 1) * np.clip((170 - hd) / 20, 0, 1) * np.clip((s - .08) / .12, 0, 1) * (al > 8)
    else:                 # elsewhere straw, paper and stone sit at hue 25~45 / low saturation: only real greens are leaves
        leaf = np.clip((hd - 46) / 10, 0, 1) * np.clip((170 - hd) / 20, 0, 1) * np.clip((s - .16) / .12, 0, 1) * (al > 8)
    ink = np.clip((.55 - v) / .35, 0, 1)                        # dark strokes: keep them (ink)
    edge = np.clip(1 - ndimage.distance_transform_edt(al > 40) / 8, 0, 1)
    if se == 'spring':
        nh = np.full_like(h, 84 / 360); ns = np.minimum(s * .8, .32); nv = np.clip(v * 1.04 + .02, 0, 1)
        grade = lambda x: x + (PAPER - x) * .04            # airy
    elif se == 'autumn':
        n = noise((H, W), max(H, W) / 14, 7 + len(name))
        nh = (16 + 26 * n - 4 * edge) / 360; ns = np.minimum(s * 1.1 + .06, .38); nv = np.clip(v * (.99 - .04 * n), 0, 1)
        grade = lambda x: x * np.array([1.0, .985, .955], np.float32)
    elif se == 'winter':
        nh = h; ns = s * .12; nv = np.clip(v * 1.02 + .02, 0, 1)
        grade = lambda x: x + (SNOW - x) * .10
    else:
        return im
    wash = rgb_of(nh % 1, ns, nv)
    k = (leaf * (1 - .6 * ink))[..., None]
    # paper-coloured pixels keep the default background colour exactly
    paperish = np.clip((np.abs(rgb - PAPER).max(2) - 10) / 30, 0, 1)[..., None]
    mixed = rgb * (1 - k) + wash * k
    res = mixed + (grade(mixed) - mixed) * paperish
    if se == 'winter':
        # non-leaf colour also fades toward ink grey (stones, soil): low saturation
        g = res.mean(2, keepdims=True); res = res + (g - res) * (.45 * paperish)
        if False:
            # (0.8.1 draft) open ground became snow; the paper now stays and snow drifts are drawn by the game: large soft patches of paper, thinner where the painting has strokes
            pat = noise((H, W), max(H, W) / 30, 3); pat = np.clip((pat - .3) / .3, 0, 1) * (1 - ink * .8)
            res = res + (SNOW - res) * (pat[..., None] * .75)
        else:
            # snow on upward-facing edges, as paper left blank
            solid = al > 60; up = np.zeros_like(solid)
            for dy in (1, 2):
                sh = np.zeros_like(solid); sh[dy:] = solid[:-dy]; up |= ~sh
            cap = (solid & up).astype(np.float32); kk = max(3, H // 220)
            depth = np.zeros_like(al)
            for dy in range(kk):
                sh = np.zeros_like(cap); sh[dy:] = cap[:H - dy] if dy else cap; depth = np.maximum(depth, sh * (1 - dy / kk))
            depth = ndimage.gaussian_filter(depth * solid, 1.2) * (noise((H, W), 3, 11) > .3)
            res = res + (SNOW - res) * (depth[..., None] * .92); al = np.maximum(al, depth * 230)
    if se == 'winter':
        # on the white snow the picture's own paper (soft edges, gaps between strokes) must not show as a cream cut-out:
        # paper-coloured pixels become snow-white
        res = res + (SNOW - res) * (1 - paperish)
    if se == 'spring' and kind == 'flora':
        # a few plum-blossom dabs at frond tips (soft, pale, like a light brush touch)
        rng = np.random.default_rng(5 + len(name)); tips = np.argwhere((edge > .5) & (leaf > .5) & (al > 80))
        if len(tips):
            pick = tips[rng.random(len(tips)) < min(1, 90 / len(tips) * (H * W / 1.5e6))]
            yy, xx = np.mgrid[0:H, 0:W]; blos = np.zeros((H, W), np.float32)
            for y, x in pick[:400]:
                r = rng.uniform(2.5, 5.5) * max(1, H / 800)
                y0, y1, x0, x1 = max(0, int(y - r * 2)), min(H, int(y + r * 2) + 1), max(0, int(x - r * 2)), min(W, int(x + r * 2) + 1)
                d = np.hypot(yy[y0:y1, x0:x1] - y, xx[y0:y1, x0:x1] - x)
                blos[y0:y1, x0:x1] = np.maximum(blos[y0:y1, x0:x1], np.clip(1 - d / r, 0, 1) ** .6)
            pink = np.array([228, 168, 166], np.float32)
            res = res + (pink - res) * (blos[..., None] * .55); al = np.maximum(al, blos * 200)
    out = np.clip(res, 0, 255)
    if kind == 'floor':
        return Image.fromarray(out.astype(np.uint8), 'RGB')
    return Image.fromarray(np.dstack([out, al]).astype(np.uint8), 'RGBA')

for name, (f, kind) in SRC.items():
    im = Image.open(os.path.join(ROOT, f))
    for se in ('spring', 'autumn', 'winter'):
        o = season(name, im, kind, se)
        if kind == 'floor':
            o.save(os.path.join(OUT, f'{name}-{se}.jpg'), quality=90)
        else:
            o.save(os.path.join(OUT, f'{name}-{se}.png'), optimize=True)
    print(name, flush=True)
