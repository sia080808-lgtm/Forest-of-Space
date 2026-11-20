"""0.9.0 동쪽 호수 물가: the lake region's floor (paper continued from the forest, damp shore, soft ink-wash water, reeds,
grass tufts) and its winter ice layer. Usage: python3 tools/build-lake-floor.py
The water shape is the same formula as world.js waterD() (ellipse + three sines) so what is drawn is what blocks walking;
the drawing adds a soft wash around it. The images cover x 1.05..3.3, y -0.25..1.25 (0.9.5: the whole lake and the land
east of it, user: "호수는 확장시켜 놓자")."""
import numpy as np, math, random, os
from PIL import Image, ImageDraw, ImageFilter
ROOT=os.path.join(os.path.dirname(__file__),'..','app','src','main','assets','web','assets','forest')
X0,X1,Y0,Y1=1.05,3.3,-.25,1.25; K=2; PX=360*K; PY=576*K
W=int((X1-X0)*PX); H=int((Y1-Y0)*PY)
random.seed(7)
def P(u,v): return ((u-X0)*PX,(v-Y0)*PY)
yy,xx=np.mgrid[0:H,0:W].astype(np.float32); U=xx/PX+X0; V=yy/PY+Y0
def noise(grid,oct=3,seed=0):
    r=np.random.default_rng(seed);out=np.zeros((H,W),np.float32);amp=1;tot=0
    for o in range(oct):
        gw=max(2,int(grid*2**o)); gh=max(2,int(grid*2**o*H/W))
        g=r.random((gh,gw)).astype(np.float32)
        out+=np.asarray(Image.fromarray((g*255).astype(np.uint8)).resize((W,H),Image.BICUBIC),np.float32)/255*amp;tot+=amp;amp*=.5
    return out/tot
