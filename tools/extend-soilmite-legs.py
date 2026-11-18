# 흙지기 legs (and the underside of the body) were cut flat at the soil line when the SRS sheet's soil was removed (the
# sheet mite stands with its feet in the soil). This continues the five cut legs along their own slant, measured from the
# mask rows 90 and 95 (centre x at row 95, dx per row, width), tapering to a rounded tip in the leg's own light/dark
# colours with one soft joint band, and rounds off the flat cut of the body underside. Run once on the cut sprite (98 px tall).
import numpy as np
from PIL import Image,ImageDraw,ImageFilter
P='app/src/main/assets/web/assets/forest/creatures/soil-mite.png'
im=Image.open(P).convert('RGBA')
if im.height!=98: raise SystemExit('expects the 98 px cut sprite (already extended?)')
H=96;a=np.array(im);light=(242,198,146);dark=(196,154,108)
#        centre x at row 95, dx per row (from rows 90->95), width, length
LEGS=[(10.5,-.6,6,20),(51.5,-.6,9,24),(101,-.8,10,26),(156,-.3,9,22),(233,.7,8,22)]
base=Image.fromarray(a).crop((0,0,a.shape[1],H))
# round the body's flat underside (x 128..205): fade an elliptic band at the bottom
b=np.array(base).astype(float);xs=np.arange(b.shape[1])
for x in range(128,206):
    u=(x-166.5)/38.5;edge=H-1-int(round(4*u*u))      # higher at the sides, lowest in the middle
    b[edge:,x,3]=0
    if 0<=edge-1<H:b[edge-1,x,3]*=.55
base=Image.fromarray(b.clip(0,255).astype(np.uint8))
out=Image.new('RGBA',(a.shape[1],H+30),(0,0,0,0));out.alpha_composite(base);d=ImageDraw.Draw(out)
for cx,dx,w0,L in LEGS:
    n=np.hypot(1,dx);ux,uy=dx/n,1/n;vx,vy=-uy,ux;y0=H-1;x0=cx+dx*(y0-95)
    P_=lambda t,ww:(x0+ux*t+vx*ww,y0+uy*t+vy*ww)
    d.polygon([P_(-3,-w0/2),P_(L,-1.3),P_(L,1.3),P_(-3,w0/2)],fill=dark+(255,))
    d.polygon([P_(-3,-w0/2+1.2),P_(L-1.2,-.5),P_(L-1.2,.5),P_(-3,w0/2-1.2)],fill=light+(255,))
    jx,jy=P_(L*.42,0);r=w0*.32;d.ellipse((jx-r,jy-r*.6,jx+r,jy+r*.6),fill=(228,184,134,255))  # opaque blend (ImageDraw replaces pixels, it does not blend)
    tx,ty=P_(L,0);d.ellipse((tx-1.5,ty-1.5,tx+1.5,ty+1.5),fill=dark+(255,))
o=np.array(out);soft=np.array(out.filter(ImageFilter.GaussianBlur(.55)));o[H+2:]=soft[H+2:];Image.fromarray(o).save(P);print('ok',out.size)
