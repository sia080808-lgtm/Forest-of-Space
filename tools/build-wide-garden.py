# 0.7.0 넓은 숲: builds the 1.5x floor (garden-wide.png, 1536x2304) and the fern clump sprites from the original
# garden-open.png pixels only (no new painting).
#  1. paper: a clean paper patch from the middle of the garden, mirror-tiled (no visible seams) over the wide canvas
#  2. the original garden is pasted in the middle with its edge ferns removed (colour-keyed against the paper) and the
#     baked shelter erased exactly like scene.js prepareShelter does (the shelter is drawn on its own from garden-open)
#  3. the edge ferns are cut out (colour key: alpha from the distance to the paper colour, colour un-mixed from the
#     paper) and placed along the new outer edges, mirrored for variety
#  4. fern clumps for the new ground are saved as separate sprites (assets/forest/ferns/fern-N.png); the game draws
#     them on its own (render only), so they are not baked into the floor
# Usage: python3 tools/build-wide-garden.py
import numpy as np, os
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(__file__), '..', 'app/src/main/assets/web/assets/forest')
src = np.asarray(Image.open(os.path.join(ROOT, 'garden-open.png')).convert('RGB')).astype(np.float32)
H, W = src.shape[:2]                      # 1536, 1024
WW, WH = int(W * 1.5), int(H * 1.5)       # 1536, 2304
OX, OY = (WW - W) // 2, (WH - H) // 2     # 256, 384
PAPER = np.array([252.1, 238.6, 224.0], np.float32)
SHELTER = (0, 140, 540, 570)              # the baked shelter (+ margin); the game draws the shelter on its own

