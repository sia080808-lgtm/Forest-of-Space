"""0.9.1 수련 (SRS v2.33 LK-04): water-lily sprites for the six stages (leaf, bud, half open, full, sinking, withered),
in the same watercolour style as the approved lake mock (user: "좋네"). Transparent, 320x220, anchor (160,130) = the point on the
water the lily floats at. Usage: python3 tools/draw-waterlily.py"""
import os
import numpy as np, math, sys
from PIL import Image, ImageDraw, ImageFilter, ImageFont
CW,CH=320,220; rng=np.random.default_rng(3)
FONT='/home/user/Forest-of-Space/app/src/main/assets/web/fonts/GowunDodum-Regular.ttf'
def grain(w,h,s=4,seed=0):
    r=np.random.default_rng(seed); g=r.random((h//s+1,w//s+1))
    return np.asarray(Image.fromarray((g*255).astype(np.uint8)).resize((w,h),Image.BICUBIC),np.float32)/255
def wash(mask,c_in,c_edge,light=None,seed=0,alpha=.92,edge_w=.12):
    """watercolor fill of a 0..1 mask: pigment pools at the edge, granulation, soft edge"""
    h,w=mask.shape; m=np.asarray(Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2)),np.float32)/255
    inner=np.asarray(Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7)),np.float32)/255
    edge=np.clip((m-inner)*3,0,1)
    g=grain(w,h,3,seed)
    c=np.array(c_in,np.float32)[None,None]*(1-edge[...,None])+np.array(c_edge,np.float32)[None,None]*edge[...,None]
    if light is not None: c=c+light[...,None]*30
    c=c*(.95+.08*g[...,None])
    return np.dstack([np.clip(c,0,255),m*alpha*255]).astype(np.uint8)
def comp(base,rgba,xy=(0,0)):
    im=Image.fromarray(rgba,'RGBA'); base.alpha_composite(im,xy)
def poly_mask(w,h,pts,blur=0):
    im=Image.new('L',(w,h),0); ImageDraw.Draw(im).polygon(pts,fill=255)
    if blur: im=im.filter(ImageFilter.GaussianBlur(blur))
    return np.asarray(im,np.float32)/255
def water_bg():
    im=Image.new('RGBA',(CW,CH),(246,238,224,255)); a=np.zeros((CH,CW),np.float32)
    yy,xx=np.mgrid[0:CH,0:CW]; d=np.sqrt(((xx-CW/2)/(CW*.48))**2+((yy-CH*.62)/(CH*.34))**2)
    m=np.clip((1-d)/.35,0,1)*(.8+.2*grain(CW,CH,40,7))
    rgba=np.dstack([np.full((CH,CW),186),np.full((CH,CW),206),np.full((CH,CW),202),m*200]).astype(np.uint8)
    im.alpha_composite(Image.fromarray(rgba,'RGBA'));d2=ImageDraw.Draw(im)
    for i,(y,L) in enumerate([(CH*.82,60),(CH*.88,40),(CH*.76,30)]):
        x=CW*(.25+.25*i); d2.arc([x-L,y-L*.15,x+L,y+L*.15],200,340,fill=(236,242,238,170),width=2)
    return im
