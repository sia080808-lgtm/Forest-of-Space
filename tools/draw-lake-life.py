"""0.9.2 물가 이웃 (SRS v2.33 LK-05): small lake neighbours in the forest neighbours' style (watercolour fill, warm brown
outline, white eye glint). Each creature is a 6-frame motion cycle saved as one strip (6 x 160 px wide), centre = where it sits, facing right;
the game plays the same frames.
Usage: python3 tools/draw-lake-life.py [sheet.png]"""
import os, sys, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
OUT=os.path.join(os.path.dirname(__file__),'..','app','src','main','assets','web','assets','forest','lake')
S=160; K=4                      # drawn at 4x then reduced (soft edges)
OUTLINE=(92,64,40,235)
def canvas(): return Image.new('RGBA',(S*K,S*K),(0,0,0,0))
def grain(seed):
    r=np.random.default_rng(seed); g=r.random((S*K//6,S*K//6))
    return np.asarray(Image.fromarray((g*255).astype(np.uint8)).resize((S*K,S*K),Image.BICUBIC),np.float32)/255
def fill(im,shape,col,seed=0,outline=True,light=(0,0),width=2.2):
    """shape: ('ellipse',box) or ('poly',pts). watercolour: lighter centre, pooled edge, granulation, warm outline"""
    m=Image.new('L',im.size,0); d=ImageDraw.Draw(m)
    kind,g=shape;(d.ellipse if kind=='ellipse' else d.polygon)(g,fill=255)
    m=np.asarray(m,np.float32)/255; inner=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5*K)),np.float32)/255
    edge=np.clip((m-inner)*2.2,0,1); gr=grain(seed)
    h,w=m.shape; yy,xx=np.mgrid[0:h,0:w]; ys,xs=np.nonzero(m>0)
    if len(xs):
        cx,cy=xs.mean()+light[0]*K,ys.mean()+light[1]*K; r=max(np.ptp(xs),np.ptp(ys))/2+1
        lt=np.clip(1-np.hypot(xx-cx+r*.3,yy-cy+r*.35)/r,0,1)
    else: lt=0
    c=np.array(col,np.float32)[None,None]*(1-.22*edge[...,None])*(.95+.08*gr[...,None])+lt[...,None]*28
    rgba=np.dstack([np.clip(c,0,255),m*235]).astype(np.uint8); im.alpha_composite(Image.fromarray(rgba,'RGBA'))
    if outline:
        d2=ImageDraw.Draw(im)
        if kind=='ellipse': d2.ellipse(g,outline=OUTLINE,width=int(width*K/1.6))
        else: d2.line(list(g)+[g[0]],fill=OUTLINE,width=int(width*K/1.6),joint='curve')
def line(im,pts,w=1.6,col=OUTLINE):
    ImageDraw.Draw(im).line([(x*K,y*K) for x,y in pts],fill=col,width=max(1,int(w*K)),joint='curve')
def E(cx,cy,rx,ry): return ('ellipse',[(cx-rx)*K,(cy-ry)*K,(cx+rx)*K,(cy+ry)*K])
def P(pts): return ('poly',[(x*K,y*K) for x,y in pts])
def eye(im,x,y,r=2.2):
    d=ImageDraw.Draw(im); d.ellipse([(x-r)*K,(y-r)*K,(x+r)*K,(y+r)*K],fill=(46,34,26,255)); d.ellipse([(x-r*.2)*K,(y-r*.75)*K,(x+r*.45)*K,(y-r*.1)*K],fill=(255,255,255,240))
def ripple(im,cx,cy,rx):
    d=ImageDraw.Draw(im)
    for k,a in [(1,120),(1.5,70)]: d.ellipse([(cx-rx*k)*K,(cy-rx*k*.28)*K,(cx+rx*k)*K,(cy+rx*k*.28)*K],outline=(236,242,238,a),width=K)
def small(im): return im.resize((S,S),Image.LANCZOS)
N=6
TAU=2*math.pi
def strider(t):
    im=canvas(); k=math.sin(t*TAU)
    for (x0,y0,x1,y1,ph) in [(80,82,30,104,0),(84,82,134,104,0),(78,80,40,62,1),(86,80,124,64,1)]:
        dx=(k if ph==0 else -k)*9; line(im,[(x0,y0),((x0+x1)/2+dx/2,(y0+y1)/2-6),(x1+dx,y1)],1.3); ripple(im,x1+dx,y1+2,5+abs(k)*1.5)
    line(im,[(96,78),(110,72),(116,74)],1.1);line(im,[(96,82),(108,86),(112,90)],1.1)
    fill(im,E(80,80,20,5),(96,80,62),seed=1); fill(im,E(100,79,6,4.5),(104,86,66),seed=2); eye(im,103,77,1.6)
    line(im,[(104,76),(118,66+k)],.9);line(im,[(104,77),(119,70-k)],.9); return im
