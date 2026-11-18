"""Split the approved 슈퍼범 art (cut by tools/cut-superbum.py) into rig layers, keeping the original pixels.

Two complete sets, one per state, from the user's two pictures: 'dry' (마른 둥지) and 'wet' (물 고인 둥지).
Drawing order and layers (one canvas W x H, feet's ground centre at ANCHOR, scaled by SCALE):
  1 body                     the round face (an ellipse fitted to the visible head outline) joined to the body's
                             painted lower part, one smoothed anti-aliased outline, original texture (eyes as painted)
  2 foot-left, 3 foot-right  soft-edged ovals in front of the body's lower edge, as painted
  4 skirt-left, 5 skirt-right  each side's hanging leaves as ONE layer, drawn over the face so they cover the cheeks
                             exactly as in the art; the strip under the crown rim is filled so a swaying leaf never
                             opens a gap
  6 crown                    the nest frond (the wet one holds the water and drops)
Hidden pixels are filled only by inpainting from the same part's original pixels.
usage: python3 -I tools/rig-superbum.py <dir with superbum-dry-src.png / superbum-wet-src.png> <out dir>"""
import sys
import json
import numpy as np
import cv2
from PIL import Image
from scipy import ndimage

src_dir, out = sys.argv[1], sys.argv[2]
SCALE, W, H, ANCHOR = 0.6, 480, 420, (240, 404)
STATE = {
    'dry': dict(rim=[(0, 335), (100, 350), (180, 378), (260, 388), (330, 345), (400, 330), (470, 345), (540, 388),
                     (620, 378), (700, 350), (769, 335)],
                cx=400, feet=[(296, 612, 50, 30), (503, 612, 50, 30)], ground=640),
    'wet': dict(rim=[(0, 230), (100, 282), (180, 335), (260, 348), (380, 330), (500, 348), (580, 335), (660, 290),
                     (735, 240)],
                cx=380, feet=[(272, 607, 48, 28), (488, 607, 48, 28)], ground=634),
}


def inpaint(rgb, known, r=9):
    """every pixel that is not `known` is re-filled from known neighbours of the same part"""
    img = rgb.astype(np.uint8).copy()
    hole = (~known).astype(np.uint8)
    img[hole.astype(bool)] = 0
    return cv2.inpaint(img, hole, r, cv2.INPAINT_TELEA)


def pull_in(rgb, alpha, depth=7):
    """the outer rim of a filled part takes the colour from a little further inside, so no light seam runs along it"""
    inner = ndimage.binary_erosion(alpha > 0.5, iterations=depth)
    if not inner.any():
        return rgb
    _, (iy, ix) = ndimage.distance_transform_edt(~inner, return_indices=True)
    out = rgb.copy()
    rim = (alpha > 0) & ~inner
    out[rim] = rgb[iy[rim], ix[rim]]
    return out


def soft_ellipse(shape, cx, cy, a, b, ang=0.0):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]].astype(float)
    c, s = np.cos(np.radians(ang)), np.sin(np.radians(ang))
    u, v = (xx - cx) * c + (yy - cy) * s, -(xx - cx) * s + (yy - cy) * c
    r = np.sqrt((u / a) ** 2 + (v / b) ** 2)
    return np.clip((1 - r) * min(a, b) + 0.5, 0, 1)


