"""1.2.13 (user: "쉼터 끝부분 이거 남음. 경계선 확실하게 누끼"): the shelter picture was cut from the garden painting
with the paper ground around it, so next to the lake a pale paper patch (and stray specks from the painting) showed
around the shelter. This keeps only the shelter itself: the arch and its cave (inside the arch outline the picture is
kept as it is) and the plants/straw that differ in colour from the paper ground, with a soft edge; small pieces not
attached to the shelter are dropped. The same alpha is applied to the season variants (same geometry).
Original pixels only; nothing is redrawn."""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd
ROOT = os.path.join(os.path.dirname(__file__), '..', 'app/src/main/assets/web/assets/forest')
base = np.array(Image.open(os.path.join(ROOT, 'shelter-art.png')).convert('RGBA')).astype(float)
H, W = base.shape[:2]
rgb, a0 = base[..., :3], base[..., 3] / 255
# paper ground colour: bright, low-saturation pixels near the tile border
border = np.zeros((H, W), bool); border[:12] = border[-12:] = True; border[:, :12] = border[:, -12:] = True
mx, mn = rgb.max(2), rgb.min(2)
paper_px = rgb[border & (a0 > .5) & (mx > 200) & (mx - mn < 45)]
paper = np.median(paper_px, 0)
d = np.sqrt(((rgb - paper) ** 2 * [1.0, 1.2, 0.8]).sum(2))       # distance from the paper colour
soft = np.clip((d - 26) / 34, 0, 1)                                  # 26 → transparent, 60 → solid
# the arch with its cave (same outline the game uses for the arch, tile y = source y - 190), closed along the floor
arch = [(35, 470), (25, 380), (70, 315), (150, 257), (240, 238), (340, 255), (415, 310), (455, 405), (445, 425), (300, 452), (160, 466)]
m = Image.new('L', (W, H), 0); ImageDraw.Draw(m).polygon([(x, y - 190) for x, y in arch], fill=255)
cave = np.array(m.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(3))) / 255   # pulled in so no paper rim stays above the straw
keep = np.maximum(soft, cave)
# drop small pieces that are not attached to the shelter (paper specks, fragments of other things in the painting)
lab, n = nd.label(keep > .35)
if n:
    sizes = nd.sum(np.ones_like(lab), lab, range(1, n + 1))
    core = set(np.unique(lab[cave > .5])) - {0}
    ok = np.zeros(n + 1, bool)
    for i, sz in enumerate(sizes, 1):
        ok[i] = i in core
    body = ok[lab]
    body = nd.binary_dilation(body, iterations=1)                    # keep the soft rim around what stays
    keep = keep * body
keep = np.array(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))) / 255
for name in ['shelter-art.png', 'seasons/shelter-art-spring.png', 'seasons/shelter-art-autumn.png', 'seasons/shelter-art-winter.png']:
    p = os.path.join(ROOT, name); im = np.array(Image.open(p).convert('RGBA')).astype(float)
    im[..., 3] = np.minimum(im[..., 3], keep * 255)
    Image.fromarray(im.round().astype(np.uint8), 'RGBA').save(p, optimize=True)
    print(name, 'visible', round(float((im[..., 3] > 8).mean()), 3))
