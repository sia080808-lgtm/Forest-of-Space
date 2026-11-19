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
# 0.7.0 (user: "기본배율에서 보이던 고사리 테두리 예뻤는데 … 화면을 옮기더라도 계속 그림을 보는 것처럼"): the edge ferns
# are no longer part of the floor. They become a screen frame (frame.png): the original garden's fern layer, colour-keyed
# from the paper, drawn fixed to the screen edges at today's size over the floor and under friends and objects.
img = Image.fromarray(wide.astype(np.uint8)).convert('RGBA')
fa = np.clip(a * 1.15, 0, 1) * (1 - softShelter)
fcol = np.clip(PAPER + (src - PAPER) / np.maximum(a, .08)[..., None], 0, 255)
fa[fa < .06] = 0
far = ~ndimage.binary_dilation(fa > .2, iterations=40); fa[far] = 0          # paper specks away from the ferns
fr = np.dstack([fcol, fa * 255])
# the left edge behind the shelter had no ferns of its own: borrow the right edge there, mirrored, softly faded in
band = np.zeros(H, np.float32); band[150:600] = 1; band = ndimage.gaussian_filter1d(band, 40)
mir = fr[:, ::-1][:, :260].copy(); mir[..., 3] *= band[:, None]
left = fr[:, :260]; take = mir[..., 3] > left[..., 3]; left[take] = mir[take]
Image.fromarray(fr.astype(np.uint8), 'RGBA').save(os.path.join(ROOT, 'frame.png'), optimize=True)
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

# 6. shelter art (0.7.0): the shelter used to be drawn as the rectangle (0,190)-(500,520) of garden-open.png, paper and all.
# On the wide floor that rectangle's edges would show, so the shelter is saved on its own with soft transparent edges.
sx0, sy0, sx1, sy1 = 0, 190, 500, 520
crop = src[sy0:sy1, sx0:sx1]
hh, ww = crop.shape[:2]
al = np.ones((hh, ww), np.float32)
for r, side in [(40, 'l'), (24, 'r'), (24, 't'), (18, 'b')]:
    ramp = np.linspace(0, 1, r)
    if side == 'l': al[:, :r] *= ramp[None, :]
    if side == 'r': al[:, -r:] *= ramp[None, ::-1]
    if side == 't': al[:r] *= ramp[:, None]
    if side == 'b': al[-r:] *= ramp[::-1][:, None]
# plain paper fades out completely (only the arch, its grass and vines stay solid)
ink = np.clip((np.abs(crop - PAPER).max(2) - 6) / 30, 0, 1)
ink = np.clip(ndimage.gaussian_filter(ndimage.binary_dilation(ink > .15, iterations=8).astype(np.float32), 4) * 1.2, 0, 1)
al *= ink
Image.fromarray(np.dstack([crop, al * 255]).astype(np.uint8), 'RGBA').save(os.path.join(ROOT, 'shelter-art.png'), optimize=True)
print('shelter-art', (ww, hh))