meta = {'scale': SCALE, 'size': [W, H], 'anchor': ANCHOR}
for name, st in STATE.items():
    a = np.asarray(Image.open(f'{src_dir}/superbum-{name}-src.png').convert('RGBA')).astype(float)
    rgb, A = a[..., :3], a[..., 3] / 255
    h, w = A.shape
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    yy, xx = np.mgrid[0:h, 0:w]
    on = A > 0.02
    brown = on & (r > g + 8) & (g > b) & (r < 160) & (r - b > 30)
    brown = ndimage.binary_opening(brown, iterations=1)
    lab, n = ndimage.label(brown)
    brown = np.isin(lab, 1 + np.nonzero(ndimage.sum(np.ones_like(A), lab, range(1, n + 1)) > 500)[0])
    eyes = ndimage.binary_fill_holes(brown) & ~brown
    foot_top = min(f[1] - f[3] for f in st['feet'])
    # face ellipse: fitted to the visible head outline above the leaves and feet
    head = (brown | eyes) & (yy < foot_top)
    edge = head & ~ndimage.binary_erosion(head, iterations=1)
    top = np.nonzero(head.any(1))[0].min()
    ys_e, xs_e = np.nonzero(edge & (yy > top + 25) & (yy < foot_top - 50))
    (ecx, ecy), (ew, eh), ang = cv2.fitEllipse(np.stack([xs_e, ys_e], 1).astype(np.float32))
    # the body: the fitted round face plus the body's own visible lower part (it widens onto the feet, as painted);
    # the outline is smoothed so the bottom edge is one clean curve
    feet_core = np.zeros(A.shape, bool)
    for (fx, fy, rx, ry) in st['feet']:
        feet_core |= ((xx - fx) / rx) ** 2 + ((yy - fy) / ry) ** 2 <= 1
    # cheeks run a little wider under the leaves, so a swinging leaf never uncovers a gap beside the face
    ell = soft_ellipse(A.shape, ecx, ecy, ew / 2 * 1.1, eh / 2, ang) > 0.5
    # the painted body widens into a soft rounded base that sits on both feet
    (f0x, f0y, f0rx, _), (f1x, _, _, _) = st['feet']
    base = soft_ellipse(A.shape, ecx, f0y - 26, (f1x - f0x) / 2 + f0rx * .35, 40) > 0.5
    # the face is wide: under the side leaves (where the art shows leaves over the cheeks) it continues out to a much
    # wider oval, so however the leaves swing they always lie on the face, never on a gap; outside the leaves the
    # painted outline is unchanged
    leaves_below = on & ~brown & ~eyes & (yy > np.interp(np.arange(w), *zip(*st['rim']))[None, :])
    wide = soft_ellipse(A.shape, ecx, ecy + eh * .08, ew / 2 * 1.5, eh / 2 * 1.02, ang) > 0.5
    under = wide & ndimage.binary_erosion(leaves_below, iterations=8) & (yy > ecy - eh * .25)
    mask = ndimage.binary_fill_holes(ndimage.binary_closing(ell | base | under | (head & (yy < ecy)), iterations=10))
    sm = ndimage.gaussian_filter(mask.astype(float), 2.2)
    face_a = np.clip((sm - .5) * 2.2 + .5, 0, 1)
    # colours come only from well inside the painted body: its painted outline blends into the ground shadow
    solid = ndimage.binary_erosion(brown | eyes, iterations=4)
    face_known = solid & (face_a > 0.99) & (A > 0.9)
    face_rgb = inpaint(rgb, face_known)
    face_rgb = pull_in(face_rgb.astype(float), face_a, 5)
    face_rgb[eyes] = rgb[eyes]
    layers = {}

    def put(key, colour, alpha):
        L = np.zeros((h, w, 4), float)
        L[..., :3] = colour
        L[..., 3] = np.clip(alpha, 0, 1) * 255
        layers[key] = L

    put('body', face_rgb, face_a)
    for i, side in enumerate(['left', 'right']):
        fx, fy, rx, ry = st['feet'][i]
        fa = soft_ellipse(A.shape, fx, fy, rx, ry)
        known = solid & (fa > 0.99) & (A > 0.9) & (yy > fy - ry * .2)
        put('foot-' + side, pull_in(inpaint(rgb, known).astype(float), fa, 6), fa)
    bound = np.interp(np.arange(w), *zip(*st['rim']))[None, :]
    crown = on & ~brown & ~eyes & (yy < bound)
    put('crown', rgb, np.where(crown, A, 0))
    # leaves are green: the beige ground-shadow strip left under the body by the cut-out is not part of any leaf
    skirt = on & ~brown & ~eyes & ~crown & (g - b > 35)
    labs, ns = ndimage.label(skirt)
    skirt = np.isin(labs, 1 + np.nonzero(ndimage.sum(np.ones_like(A), labs, range(1, ns + 1)) > 200)[0])
    # keep the leaves' soft outer edge: anti-aliased pixels right next to green ones, but never the beige strip
    skirt |= ndimage.binary_dilation(skirt, iterations=2) & on & ~brown & ~eyes & ~crown & (g - b > 22)
    for side in ['left', 'right']:
        sidem = (xx < st['cx']) if side == 'left' else (xx >= st['cx'])
        sk = skirt & sidem
        # continue the leaves a little under the crown rim (a vertical strip above each leaf top)
        band = crown & (yy > bound - 30) & ndimage.binary_dilation(sk, structure=np.ones((61, 1), bool)) & sidem
        sk_rgb = inpaint(rgb, sk & (A > 0.9))
        put('skirt-' + side, sk_rgb, np.where(sk, A, np.where(band, 1.0, 0)))
    eye_boxes = []
    lab_e, ne = ndimage.label(eyes)
    for k in range(1, ne + 1):
        ey, ex = np.nonzero(lab_e == k)
        if len(ex) > 40:
            eye_boxes.append([ex.min(), ey.min(), ex.max() + 1, ey.max() + 1])
    eye_boxes.sort()
    gx = (st['feet'][0][0] + st['feet'][1][0]) / 2
    to = lambda x, y: [round(ANCHOR[0] + (x - gx) * SCALE, 2), round(ANCHOR[1] + (y - st['ground']) * SCALE, 2)]
    meta[name] = {
        'eyes': [to(e[0], e[1]) + [round((e[2] - e[0]) * SCALE, 2), round((e[3] - e[1]) * SCALE, 2)] for e in eye_boxes],
        'crown': to(st['cx'], float(np.interp(st['cx'], *zip(*st['rim'])))),
        'skirt': [to(st['cx'] - 150, float(np.interp(st['cx'] - 150, *zip(*st['rim'])))),
                  to(st['cx'] + 150, float(np.interp(st['cx'] + 150, *zip(*st['rim']))))],
        'feet': [to(f[0], f[1]) for f in st['feet']],
        'face': to(ecx, ecy) + [round(ew / 2 * SCALE, 2), round(eh / 2 * SCALE, 2)],
        'patch': to(ecx - 20, ecy + 60),
    }
    for key, L in layers.items():
        # premultiplied resize so transparent pixels never bleed dark fringes into the edges
        pm = L.copy()
        pm[..., :3] *= pm[..., 3:4] / 255
        im = Image.fromarray(np.clip(pm, 0, 255).astype(np.uint8), 'RGBa').resize((round(w * SCALE), round(h * SCALE)), Image.BOX).convert('RGBA')
        canvas = Image.new('RGBA', (W, H))
        canvas.alpha_composite(im, (round(ANCHOR[0] - gx * SCALE), round(ANCHOR[1] - st['ground'] * SCALE)))
        canvas.save(f'{out}/superbum-{name}-{key}.png', optimize=True)
print(json.dumps(meta))
