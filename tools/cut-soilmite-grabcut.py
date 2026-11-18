# 흙지기 cut from the SRS sheet (04) with OpenCV GrabCut. The sheet mite stands on soil; cutting at a soil line chopped
# its chin and leg tips (0.6.27 first cut). Here the soil is told apart by colour instead: the mite (body, legs, chin)
# is yellower (LAB b 159~166) than the soil and pebbles (147~152) and the paper (133). Seeds: sure mite b>=158, sure
# background b<=150 or paper-light, the rest probable; largest piece, holes filled, 1 px soft edge. Nothing is redrawn.
# usage: python3 tools/cut-soilmite-grabcut.py sheet.jpeg
import sys,cv2,numpy as np
from scipy import ndimage as nd
s=cv2.imread(sys.argv[1]);x0,y0,x1,y1=130,460,420,640;img=s[y0:y1,x0:x1].copy();h,w=img.shape[:2]
lab=cv2.cvtColor(img,cv2.COLOR_BGR2LAB).astype(int);b=lab[...,2];L=lab[...,0];a=lab[...,1]
green=(a<124)&(b>130)
mask=np.full((h,w),cv2.GC_PR_BGD,np.uint8)
mask[(b>=153)&~green]=cv2.GC_PR_FGD
mask[(b>=158)&~green]=cv2.GC_FGD
mask[(b<=148)|(L>238)|green]=cv2.GC_BGD
mask[:2]=cv2.GC_BGD;mask[-2:]=cv2.GC_BGD;mask[:,:2]=cv2.GC_BGD;mask[:,-2:]=cv2.GC_BGD
bg=np.zeros((1,65));fg=np.zeros((1,65));cv2.grabCut(img,mask,None,bg,fg,8,cv2.GC_INIT_WITH_MASK)
m=(mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD)
m=nd.binary_opening(m,iterations=1);lb,n=nd.label(m);m=lb==(1+int(np.argmax(nd.sum(m,lb,range(1,n+1)))));m=nd.binary_fill_holes(m)
al=cv2.GaussianBlur((m*255).astype(np.uint8),(3,3),.8);rgba=cv2.cvtColor(img,cv2.COLOR_BGR2BGRA);rgba[...,3]=al
ys,xs=np.nonzero(al>8);rgba=rgba[ys.min():ys.max()+1,xs.min():xs.max()+1]
cv2.imwrite('app/src/main/assets/web/assets/forest/creatures/soil-mite.png',rgba);print('soil-mite',rgba.shape[1],'x',rgba.shape[0])
