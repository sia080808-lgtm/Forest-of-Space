"""1.2.13 (user: "다른 오브젝트들도 마찬가지"): the spring's stone basin was drawn from the dry-garden painting through a
rounded clip, so a pale paper blob showed around the stones (next to the lake, on snow, under other things).
This cuts the basin crop (x 0~420, y 980~1250 of garden-dry, the same crop scene.js draws) into its own sprite:
the stones, the basin hollow and the plants are kept; the paper ground fades out; pieces not attached to the stones are
dropped. Same alpha for the season variants. Original pixels only."""
import os, numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as nd
ROOT = os.path.join(os.path.dirname(__file__), '..', 'app/src/main/assets/web/assets/forest')
BOX = (0, 980, 420, 1250)
src = {'': 'garden-dry.png', '-spring': 'seasons/garden-dry-spring.jpg', '-autumn': 'seasons/garden-dry-autumn.jpg', '-winter': 'seasons/garden-dry-winter.jpg'}
base = np.array(Image.open(os.path.join(ROOT, src[''])).convert('RGBA').crop(BOX)).astype(float)
H, W = base.shape[:2]; rgb = base[..., :3]
# the old clip outline (scene.js springAt), local units → tile pixels: tile x = (lx+72)*420/147.65625, y = (ly+47.22)*270/101.25
k = 420 / 147.65625
def bez(p0, p1, p2, p3, n=24):
    return [tuple((1-t)**3*np.array(p0)+3*(1-t)**2*t*np.array(p1)+3*(1-t)*t*t*np.array(p2)+t**3*np.array(p3)) for t in np.linspace(0, 1, n)]
pts = bez((-69, 6), (-73, -21), (-47, -43), (-18, -43)) + bez((-18, -43), (6, -51), (45, -31), (62, -5)) + bez((62, -5), (78, 30), (37, 42), (-6, 40)) + bez((-6, 40), (-46, 39), (-75, 25), (-69, 6))
blob = Image.new('L', (W, H), 0); ImageDraw.Draw(blob).polygon([((x+72)*k, (y+47.22)*k) for x, y in pts], fill=255)
blob = np.array(blob) / 255
paper_px = rgb[(blob < .5)[..., None].repeat(3, 2).all(2) & (rgb.max(2) > 200)]
paper = np.median(paper_px, 0)
d = np.sqrt(((rgb - paper) ** 2 * [1.0, 1.2, 0.8]).sum(2))
soft = np.clip((d - 22) / 30, 0, 1)
# the stone ring and hollow: an ellipse inside the old clip
core = Image.new('L', (W, H), 0); ImageDraw.Draw(core).ellipse([W*.24, H*.30, W*.80, H*.86], fill=255)
core = np.array(core.filter(ImageFilter.GaussianBlur(4))) / 255
keep = np.maximum(soft, core) * blob
lab, n = nd.label(keep > .35)
if n:
    ids = set(np.unique(lab[core > .5])) - {0}
    body = np.isin(lab, list(ids)); body = nd.binary_fill_holes(body)   # pale stone tops are close to the paper colour: fill them
    keep = np.maximum(keep, nd.gaussian_filter(nd.binary_erosion(body, iterations=2).astype(float), 1.2)) * nd.binary_dilation(body, iterations=1)
keep = np.array(Image.fromarray((keep * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))) / 255
for suf, f in src.items():
    im = np.array(Image.open(os.path.join(ROOT, f)).convert('RGBA').crop(BOX)).astype(float)
    im[..., 3] = keep * 255
    out = os.path.join(ROOT, ('spring-art.png' if not suf else 'seasons/spring-art' + suf + '.png'))
    Image.fromarray(im.round().astype(np.uint8), 'RGBA').save(out, optimize=True); print(out, round(float((im[..., 3] > 8).mean()), 3))