def snail(t):
    im=canvas(); k=math.sin(t*TAU)
    fill(im,P([(46,104),(112,104),(124,100+k),(118,92),(60,94)]),(150,140,118),seed=3)
    line(im,[(114,96),(126,84+2*k)],1.1);line(im,[(118,97),(130,90-2*k)],1.1)
    fill(im,E(80+k*.8,84,26,22),(170,128,82),seed=4)
    d=ImageDraw.Draw(im)
    for r in (18,11,5): d.arc([(80+k*.8-r)*K,(84-r)*K,(80+k*.8+r)*K,(84+r)*K],40,340,fill=OUTLINE,width=int(1.4*K))
    return im
def eggs(t):
    im=canvas(); rng=np.random.default_rng(5); k=math.sin(t*TAU)
    for i in range(16):
        x,y=80+rng.normal(0,18),88+rng.normal(0,9); x+=k*.6*math.sin(i)
        fill(im,E(x,y,7,6),(214,228,222),seed=10+i,outline=False)
        d=ImageDraw.Draw(im); d.ellipse([(x-1.8)*K,(y-1.8)*K,(x+1.8)*K,(y+1.8)*K],fill=(46,40,32,230))
    ripple(im,80,92,30+k); return im
def tadpole(t):
    im=canvas(); pts=[(70,80)]
    for k in range(1,9): pts.append((70-k*6,80+math.sin(k*.9-t*TAU)*(1.5+k*.6)))
    line(im,pts,4,(78,70,58,220)); line(im,pts,1.4)
    fill(im,E(86,80,15,12),(82,74,60),seed=6); eye(im,92,76,1.8); return im
def frog(t):
    """one leap per cycle: sit, crouch, push off, stretched in the air, front feet land, settle with a ripple"""
    im=canvas(); i=int(round(t*N))%N
    G=(126,166,96); D=(116,156,88); L=(132,172,100)
    def leg(pts,w=3.6): line(im,pts,w,D+(240,)); line(im,pts,1.0)
    def head(x,y,rot=0):
        fill(im,E(x,y,16,12),L,seed=9); fill(im,E(x+4,y-10,7,7),(140,176,104),seed=10); eye(im,x+5,y-10,3.2)
        line(im,[(x-4,y+6),(x+14,y+6+rot)],1.0)
    if i in (0,5):       # sitting (5: just landed, ripple)
        fill(im,E(64,104,14,7),D,seed=8)
        fill(im,P([(52,106),(60,90),(78,80),(102,80),(116,92),(118,106)]),G,seed=7); head(106,82)
        leg([(108,96),(118,104),(126,106)])
        if i==5: ripple(im,80,110,30)
    elif i==1:           # crouch: body low, haunches up
        fill(im,E(62,104,16,8),D,seed=8)
        fill(im,P([(50,108),(58,94),(78,86),(104,86),(118,98),(120,108)]),G,seed=7); head(108,90)
        leg([(110,100),(122,106),(130,108)])
    elif i==2:           # push off: body tilted up, hind legs straightening behind
        leg([(62,92),(46,102),(34,110)],4)
        fill(im,P([(56,96),(66,80),(86,66),(106,62),(116,72),(100,90)]),G,seed=7); head(110,64,-2)
        leg([(108,76),(122,72),(132,66)])
    elif i==3:           # in the air: fully stretched, hind legs trailing straight, front legs reaching
        leg([(58,70),(38,74),(20,78)],4); leg([(60,74),(42,82),(26,88)],3.4)
        fill(im,P([(54,72),(70,58),(96,52),(114,56),(116,66),(96,74)]),G,seed=7); head(116,56,-1)
        leg([(116,62),(132,62),(142,66)]); leg([(112,66),(128,70),(136,74)],3)
    else:                # i==4 landing: front feet down first, hind legs folding in
        leg([(60,88),(46,90),(40,98)],4)
        fill(im,P([(54,92),(66,80),(88,74),(108,78),(118,92),(98,98)]),G,seed=7); head(110,82,1)
        leg([(112,92),(122,104),(130,108)]); ripple(im,124,110,10)
    return im
def nymph(t):
    im=canvas(); k=math.sin(t*TAU); line(im,[(80,140),(80,30)],3,(110,122,82,235))
    y=-k*3
    fill(im,E(80,84+y,9,20),(118,104,78),seed=14); fill(im,E(80,62+y,8,7),(124,110,82),seed=15); eye(im,76,60+y,1.6); eye(im,84,60+y,1.6)
    for dy in (0,10,20): line(im,[(72,76+dy+y),(64,72+dy+y+k)],1.0); line(im,[(88,76+dy+y),(96,72+dy+y-k)],1.0)
    return im
