"""Split the approved 슈퍼범 art (cut by tools/cut-superbum.py) into rig layers, keeping the original pixels.

Two complete sets, one per state, drawn from the user's two pictures: 'dry' (마른 둥지) and 'wet' (물 고인 둥지).
Each set: crown (nest frond; the wet one holds the water and drops), body (head with eyes), foot-left/right, and the
pendant antler leaves split per side into a back part (behind the body) and a front part (the inner lobes that overlap
the body). Hidden pixels that motion can reveal are filled by inpainting from neighbouring original pixels only:
the body under the front leaves and under the hood, the feet under the body, and a band of skirt under the crown rim.
All layers share one canvas (W x H) with the feet's ground centre at ANCHOR, scaled by SCALE.
usage: python3 -I tools/rig-superbum.py <dir with superbum-dry-src.png / superbum-wet-src.png> <out dir>"""
import sys
import json
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage

src_dir, out = sys.argv[1], sys.argv[2]
SCALE, W, H, ANCHOR = 0.6, 480, 420, (240, 404)
# per state: crown/skirt boundary (x, y) in source px, body centre x, foot ellipses (cx, cy, rx, ry), ground y
STATE = {
    'dry': dict(rim=[(0, 335), (100, 350), (180, 378), (260, 388), (330, 345), (400, 330), (470, 345), (540, 388),
                     (620, 378), (700, 350), (769, 335)],
                cx=400, feet=[(296, 612, 50, 30), (503, 612, 50, 30)], ground=640),
    'wet': dict(rim=[(0, 230), (100, 282), (180, 335), (260, 348), (380, 330), (500, 348), (580, 335), (660, 290),
                     (735, 240)],
                cx=380, feet=[(272, 607, 48, 28), (488, 607, 48, 28)], ground=634),
}


def boundary(rim, w):
    xs, ys = zip(*rim)
    return np.interp(np.arange(w), xs, ys)


def inpaint(rgb, known, want, r=9):
    """fill `want` pixels from `known` neighbours (original colours only)"""
    img = rgb.astype(np.uint8).copy()
    # everything that is not a known pixel of this part counts as unknown, so colours never leak in from other parts
    near = ndimage.binary_dilation(want, iterations=4)
    hole = (near & ~known).astype(np.uint8)
    img[hole.astype(bool)] = 0
    ys, xs = np.nonzero(near | known)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    out = img.copy()
    sub_known = known[y0:y1, x0:x1]
    sub = img[y0:y1, x0:x1].copy()
    sub_hole = (~sub_known).astype(np.uint8)
    out[y0:y1, x0:x1] = cv2.inpaint(sub, sub_hole, r, cv2.INPAINT_TELEA)
    return out


def hull(mask):
    pts = cv2.findNonZero(mask.astype(np.uint8))
    h = cv2.convexHull(pts)
    m = np.zeros(mask.shape, np.uint8)
    cv2.fillPoly(m, [h], 1)
    return m.astype(bool)