def leaf(im,cx,cy,rx,col=(120,154,106),dry=0,seed=1,notch=.4,curl=0):
    ry=rx*.45; w,h=im.size
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32); ang=np.arctan2((yy-cy)/ry,(xx-cx)/rx); rr=np.sqrt(((xx-cx)/rx)**2+((yy-cy)/ry)**2)
    r=np.random.default_rng(seed); wob=sum(r.uniform(.01,.035)*np.sin(k*ang+r.uniform(0,6)) for k in (3,5,7))
    if curl: wob=wob-curl*np.clip(np.sin(ang+1.2),0,1)*.35
    m=((rr<1+wob)&~((np.abs(np.angle(np.exp(1j*(ang-notch))))<.17)&(rr>.1))).astype(np.float32)
    # shadow on water
    sh=Image.fromarray((m*70).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)); shc=Image.new('RGBA',im.size,(70,92,96,0)); shc.putalpha(sh)
    im.alpha_composite(shc,(3,5))
    c=np.array(col,np.float32)*(1-dry)+np.array([168,136,92],np.float32)*dry
    light=np.clip(1-(((xx-cx+rx*.3)/rx)**2+((yy-cy+ry*.4)/ry)**2)*.8,0,1)
    rgba=wash(m,c,c*.72,light,seed)
    # veins
    v=Image.fromarray(rgba,'RGBA'); vd=ImageDraw.Draw(v)
    for k in range(11):
        t=notch+.35+k*(2*math.pi-.7)/10; ex=cx+math.cos(t)*rx*.9; ey=cy+math.sin(t)*ry*.9
        vd.line([(cx,cy),(ex,ey)],fill=tuple(int(min(255,x+28)) for x in c)+(110,),width=1)
    im.alpha_composite(v)
def stem(im,x0,y0,x1,y1,col=(112,136,92),w=4):
    d=ImageDraw.Draw(im); n=12
    for i in range(n):
        t0,t1=i/n,(i+1)/n; xa=x0+(x1-x0)*t0+math.sin(t0*3)*3; xb=x0+(x1-x0)*t1+math.sin(t1*3)*3
        d.line([(xa,y0+(y1-y0)*t0),(xb,y0+(y1-y0)*t1)],fill=col+(230,),width=w)
def petal(im,bx,by,ang,L,W,tip=(232,150,170),base=(250,236,234),seed=0,bend=0):
    w,h=im.size; pts=[]
    for i in range(25):
        t=i/24; s=math.sin(t*math.pi)**.9*W*(1-.25*t); y=-L*t
        pts.append((s,y))
    pts=pts+[(-x,y) for x,y in reversed(pts)]
    ca,sa=math.cos(ang),math.sin(ang); P=[(bx+x*ca-y*sa+bend*(y/L)**2*0, by+x*sa+y*ca) for x,y in pts]
    m=poly_mask(w,h,P)
    yy,xx=np.mgrid[0:h,0:w].astype(np.float32)
    # along-petal coordinate: projection onto petal axis
    ax,ay=math.sin(ang)*-1,-math.cos(ang)*-1; t=np.clip(((xx-bx)*(-sa*-1)+(yy-by)*(ca*-1))/L,0,1)
    t=np.clip(((xx-bx)*sa-(yy-by)*ca)/L,0,1)
    c=np.array(base,np.float32)[None,None]*(1-t[...,None]**1.4)+np.array(tip,np.float32)[None,None]*(t[...,None]**1.4)
    mm=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1)),np.float32)/255
    inner=np.asarray(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(5)),np.float32)/255
    edge=np.clip((mm-inner)*3,0,1); g=grain(w,h,3,seed)
    c=c*(1-.12*edge[...,None])*(.96+.06*g[...,None])
    # faint vein lines
    rgba=np.dstack([np.clip(c,0,255),mm*.93*255]).astype(np.uint8); im.alpha_composite(Image.fromarray(rgba,'RGBA'))
def flower(im,cx,cy,open_,scale=1.0,seed=0):
    """open_: 0 = tight bud .. 1 = fully open"""
    L=58*scale; W=20*scale
    if open_<.15:   # bud: three overlapping petals, pointed
        for i,a in enumerate([-.18,.18,0]): petal(im,cx+a*14*scale,cy,a,L*1.05,W*(1.05 if i==2 else .9),seed=seed+i)
        return
    n_out=6; spread=.25+open_*1.15
    back=[(-spread*.55,.85),(spread*.55,.85),(0,.95)]
    for i,(a,k) in enumerate(back): petal(im,cx,cy,a,L*k,W*.95,tip=(226,140,162),seed=seed+10+i)
    for i in range(n_out):
        a=-spread+2*spread*i/(n_out-1); k=.8+.15*math.cos(a)
        petal(im,cx,cy+6*scale,a,L*k*(.9+.1*open_),W,seed=seed+20+i)
    if open_>.75:  # golden stamens and pale-green seed head
        d=ImageDraw.Draw(im)
        for i in range(22):
            a=-math.pi+i*math.pi/21; r=18*scale
            d.line([(cx,cy-14*scale),(cx+math.cos(a)*r,cy-14*scale+math.sin(a)*r*.55)],fill=(222,184,90,200),width=2)
        d.ellipse([cx-11*scale,cy-22*scale,cx+11*scale,cy-12*scale],fill=(196,206,128,235))
    front=[(-spread*.3,.7),(spread*.3,.7)]
    if open_>.4:
        for i,(a,k) in enumerate(front): petal(im,cx,cy+10*scale,a+math.pi*0,L*k*.55,W*.9,seed=seed+40+i)
