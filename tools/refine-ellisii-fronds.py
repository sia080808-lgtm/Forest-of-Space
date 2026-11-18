"""0.6.34: re-cut 엘리시's two fertile fronds (user: "머리 잎 누끼 잘못 땄다", "머리 잎 끝 째짐").

The old layer (ellisii-fronds.png, 470x629) touched the image border: the left frond's top and the right frond's tip were cut
flat (with a cream fringe line), and the alpha edge was hard and stair-stepped. This script
  1. pads the canvas 30 px on the top and the right,
  2. splits the two fronds by connected component,
  3. closes each flat cut with the frond's own outline (an ellipse fitted to the outline next to the cut),
  4. gives every edge pixel the paint colour of the nearest solid frond pixel (no cream fringe) and an anti-aliased alpha,
and writes ellisii-frond-left.png, ellisii-frond-right.png and the combined ellisii-fronds.png (all 500x659, same frame).
Run once from the repo root on the 0.6.33 layer: python3 tools/refine-ellisii-fronds.py <old ellisii-fronds.png>
"""
import sys
import numpy as np, cv2
from PIL import Image
from scipy import ndimage

OUT = 'app/src/main/assets/web/assets/forest/species/'
P = 30
src = np.array(Image.open(sys.argv[1]).convert('RGBA')).astype(np.float32)
H, W = src.shape[:2]
im = np.zeros((H + P, W + P, 4), np.float32); im[P:, :W] = src
a = im[..., 3]
light = (a > 20) & (im[..., :3].sum(-1) > 600)  # the cream fringe line left from the old cut
lab, n = ndimage.label((a > 20) & ~light)
assert n == 2, n
sizes = [(lab == i).sum() for i in (1, 2)]
comps = sorted((1, 2), key=lambda i: np.where(lab == i)[1].mean())  # left, right
yy, xx = np.mgrid[0:H + P, 0:W + P]


def close_cut(M, cut):
    """Fit an ellipse to the outline points near the flat cut (not on it) and add the part of it beyond the cut."""
    cnt, _ = cv2.findContours(M.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    pts = max(cnt, key=len)[:, 0, :]
    on = pts[:, 1] <= P if cut == 'top' else pts[:, 0] >= W - 1
    if on.sum() < 3:
        return M  # the outline does not reach the border here: nothing to close
    cx, cy = (pts[on, 0].mean(), P) if cut == 'top' else (W - 1, pts[on, 1].mean())
    d = np.hypot(pts[:, 0] - cx, pts[:, 1] - cy)
    near = pts[(~on) & (d < 110)]
    (ex, ey), (ea, eb), ang = cv2.fitEllipse(near.astype(np.float32))
    E = np.zeros(M.shape, np.uint8); cv2.ellipse(E, ((ex, ey), (ea, eb), ang), 1, -1)
    beyond = (yy < P + 1) if cut == 'top' else (xx > W - 2)
    span = np.abs(xx - cx) < 90 if cut == 'top' else np.abs(yy - cy) < 60
    return M | (E.astype(bool) & beyond & span)


layers = []
for i, cut in zip(comps, ('top', 'right')):
    M = lab == i
    M = close_cut(M, cut)
    M = ndimage.binary_closing(M, iterations=2)
    M = ndimage.binary_fill_holes(M)
    # solid paint pixels of this frond: opaque, not the light cream fringe, a little inside the edge
    rgb = im[..., :3]
    good = (lab == i) & (a > 230) & (rgb.sum(-1) < 560)
    good &= ndimage.binary_erosion(lab == i, iterations=3)
    _, (iy, ix) = ndimage.distance_transform_edt(~good, return_indices=True)
    out = np.zeros_like(im)
    out[..., :3] = rgb[iy, ix]
    inner = good | (ndimage.binary_erosion(M, iterations=3) & (lab == i) & (a > 230))
    out[inner, :3] = rgb[inner]
    # anti-aliased alpha from the binary shape
    soft = ndimage.gaussian_filter(M.astype(np.float32), 1.1)
    out[..., 3] = np.clip((soft - .5) * 2.6 + .5, 0, 1) * 255
    layers.append(out)
for name, L in zip(('left', 'right'), layers):
    Image.fromarray(L.round().astype(np.uint8)).save(OUT + 'ellisii-frond-%s.png' % name)
comb = Image.fromarray(layers[0].round().astype(np.uint8))
comb.alpha_composite(Image.fromarray(layers[1].round().astype(np.uint8)))
comb.save(OUT + 'ellisii-fronds.png')
print('ok', comb.size)