# 1. paper
patch = src[520:1300, 260:760]
tile = np.concatenate([patch, patch[:, ::-1]], 1)
tile = np.concatenate([tile, tile[::-1]], 0)
reps = (WH // tile.shape[0] + 2, WW // tile.shape[1] + 2)
paper = np.tile(tile, (reps[0], reps[1], 1))[:WH, :WW].copy()

# fern key: how far a pixel is from the paper colour (paper grain is about +-4)
def key(img):
    d = np.abs(img - PAPER).max(2)
    return np.clip((d - 9) / 50, 0, 1)

a = key(src)
inShelter = np.zeros((H, W), bool); x0, y0, x1, y1 = SHELTER; inShelter[y0:y1, x0:x1] = True
softShelter = np.clip(ndimage.gaussian_filter(inShelter.astype(np.float32), 25) * 1.5, 0, 1)
fern = (a > .03) & ~inShelter
grow = ndimage.binary_dilation(fern, iterations=10)
m = ndimage.gaussian_filter(grow.astype(np.float32), 5)
m = np.clip(m * 1.4, 0, 1)
m[inShelter] = 0
clean = src * (1 - m[..., None]) + paper[OY:OY + H, OX:OX + W] * m[..., None]

# the baked shelter area becomes plain paper (soft 30 px edge): the shelter is drawn on its own from garden-open.png
x0, y0, x1, y1 = SHELTER
box = np.zeros((H, W), np.float32); box[y0:y1, x0:x1] = 1
box = np.clip(ndimage.gaussian_filter(box, 12) * 1.6, 0, 1)
clean = clean * (1 - box[..., None]) + paper[OY:OY + H, OX:OX + W] * box[..., None]

# feather the pasted garden into the wide paper (outer 60 px blend)
wide = paper.copy()
fe = np.ones((H, W), np.float32)
r = 60
ramp = np.linspace(0, 1, r)
fe[:r] *= ramp[:, None]; fe[-r:] *= ramp[::-1][:, None]; fe[:, :r] *= ramp[None, :]; fe[:, -r:] *= ramp[None, ::-1]
wide[OY:OY + H, OX:OX + W] = wide[OY:OY + H, OX:OX + W] * (1 - fe[..., None]) + clean * fe[..., None]

# 3. fern sprites: connected fern regions of the original edges, colour un-mixed from the paper
lab, n = ndimage.label(ndimage.binary_dilation((a > .1) & ~inShelter, iterations=3))
sprites = []
for i, sl in enumerate(ndimage.find_objects(lab), 1):
    ys, xs = sl
    hh, ww = ys.stop - ys.start, xs.stop - xs.start
    if hh * ww < 90 * 90 or hh > 420 or ww > 420: continue
    al = a[ys, xs] * (lab[ys, xs] == i)
    al = np.clip(al * 1.15, 0, 1)
    col = PAPER + (src[ys, xs] - PAPER) / np.maximum(al, .08)[..., None]
    col = np.clip(col, 0, 255)
    rgba = np.dstack([col, al * 255]).astype(np.uint8)
    sprites.append((xs.start, ys.start, Image.fromarray(rgba, 'RGBA')))
sprites.sort(key=lambda t: -(t[2].size[0] * t[2].size[1]))
print('fern regions', len(sprites), [(x, y, s.size) for x, y, s in sprites[:12]])

def over(base, im, x, y):
    b = Image.fromarray(base.astype(np.uint8)); b.alpha_composite if False else None
    bb = b.convert('RGBA'); bb.alpha_composite(im, (int(x), int(y)))
    return np.asarray(bb.convert('RGB')).astype(np.float32)

# 4. edge ferns along the new outer edges: the original left and right edge strips (ferns only) are reused, mirrored
# and stepped down the new edges; the bottom-corner clusters go to the new bottom corners
edge = np.zeros((H, W), np.float32); edge[fern] = 1
strip = lambda x0, x1: Image.fromarray(np.dstack([np.clip(PAPER + (src[:, x0:x1] - PAPER) / np.maximum(a[:, x0:x1], .08)[..., None], 0, 255), (np.clip(a[:, x0:x1] * 1.15, 0, 1) * (1 - softShelter[:, x0:x1]) * 255)]).astype(np.uint8), 'RGBA')
left, right = strip(0, 230), strip(W - 230, W)
def feather(im, r=160):
    arr = np.asarray(im).copy().astype(np.float32); hh = arr.shape[0]; f = np.ones(hh, np.float32)
    f[:r] = np.linspace(0, 1, r); f[-r:] = np.linspace(1, 0, r); arr[..., 3] *= f[:, None]
    return Image.fromarray(arr.astype(np.uint8), 'RGBA')
img = Image.fromarray(wide.astype(np.uint8)).convert('RGBA')
for y, flip in [(-260, True), (560, False), (1240, True)]:
    L = left.transpose(Image.FLIP_TOP_BOTTOM) if flip else left
    R = right.transpose(Image.FLIP_TOP_BOTTOM) if flip else right
    img.alpha_composite(feather(L), (0, y)); img.alpha_composite(feather(R), (WW - 230, y))
cw = 430
corner = lambda x0: Image.fromarray(np.dstack([np.clip(PAPER + (src[H - 300:H, x0:x0 + cw] - PAPER) / np.maximum(a[H - 300:H, x0:x0 + cw], .08)[..., None], 0, 255), np.clip(a[H - 300:H, x0:x0 + cw] * 1.15, 0, 1) * 255]).astype(np.uint8), 'RGBA')
bl, br = corner(0), corner(W - cw)
img.alpha_composite(bl, (0, WH - 300)); img.alpha_composite(br, (WW - cw, WH - 300))
img.alpha_composite(bl.transpose(Image.FLIP_TOP_BOTTOM), (0, 0)); img.alpha_composite(br.transpose(Image.FLIP_TOP_BOTTOM), (WW - cw, 0))
img.convert('RGB').save(os.path.join(ROOT, 'garden-wide.png'), optimize=True)

# 5. clump sprites for the new ground (the five largest distinct fern regions), trimmed
os.makedirs(os.path.join(ROOT, 'ferns'), exist_ok=True)
def complete(x, y, s):
    """A fern cut by the garden's edge is completed by its own mirror image (a whole, symmetric clump); a fern cut at
    the bottom fades out softly. No new painting."""
    arr = np.asarray(s).astype(np.float32)
    if x == 0:
        arr = np.concatenate([arr[:, ::-1], arr], 1)
    elif x + arr.shape[1] >= W - 1:
        arr = np.concatenate([arr, arr[:, ::-1]], 1)
    if y + arr.shape[0] >= H - 1:
        r = min(50, arr.shape[0] // 3); arr[-r:, :, 3] *= np.linspace(1, 0, r)[:, None]
    if y <= 1:
        r = min(50, arr.shape[0] // 3); arr[:r, :, 3] *= np.linspace(0, 1, r)[:, None]
    im = Image.fromarray(arr.astype(np.uint8), 'RGBA'); return im.crop(im.getbbox())
for f in os.listdir(os.path.join(ROOT, 'ferns')): os.remove(os.path.join(ROOT, 'ferns', f))
picked = [complete(x, y, s) for x, y, s in sprites[:6]]
sheet = Image.new('RGBA', (1800, 300), (252, 238, 224, 255)); sx = 0
for k, s in enumerate(picked, 1):
    s.save(os.path.join(ROOT, 'ferns', f'fern-{k}.png'), optimize=True); sheet.alpha_composite(s, (sx, 10)); sx += s.size[0] + 12
    print('fern', k, s.size)
sheet.save('/tmp/fern-sheet.png')
print('garden-wide', img.size)