def smooth(m,r): return np.asarray(Image.fromarray((np.clip(m,0,1)*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(r)),np.float32)/255
# --- the shared water shape (world.js waterD) ---
def waterD(u,v): return np.sqrt(((u-2.25)/.74)**2+((v-.56)/.46)**2)+.045*np.sin(v*11+1.3)+.03*np.sin(v*23+.4)+.02*np.sin(u*19+2.1)
D=waterD(U,V)
fine=noise(330,2,9)              # the soft, granular edge the user chose ("물가 경계는 이 컨셉이 나음")
d=D+(fine-.5)*.7
water=d<1.0
# paper: mirror the forest floor at x 1.25 so the join is invisible
gw=np.asarray(Image.open(os.path.join(ROOT,'garden-wide.png')).convert('RGB'),np.float32)
tt=np.mod(U+.25,3.0); gx=np.where(tt<1.5,tt,3.0-tt)-.25; gx=((gx+.25)/1.5*gw.shape[1]).astype(int).clip(0,gw.shape[1]-1)
gy=((V+.25)/1.5*gw.shape[0]).astype(int).clip(0,gw.shape[0]-1)
rgb=gw[gy,gx].copy()
alpha=np.clip((U-1.10)/.12,0,1)
wm=smooth(water,1.6*K)
damp=np.clip(1-(d-1.0)/.55,0,1)*(1-wm); damp=damp**1.6
rgb=rgb*(1-.35*damp[...,None])+np.array([206,193,166])*(.35*damp[...,None])
rgb=rgb*(1-.18*damp[...,None])+np.array([196,201,172])*(.18*damp[...,None])
band=np.clip(1-np.abs(d-1.03)/.06,0,1)*(1-wm)
rgb=rgb*(1-.18*band[...,None])+np.array([170,162,140])*(.18*band[...,None])
inner=np.clip((1.0-d)/.9,0,1)**.8
wc=np.array([180,203,200],np.float32)*(1-inner[...,None])+np.array([150,178,180],np.float32)*inner[...,None]
wc=wc*(0.97+0.05*noise(170,2,5)[...,None])
edge=np.clip(1-np.abs(d-.975)/.035,0,1); wc=wc*(1-.22*edge[...,None])
wc=wc+((np.sin(V*95+noise(40,3,1)*6)*.5+.5)**8*inner)[...,None]*22
rgb=rgb*(1-.9*wm[...,None])+wc*(.9*wm[...,None])
img=Image.fromarray(np.clip(rgb,0,255).astype(np.uint8)).convert('RGBA'); img.putalpha(Image.fromarray((alpha*255).astype(np.uint8)))
ov=Image.new('RGBA',(W,H),(0,0,0,0)); dr=ImageDraw.Draw(ov)
for _ in range(30):
    u=random.uniform(1.62,2.9); v=random.uniform(.2,.95); x,y=P(u,v)
    if not water[int(y),int(x)]: continue
    L=random.uniform(30,70)*K/2; dr.arc([x-L,y-L*.18,x+L,y+L*.18],200,340,fill=(238,244,240,150),width=K)
img.alpha_composite(ov.filter(ImageFilter.GaussianBlur(1.0)))
ov=Image.new('RGBA',(W,H),(0,0,0,0)); dr=ImageDraw.Draw(ov)
def stroke(x0,y0,x1,y1,w0,col,steps=10):
    for i in range(steps):
        t0,t1=i/steps,(i+1)/steps
        dr.line([(x0+(x1-x0)*t0,y0+(y1-y0)*t0),(x0+(x1-x0)*t1,y0+(y1-y0)*t1)],fill=col,width=max(1,int(w0*(1-t0)+.4)))
def tuft(u,v,s=1.0):
    x,y=P(u,v)
    for k in range(random.randint(5,9)):
        a=random.uniform(-.7,.7); L=random.uniform(9,17)*K*s
        stroke(x+random.uniform(-3,3)*K,y,x+math.sin(a)*L,y-math.cos(a)*L,2.2*K*s,(random.randint(120,150),random.randint(140,160),random.randint(96,112),200),8)
for _ in range(520):
    u=random.uniform(1.12,3.28); v=random.uniform(-.2,1.2); x,y=P(u,v)
    if x<0 or y<0 or x>=W or y>=H: continue
    dd=d[int(y),int(x)]
    if dd<1.22: continue
    if random.random()<np.clip(1-(dd-1.22)/.5,0,1)*.9: tuft(u,v,random.uniform(.6,1.1))
def reeds(u,v,n=12,h=1.0):
    x,y=P(u,v)
    for k in range(n):
        bx=x+random.uniform(-14,14)*K; L=random.uniform(40,70)*K*h; lean=random.uniform(-10,10)*K
        stroke(bx,y+random.uniform(-3,3)*K,bx+lean,y-L,2.6*K,(110,122,82,215),16)
        if random.random()<.55: tx,ty=bx+lean*.95,y-L*.95; dr.ellipse([tx-2.4*K,ty-9*K,tx+2.4*K,ty+2*K],fill=(128,98,64,220))
        if random.random()<.5: stroke(bx,y-L*.3,bx+random.choice([-1,1])*random.uniform(12,24)*K,y-L*.55,1.8*K,(126,138,92,190),8)
for (u,v,n,h) in [(1.47,.38,14,1.0),(1.50,.30,9,.8),(1.95,.98,16,1.1),(1.62,.12,10,.85),(3.02,.42,13,1.0),(2.9,.15,10,.85),(2.6,1.02,12,1.0)]: reeds(u,v,n,h)
img.alpha_composite(ov.filter(ImageFilter.GaussianBlur(.6)))
img.save(os.path.join(ROOT,'lake','lake-floor.png'),optimize=True)
# --- winter ice: drawn over the snow cover; pale grey-blue ice on the water, a few fine cracks ---
ice=np.array([222,230,230],np.float32)*(1-inner[...,None])+np.array([206,218,220],np.float32)*inner[...,None]
ice=ice*(0.98+0.03*noise(120,2,3)[...,None])
ia=Image.fromarray(np.dstack([np.clip(ice,0,255),wm*.92*255]).astype(np.uint8),'RGBA')
cd=ImageDraw.Draw(ia)
for _ in range(9):
    u=random.uniform(1.65,2.85); v=random.uniform(.25,.9); x,y=P(u,v)
    if not water[int(y),int(x)]: continue
    pts=[(x,y)]
    for _ in range(4): x+=random.uniform(-18,18)*K; y+=random.uniform(-8,8)*K; pts.append((x,y))
    cd.line(pts,fill=(178,192,196,150),width=1)
ia.save(os.path.join(ROOT,'lake','lake-ice.png'),optimize=True)
print(W,H)