def dragonfly(t):
    im=canvas(); k=math.sin(t*TAU*2)      # wings beat twice per cycle
    for side in (-1,1):
        for (L,yy,lift) in [(46,66,1),(42,74,.8)]:
            w=L*(.75+.25*abs(k)); x1=80+side*w; y1=yy-k*8*lift
            fill(im,P([(80,yy-3),(x1,y1-5),(x1-side*4,y1+4),(80,yy+3)]),(224,234,236),seed=12,width=1.2)
    for i in range(9): fill(im,E(80,60+i*6,3.2-.15*i,3.2),(140,96,62),seed=13+i,outline=False)
    line(im,[(80,56),(80,112)],.8); fill(im,E(80,54,6,5),(150,104,66),seed=30); eye(im,77,52,1.8); eye(im,83,52,1.8); return im
def beetle(t):
    im=canvas(); k=math.sin(t*TAU)
    line(im,[(66,92),(50,100+k*6),(40,98+k*8)],2.2); line(im,[(94,92),(110,100-k*6),(120,98-k*8)],2.2)
    fill(im,E(80,84,20,26),(66,72,54),seed=16); line(im,[(80,64),(80,108)],1.0)
    fill(im,E(80,60,11,7),(72,78,58),seed=17); eye(im,74,58,1.4); eye(im,86,58,1.4)
    d=ImageDraw.Draw(im); up=(t*40)%40
    for (x,y,r) in [(96,48-up*.5,5),(104,38-up*.5,3)]: d.ellipse([(x-r)*K,(y-r)*K,(x+r)*K,(y+r)*K],outline=(236,244,244,220),width=K)
    return im
def medaka(t):
    im=canvas(); k=math.sin(t*TAU)
    b=lambda x:80+math.sin((x-110)/30-t*TAU)*(110-x)/18
    top=[(x,b(x)-8*math.sin((x-40)/76*math.pi)) for x in range(44,118,8)]; bot=[(x,b(x)+8*math.sin((x-40)/76*math.pi)) for x in range(116,42,-8)]
    fill(im,P(top+bot),(198,192,164),seed=18)
    ty=b(44); fill(im,P([(44,ty),(28,ty-10+k*4),(32,ty+k*2),(28,ty+10+k*4)]),(192,186,158),seed=19)
    eye(im,108,b(108)-1,2.2); return im
def larva(t):
    im=canvas(); k=math.sin(t*TAU)
    line(im,[(80,70),(80+k*3,86),(84-k*4,100),(88+k*3,106)],3.2,(96,88,70,220)); fill(im,E(80,68,6,5),(104,94,72),seed=20)
    line(im,[(88+k*3,106),(94,102)],1); line(im,[(88+k*3,106),(92,110)],1); ripple(im,80,64,10); return im
CRE=[('strider',strider),('snail',snail),('eggs',eggs),('tadpole',tadpole),('frog',frog),('nymph',nymph),('dragonfly',dragonfly),('beetle',beetle),('medaka',medaka),('larva',larva)]
STILL={'eggs','snail','nymph','larva'}   # user: "몇몇 애들은 조트로프가 필요 없는데": these get one still frame (the game adds a slow drift / bob)
frames={}
for name,fn in CRE:
    n=1 if name in STILL else N
    fr=[small(fn(i/N)) for i in range(n)]; frames[name]=fr
    strip=Image.new('RGBA',(S*n,S),(0,0,0,0))
    for i,f in enumerate(fr): strip.alpha_composite(f,(i*S,0))
    strip.save(os.path.join(OUT,'life-'+name+'.png'),optimize=True)
if len(sys.argv)>1:
    from PIL import ImageFont
    font=ImageFont.truetype(os.path.join(os.path.dirname(__file__),'..','app','src','main','assets','web','fonts','GowunDodum-Regular.ttf'),18)
    LABEL={'strider':'물땡땡이 (소금쟁이)','snail':'방울이 (물달팽이)','eggs':'꼬물이 · 알','tadpole':'꼬물이 · 올챙이','frog':'꼬물이 · 개구리','nymph':'잠잠이 · 애벌레','dragonfly':'잠잠이 (잠자리)','beetle':'동글이 (물방개)','medaka':'반짝이 (송사리)','larva':'장구벌레 (해충)'}
    sheet=Image.new('RGBA',(200+S*N,S*len(CRE)),(196,214,208,255)); d=ImageDraw.Draw(sheet)
    for r,(name,_) in enumerate(CRE):
        d.text((12,r*S+S/2),LABEL[name],font=font,fill=(60,50,40),anchor='lm')
        for i,f in enumerate(frames[name]): sheet.alpha_composite(f,(200+i*S,r*S))
    sheet.convert('RGB').save(sys.argv[1])
print('ok')
