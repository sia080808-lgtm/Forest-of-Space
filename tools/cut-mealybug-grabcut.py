# 솜깍지 cut from the SRS sheet (09) with OpenCV GrabCut: the white wax body is close to the paper colour, so a colour
# threshold either loses the pale top or keeps paper/ground. Seeds: sure body (inner ellipse), sure background (crop
# border and soil by colour: LAB b > 146 and darker), the rest probable. Largest piece, holes
# filled, 1 px soft edge. Needs the sheet image: python3 tools/cut-mealybug-grabcut.py sheet.jpeg
import sys,cv2,numpy as np
from scipy import ndimage as nd
sheet=cv2.imread(sys.argv[1]);x0,y0,x1,y1=1095,760,1360,900;img=sheet[y0:y1,x0:x1].copy();h,w=img.shape[:2]
mask=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
yy,xx=np.mgrid[:h,:w]
inner=((xx-152)/92)**2+((yy-62)/34)**2<=1;mask[inner]=cv2.GC_FGD
body=((xx-152)/112)**2+((yy-60)/50)**2<=1;mask[body&~inner]=cv2.GC_PR_FGD
mask[:3]=cv2.GC_BGD;mask[:,:3]=cv2.GC_BGD;mask[:,-3:]=cv2.GC_BGD;mask[-3:]=cv2.GC_BGD
lab=cv2.cvtColor(img,cv2.COLOR_BGR2LAB).astype(int);ground=(lab[...,2]>146)&(lab[...,0]<225);mask[ground&(mask!=cv2.GC_FGD)]=cv2.GC_BGD  # soil by colour only (yellower and darker than the wax), never by a cut line, so the legs keep their tips
bg=np.zeros((1,65),np.float64);fg=np.zeros((1,65),np.float64)
cv2.grabCut(img,mask,None,bg,fg,8,cv2.GC_INIT_WITH_MASK)
m=(mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)
lb,n=nd.label(m);m=lb==(1+int(np.argmax(nd.sum(m,lb,range(1,n+1)))));m=nd.binary_fill_holes(m)
# thin parts GrabCut drops (antennae, wax spines on the back): colour distance from the paper, only in the upper half
# and within 14 px of the body; no green (a sprout behind the tail) anywhere
rgb=img[...,::-1].astype(float);paper=np.array([252,242,233.]);dp=np.abs(rgb-paper).sum(-1)
green=(lab[...,1]<124)&(lab[...,2]>130)
thin=(dp>30)&(yy<62)&(xx<80)&nd.binary_dilation(m,iterations=36)&~green  # antennae only (the back lobes are traced below)
# legs over the soil: below the body the background is soil (b >= 147) or paper (b <= 135); the legs sit between
legs=(yy>88)&(lab[...,2]>=137)&(lab[...,2]<=145)&(lab[...,0]>205)&nd.binary_dilation(m,iterations=30)&~green  # legs b 139~145; soil >=147, paper <=135
legs=nd.binary_closing(legs,iterations=1)
m=m|legs
tailsoil=(lab[...,2]>146)&(lab[...,0]<215)  # soil/plant bits are yellower (LAB b 149~154) and darker; body and belly are b 137~140
m=(m|thin)&~green&~(tailsoil&~nd.binary_dilation(legs,iterations=1));lb,n=nd.label(m,structure=np.ones((3,3)));m=lb==(1+int(np.argmax(nd.sum(m,lb,range(1,n+1)))));m=nd.binary_fill_holes(m)
# broad wax lobes on the back are as light as the paper, so no colour or edge test finds them cleanly (tried: colour
# distance, GrabCut band, Canny outlines, warmth). They are given a lobe-shaped mask instead; only the sheet's own
# pixels are used inside it.
# lobes follow the body's own top edge: every ~12 px along it from behind the head to the tail, an ellipse pointing
# outward (half-length 8, half-width 4.5, centre 5 px out), like the sheet's fringe of about 13 lobes
cols=[x for x in range(70,250) if m[:70,x].any()];top=np.array([np.nonzero(m[:,x])[0].min() for x in cols]);cols=np.array(cols)
pts=np.stack([cols,top],1).astype(float);seg=np.r_[0,np.cumsum(np.hypot(*np.diff(pts,axis=0).T))]
lob=np.zeros_like(m)
for d_ in np.arange(6,seg[-1]-4,12.0):
    i=int(np.searchsorted(seg,d_));i=min(max(i,1),len(pts)-2);tx,ty=pts[i+1]-pts[i-1];nrm=np.array([ty,-tx])/max(1e-6,np.hypot(tx,ty))
    if nrm[1]>0:nrm=-nrm
    cx,cy=pts[i]+nrm*5;ang=np.arctan2(nrm[1],nrm[0]);ca,sa=np.cos(ang),np.sin(ang);u=(xx-cx)*ca+(yy-cy)*sa;v=-(xx-cx)*sa+(yy-cy)*ca;lob|=(u/8)**2+(v/4.5)**2<=1
m=(m|lob)&~green&~(tailsoil&~nd.binary_dilation(legs,iterations=1))  # no closing (paper between lobes stays open); leg edges are not soil
lb,n=nd.label(m,structure=np.ones((3,3)));m=nd.binary_fill_holes(lb==(1+int(np.argmax(nd.sum(m,lb,range(1,n+1))))))
al=cv2.GaussianBlur((m*255).astype(np.uint8),(3,3),0.8)
rgba=cv2.cvtColor(img,cv2.COLOR_BGR2BGRA);rgba[...,3]=al
ys,xs=np.nonzero(al>8);rgba=rgba[ys.min():ys.max()+1,xs.min():xs.max()+1]
cv2.imwrite('app/src/main/assets/web/assets/forest/creatures/mealybug.png',rgba);print('mealybug',rgba.shape[1],'x',rgba.shape[0])
