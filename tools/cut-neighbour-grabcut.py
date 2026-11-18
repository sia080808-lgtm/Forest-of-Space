# Cut a small neighbour from the SRS v2.22 'small neighbours' sheet (pp. 249~253) with OpenCV GrabCut, keeping the
# sheet's own pixels. Soil is told apart by colour only (yellower, LAB b >= 146, and mid-light), never by a cut line,
# so feet and chins are not chopped (lesson from the first 흙지기 cut). Paper = very light and not yellow.
# usage: python3 tools/cut-neighbour-grabcut.py sheet.jpeg <name>
#   pillbug        돌돌이 walking (sheet 01, left)      pillbug-ball  돌돌이 rolled up (sheet 01, right; the '!!!' marks dropped)
#   rove-beetle    쏙쏙이 (sheet 05)
import sys,cv2,numpy as np
from scipy import ndimage as nd
CFG={'pillbug':{'box':(25,195,355,375),'fg':lambda L,a,b:(L<185)&(b<146),
       # its pale legs have the soil's own colour (b 141~147 vs soil 146~148), so no colour test separates them: each leg
       # is pointed out by hand on a 4x close-up (hip -> tip, width), and the sheet's own pixels inside are kept
       'paths':[((100,150),(91,166),7),((133,152),(128,170),8),((175,150),(170,170),8),((206,140),(210,169),8),((225,136),(243,162),8),((255,132),(270,158),8),((282,130),(295,153),8),((300,127),(313,144),7)],
       'blobs':[(108,149,8,5)]},
     'pillbug-ball':{'box':(355,240,480,375),'fg':lambda L,a,b:(L<200)&(b<145)},
     'rove-beetle':{'box':(540,470,950,630),'fg':lambda L,a,b:(L<170)}}
sheet=cv2.imread(sys.argv[1]);name=sys.argv[2];c=CFG[name];x0,y0,x1,y1=c['box'];img=sheet[y0:y1,x0:x1].copy();h,w=img.shape[:2]
lab=cv2.cvtColor(img,cv2.COLOR_BGR2LAB).astype(int);L,a,b=lab[...,0],lab[...,1],lab[...,2]
green=(a<124)&(b>130);paper=(L>238)&(b<137);soil=(b>=146)&(L<232)&(L>120)
mask=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
core=nd.binary_opening(c['fg'](L,a,b)&~green,iterations=2);lb,n=nd.label(core);core=lb==(1+int(np.argmax(nd.sum(core,lb,range(1,n+1)))))
mask[nd.binary_dilation(core,iterations=14)]=cv2.GC_PR_FGD;mask[core]=cv2.GC_FGD
mask[paper|soil|green]=cv2.GC_BGD;mask[core]=cv2.GC_FGD
if 'below' in c: mask[:c['below']]=np.where(mask[:c['below']]==cv2.GC_FGD,cv2.GC_FGD,cv2.GC_BGD)  # the '!!!' marks above the ball
mask[:1]=cv2.GC_BGD;mask[-1:]=cv2.GC_BGD;mask[:,:1]=cv2.GC_BGD;mask[:,-1:]=cv2.GC_BGD
bg=np.zeros((1,65));fg=np.zeros((1,65));cv2.grabCut(img,mask,None,bg,fg,8,cv2.GC_INIT_WITH_MASK)
m=(mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD);m&=~green
if c.get('paths'):
    hand=np.zeros((h,w),np.uint8)
    for p0,p1,wd in c['paths']:cv2.line(hand,p0,p1,255,wd,cv2.LINE_AA)
    for cx,cy,rx,ry in c.get('blobs',[]):cv2.ellipse(hand,(cx,cy),(rx,ry),0,0,360,255,-1,cv2.LINE_AA)
    m|=hand>127
lb,n=nd.label(m,structure=np.ones((3,3)));m=lb==(1+int(np.argmax(nd.sum(m,lb,range(1,n+1)))));m=nd.binary_fill_holes(m)
al=cv2.GaussianBlur((m*255).astype(np.uint8),(3,3),.8);rgba=cv2.cvtColor(img,cv2.COLOR_BGR2BGRA);rgba[...,3]=al
ys,xs=np.nonzero(al>8);rgba=rgba[ys.min():ys.max()+1,xs.min():xs.max()+1]
cv2.imwrite('app/src/main/assets/web/assets/forest/creatures/'+name+'.png',rgba);print(name,rgba.shape[1],'x',rgba.shape[0])
