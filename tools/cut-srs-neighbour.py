# Cut one small neighbour out of the SRS v2.22 'small neighbours' sheet (PDF pp. 249~253, D04.20~24; the 1536x1024 image is
# extracted from the PDF to sheet.jpeg). Foreground = colour distance from the paper (border median, or PAPER=r,g,b);
# green sprouts dropped; the largest piece kept; enclosed holes filled (unless 'nofill', used for the gnat's clear wings);
# rows from ymax down dropped (ground line); optional per-colour filter below a row (soil under the feet).
# usage: python3 tools/cut-srs-neighbour.py sheet.jpeg out.png x0,y0,x1,y1 threshold 1 [ymax] [dp] [fill|nofill] [lowRow orange|dark]
# 0.6.27 cuts (sheet pixel boxes):
#   ladybird        1180,200,1440,370  60 1 150 dp fill 118 dark
#   soil-mite        140,470,410,625   55 1 103
#   root-gnat         85,745,345,905   60 1 148 dp nofill
#   root-gnat-larva  300,850,485,905   30 1 41
#   mealybug        1095,760,1360,900  PAPER=252,242,233 30 1 106, then a feathered body ellipse (47,22,262,104)+(45,48,112,104)
#                   united with the cut, ground below y 104 and at the right edge (r-b>45) removed
#   mealybug-eggsac 1340,830,1445,882  feathered ellipse (7,4,98,48) over the sheet pixels
import sys,numpy as np
from collections import deque
from PIL import Image, ImageFilter
src,out,box,T,mink=sys.argv[1],sys.argv[2],[int(v) for v in sys.argv[3].split(',')],float(sys.argv[4]),int(sys.argv[5])
ymax=int(sys.argv[6]) if len(sys.argv)>6 else 99999;mode=sys.argv[7] if len(sys.argv)>7 else 'dp';fill=(sys.argv[8]!='nofill') if len(sys.argv)>8 else True
a=np.array(Image.open(src).convert('RGB').crop(box)).astype(int);r,g,b=a[...,0],a[...,1],a[...,2];lum=a.mean(-1)
border=np.concatenate([a[:4].reshape(-1,3),a[-4:].reshape(-1,3),a[:,:4].reshape(-1,3),a[:,-4:].reshape(-1,3)]);import os
paper=np.array([float(v) for v in os.environ['PAPER'].split(',')]) if os.environ.get('PAPER') else np.median(border,0)
dp=np.abs(a-paper).sum(-1);green=(g-r>6)&(g-b>10)
if mode=='dp': fg=(dp>T)&~green
elif mode=='white': fg=((((r-b)<T)&(lum>170))|(lum<150))&~green
else: fg=(dp>T)&~green
low=int(sys.argv[9]) if len(sys.argv)>9 else 99999
if mode=='dp' and low<99999:
    keepc=sys.argv[10]
    sel=((r-g)>22) if keepc=='orange' else (lum<150)
    fg[low:]&=sel[low:]
fg[ymax:]=False
h,w=fg.shape;lab=np.zeros((h,w),int);sizes=[0];n=0
for y0,x0 in zip(*np.nonzero(fg)):
    if lab[y0,x0]:continue
    n+=1;lab[y0,x0]=n;q=deque([(y0,x0)]);c=0
    while q:
        y,x=q.popleft();c+=1
        for dy in(-1,0,1):
            for dx in(-1,0,1):
                yy,xx=y+dy,x+dx
                if 0<=yy<h and 0<=xx<w and fg[yy,xx] and not lab[yy,xx]:lab[yy,xx]=n;q.append((yy,xx))
    sizes.append(c)
order=np.argsort(sizes)[::-1];keep=[k for k in order[:mink] if sizes[k]>150]
m=np.isin(lab,keep)
bg=~m;reach=np.zeros_like(bg);q=deque([(y,x) for y in(0,h-1) for x in range(w) if bg[y,x]]+[(y,x) for x in(0,w-1) for y in range(h) if bg[y,x]])
for y,x in q:reach[y,x]=True
while q:
    y,x=q.popleft()
    for yy,xx in((y+1,x),(y-1,x),(y,x+1),(y,x-1)):
        if 0<=yy<h and 0<=xx<w and bg[yy,xx] and not reach[yy,xx]:reach[yy,xx]=True;q.append((yy,xx))
if fill: m|=bg&~reach
al=np.array(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8))).astype(float)
ys,xs=np.nonzero(al>8);bb=(xs.min(),ys.min(),xs.max()+1,ys.max()+1)
im=Image.fromarray(np.dstack([a,al]).clip(0,255).astype(np.uint8),'RGBA').crop(bb);im.save(out)
print(out,bb,[sizes[k] for k in keep],paper)
