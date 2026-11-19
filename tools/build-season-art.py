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

# snow depth (px of the source picture) per picture: deep on stones, roof and broad leaves, light on the fine fern fronds
THICK = {'terrain': 34, 'shelter-art': 30, 'shade-plant': 18, 'shade-ground': 0, 'garden-dry': 12, 'frame': 12,
         **{f'fern-{i}': 6 for i in range(1, 7)}}
BIAS = {**{f'fern-{i}': -.25 for i in range(1, 7)}, 'frame': -.2}
GREY = np.array([196, 202, 206], np.float32); RIM = np.array([128, 134, 140], np.float32)

def solid_near(solid):
    return ndimage.binary_dilation(solid, iterations=2).astype(np.float32)

def heavy_snow(res, al, solid, T, seed, bias=0.0):
    """Snow lying on the surfaces that face the sky. The pictures are drawn from above at an angle, so the top of a stone,
    the roof of the shelter or the face of a broad leaf is a whole visible plane, not just the silhouette's edge: the
    snow covers the upper part of each object (by its height in that column) and, more, the parts the painting lights
    from above; the sides and the shadowed faces keep their colour. Snow is blank paper with a faint cool shade on its
    shadowed side, a soft grey ink line along its top and a faint one where it ends."""
    if T <= 0:
        return res, al
    H, W = solid.shape
    lab, n = ndimage.label(solid)
    if n:                                                   # tiny pieces (sprout tips, specks) get no snow
        size = ndimage.sum(np.ones_like(lab), lab, index=np.arange(1, n + 1))
        small = np.r_[False, size < max(160, T * T * .6)]; solid = solid & ~small[lab]; lab, n = ndimage.label(solid)
    top = np.full((n + 1) * W, H, np.int64); bot = np.zeros((n + 1) * W, np.int64)
    ys, xs = np.nonzero(lab); key = lab[ys, xs] * W + xs
    np.minimum.at(top, key, ys); np.maximum.at(bot, key, ys)
    run = np.zeros((H, W), np.float32); run[ys, xs] = ys - top[key] + 1
    frac = np.zeros((H, W), np.float32); frac[ys, xs] = (ys - top[key]) / np.maximum(1, bot[key] - top[key] + 1)
    L = res.mean(2); m = solid.astype(np.float32)
    sig = max(4, T * .8); loc = ndimage.gaussian_filter(L * m, sig) / np.maximum(ndimage.gaussian_filter(m, sig), 1e-3)
    lit = np.clip((L - loc) / 35, -1, 1)
    nz = noise((H, W), max(3, T * .9), seed)
    score = 1.05 + bias - frac * 1.75 + .45 * lit + .3 * (nz - .5)
    a = np.clip((score - .38) / .22, 0, 1) * solid; a = ndimage.gaussian_filter(a, .7) * solid
    shade = np.clip(.5 - lit * .5 + frac * .4, 0, 1)                  # shadowed / lower snow a touch grey
    col = SNOW * (1 - .22 * shade[..., None]) + GREY * (.22 * shade[..., None])
    out = res * (1 - a[..., None]) + col * a[..., None]
    rim = ndimage.gaussian_filter(a * (1 - a) * 4 * solid, .6) * .7
    edge = ndimage.gaussian_filter(((run == 1) & (a > .5)).astype(np.float32), .7) * 1.5
    rim = np.clip(rim + edge, 0, 1)
    out = out * (1 - .3 * rim[..., None]) + RIM * (.3 * rim[..., None])
    return out, al

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
        # (0.8.1) objects lie under a real layer of snow (user: "겨울에 오브젝트들에 눈 덮혀 있는 씬"): see heavy_snow
        # surfaces are painted pixels only: the paper-coloured halo some pictures have around an object is not a surface
        solid = (paperish[..., 0] > .6) & (al > (60 if kind == 'flora' else 200))   # opaque core only (sprites have a soft halo)
        solid = ndimage.binary_opening(solid, iterations=1)
        # light texture spots inside a stone or leaf are still part of its surface (otherwise the snow runs down in streaks)
        solid = ndimage.binary_fill_holes(ndimage.binary_closing(solid, iterations=2)) & (al > 30)
        res, al = heavy_snow(res, al, solid, THICK.get(name, 8), 21 + len(name), BIAS.get(name, 0.0))
        if name == 'shelter-art':
            # inside the arch: the warm light paper-brown becomes a cool pale shade (no cream hole on the snow)
            Lm = res.mean(2); sat = (res.max(2) - res.min(2)) / np.maximum(res.max(2), 1)
            inner = np.clip((Lm - 140) / 40, 0, 1) * np.clip((.32 - sat) / .12, 0, 1)
            res = res + (np.array([226, 228, 228], np.float32) - res) * (inner[..., None] * .65)
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
