"""Cut 슈퍼범 out of the approved concept art (two states side by side on a cream paper ground), keeping the original
pixels: alpha comes from the colour distance to the paper (estimated row by row from the page margins) and the soft edge
is un-mixed from the paper so no cream halo is left. The light ground shadow is dropped and
the cream eyes (paper-coloured but enclosed by the body) are kept opaque. Output: superbum-dry-src.png, superbum-wet-src.png (full cutouts).
usage: python3 -I tools/cut-superbum.py <concept image> <out dir>"""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage

src, out = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(float)
H, W, _ = im.shape
bg = np.zeros_like(im)
for y in range(H):
    bg[y, :] = np.median(np.concatenate([im[y, 0:60], im[y, W - 60:W]]), axis=0)
d = np.sqrt(((im - bg) ** 2).sum(2))
LO, HI = 7.0, 34.0
a = np.clip((d - LO) / (HI - LO), 0, 1)
a[int(H * 0.8):] = 0  # labels under the characters
for name, (x0, x1) in {'dry': (100, 905), 'wet': (905, 1700)}.items():
    A = a[:, x0:x1].copy()
    lab, n = ndimage.label(A > 0.02)
    sizes = ndimage.sum(np.ones_like(A), lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool)
    keep[1:] = sizes >= 30  # drop specks, keep water drops
    A[~keep[lab]] = 0
    C = im[:, x0:x1]
    # the soft ground shadow is a slightly darker paper tone: light and nearly unsaturated -> not part of the character
    mx, mn = C.max(2), C.min(2)
    shadow = (C[..., 0] > 205) & (mn > 170) & ((mx - mn) < 55)
    # the cream eyes have the paper's colour too, but they are enclosed by the body: fill enclosed holes opaque
    body = (A > 0.5) & ~shadow
    holes = ndimage.binary_fill_holes(body) & ~body
    A[shadow & ~holes] = 0
    A[holes] = 1
    B = bg[:, x0:x1]
    safe = np.maximum(A, 1e-3)[..., None]
    col = np.clip((C - (1 - A[..., None]) * B) / safe, 0, 255)
    ys, xs = np.nonzero(A > 0.02)
    y0, y1, xa, xb = ys.min() - 4, ys.max() + 5, xs.min() - 4, xs.max() + 5
    rgba = np.dstack([col, A * 255])[y0:y1, xa:xb].astype(np.uint8)
    Image.fromarray(rgba, 'RGBA').save(f'{out}/superbum-{name}-src.png')
    print(name, rgba.shape, 'box', x0 + xa, y0, x0 + xb, y1)