meta = {'scale': SCALE, 'size': [W, H], 'anchor': ANCHOR}
for name, st in STATE.items():
    a = np.asarray(Image.open(f'{src_dir}/superbum-{name}-src.png').convert('RGBA')).astype(float)
    rgb, A = a[..., :3], a[..., 3] / 255
    h, w = A.shape
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    on = A > 0.02
    brown = on & (r > g + 8) & (g > b) & (r < 175)
    brown = ndimage.binary_opening(brown, iterations=1)
    lab, n = ndimage.label(brown)
    sizes = ndimage.sum(np.ones_like(A), lab, range(1, n + 1))
    brown = np.isin(lab, 1 + np.nonzero(sizes > 500)[0])
    eyes = ndimage.binary_fill_holes(brown) & ~brown
    yy, xx = np.mgrid[0:h, 0:w]
    feet = []
    for (fx, fy, rx, ry) in st['feet']:
        feet.append(((xx - fx) / rx) ** 2 + ((yy - fy) / ry) ** 2 <= 1)
    footzone = feet[0] | feet[1]
    body_vis = (brown | eyes) & ~(footzone & (yy > st['feet'][0][1] - 10))
    body_shape = hull(body_vis & (yy < st['feet'][0][1] - 8)) | body_vis
    bound = boundary(st['rim'], w)[None, :]
    crown = on & ~brown & ~eyes & (yy < bound)
    skirt = on & ~brown & ~eyes & ~crown
    # tidy: tiny islands of skirt above / crown below go with their neighbours
    layers = {}

    def put(key, mask, colour, alpha):
        L = np.zeros((h, w, 4), float)
        L[..., :3] = colour
        L[..., 3] = np.where(mask, alpha, 0) * 255
        layers[key] = L

    crown_alpha = A.copy()
    put('crown', crown, rgb, crown_alpha)
    body_rgb = inpaint(rgb, body_vis & (A > 0.9), body_shape)
    put('body', body_shape, body_rgb, np.where(body_vis, A, 1.0))
    for i, side in enumerate(['left', 'right']):
        fz = feet[i]
        frgb = inpaint(rgb, brown & fz & (A > 0.9), fz)
        put('foot-' + side, fz, frgb, np.where(brown & fz, A, np.where(body_shape, 1.0, 0)))
        sidem = (xx < st['cx']) if side == 'left' else (xx >= st['cx'])
        sk = skirt & sidem
        # skirt continues a little under the crown rim, so a swaying leaf never opens a gap
        band = crown & (yy > bound - 30) & ndimage.binary_dilation(sk, structure=np.ones((61, 1), bool)) & sidem
        sk_rgb = inpaint(rgb, sk & (A > 0.9), sk | band)
        full = sk | band
        alpha = np.where(sk, A, np.where(band, 1.0, 0))
        # front = the inner lobes that really lie over the body; thin edge slivers along the body outline stay at the back
        over = full & body_shape & (alpha > 0.5)
        core = ndimage.binary_opening(over, iterations=4)
        labf, nf = ndimage.label(core)
        big = np.isin(labf, 1 + np.nonzero(ndimage.sum(np.ones_like(A), labf, range(1, nf + 1)) > 400)[0]) if nf else core
        front = ndimage.binary_dilation(big, iterations=6) & full & body_shape
        put(f'skirt-{side}-back', full & ~front, sk_rgb, alpha)
        put(f'skirt-{side}-front', front, sk_rgb, alpha)
    # eye boxes and pivots (source px -> canvas px)
    ys, xs = np.nonzero(eyes)
    lab_e, ne = ndimage.label(eyes)
    eye_boxes = []
    for k in range(1, ne + 1):
        ey, ex = np.nonzero(lab_e == k)
        if len(ex) > 40:
            eye_boxes.append([ex.min(), ey.min(), ex.max() + 1, ey.max() + 1])
    eye_boxes.sort()
    gx = (st['feet'][0][0] + st['feet'][1][0]) / 2
    to = lambda x, y: [round(ANCHOR[0] + (x - gx) * SCALE, 2), round(ANCHOR[1] + (y - st['ground']) * SCALE, 2)]
    by = np.nonzero(body_shape.any(1))[0]
    meta[name] = {
        'eyes': [to(e[0], e[1]) + [round((e[2] - e[0]) * SCALE, 2), round((e[3] - e[1]) * SCALE, 2)] for e in eye_boxes],
        'crownPivot': to(st['cx'], float(np.interp(st['cx'], *zip(*st['rim'])))),
        'skirtPivot': [to(st['cx'] - 150, float(np.interp(st['cx'] - 150, *zip(*st['rim'])))),
                       to(st['cx'] + 150, float(np.interp(st['cx'] + 150, *zip(*st['rim']))))],
        'feet': [to(f[0], f[1]) for f in st['feet']],
        'bodyTop': to(st['cx'], by.min())[1], 'patch': to(st['cx'] - 20, 520),
    }
    for key, L in layers.items():
        im = Image.fromarray(np.clip(L, 0, 255).astype(np.uint8), 'RGBA')
        im = im.resize((round(w * SCALE), round(h * SCALE)), Image.LANCZOS)
        canvas = Image.new('RGBA', (W, H))
        canvas.alpha_composite(im, (round(ANCHOR[0] - gx * SCALE), round(ANCHOR[1] - st['ground'] * SCALE)))
        canvas.save(f'{out}/superbum-{name}-{key}.png', optimize=True)
print(json.dumps(meta))