def seedpod(im,cx,cy,dry=0,droop=0):
    w,h=im.size; m=np.zeros((h,w),np.float32); yy,xx=np.mgrid[0:h,0:w]
    tilt=droop*.9
    m=(((xx-cx)/30)**2+((yy-cy)/15)**2<1).astype(np.float32)
    top=(((xx-cx)/30)**2+((yy-cy+8)/12)**2<1).astype(np.float32)
    mm=np.clip(m+top,0,1)
    c=np.array([150,170,104])*(1-dry)+np.array([140,112,76])*dry
    im2=Image.new('RGBA',im.size,(0,0,0,0)); im2.alpha_composite(Image.fromarray(wash(mm,c,c*.7,None,5),'RGBA'))
    d=ImageDraw.Draw(im2)
    for i in range(9):
        a=i*2*math.pi/9; d.ellipse([cx+math.cos(a)*16-3,cy-8+math.sin(a)*7-2,cx+math.cos(a)*16+3,cy-8+math.sin(a)*7+2],fill=tuple(int(x*.6) for x in c)+(220,))
    d.ellipse([cx-3,cy-10,cx+3,cy-6],fill=tuple(int(x*.6) for x in c)+(220,))
    if droop: im2=im2.rotate(-35*droop,center=(cx,cy+20),resample=Image.BICUBIC)
    im.alpha_composite(im2)
def sink(im,cx,cy,k):
    """only the tips of the closed flower above the water, with a ripple ring"""
    lay=Image.new('RGBA',im.size,(0,0,0,0)); flower(lay,cx,cy,0,.8,seed=7)
    a=np.asarray(lay).copy(); yy=np.arange(a.shape[0])[:,None]
    keep=np.clip((cy-26-yy)/6+1,0,1)          # fade out below the waterline
    a[...,3]=(a[...,3]*keep*.85).astype(np.uint8); im.alpha_composite(Image.fromarray(a,'RGBA'))
    d=ImageDraw.Draw(im)
    for r,al in [(18,110),(30,60)]: d.arc([cx-r,cy-26-r*.28,cx+r,cy-26+r*.28],0,360,fill=(236,242,238,al),width=2)

OUT=os.path.join(os.path.dirname(__file__),'..','app','src','main','assets','web','assets','forest','lake')
for name in ['leaf','bud','half','full','sink','wither']:
    im=Image.new('RGBA',(CW,CH),(0,0,0,0)); cx,cy=160,130
    if name=='leaf': leaf(im,cx+10,cy,62,seed=11,notch=.6)
    elif name=='bud': leaf(im,cx+38,cy-4,92,seed=12); flower(im,cx-46,cy+8,0,.8,seed=1)
    elif name=='half': leaf(im,cx+38,cy-4,92,seed=13); flower(im,cx-44,cy+10,.5,.9,seed=2)
    elif name=='full': leaf(im,cx+40,cy-6,92,seed=14); flower(im,cx-46,cy+12,1.0,1.05,seed=3)
    elif name=='sink': leaf(im,cx+38,cy-4,90,seed=15,col=(132,150,100)); sink(im,cx-46,cy+14,0)
    else: leaf(im,cx+12,cy,84,seed=16,dry=.75,curl=.6)
    im.save(os.path.join(OUT,'lily-'+name+'.png'),optimize=True)
print('ok')
