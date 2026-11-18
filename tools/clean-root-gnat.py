# 뿌리날파리 cut fixes (run once on the cut sprite, 249x149): (1) ground specks under the feet — below the foot line only
# dark leg pixels stay; (2) the pale wedge where the wing root met the thorax in the sheet reads as a bite out of the
# thorax — pale pixels inside the thorax ellipse take the thorax colour (median of its dark pixels), with a soft edge.
import numpy as np
from PIL import Image
P='app/src/main/assets/web/assets/forest/creatures/root-gnat.png'
a=np.array(Image.open(P).convert('RGBA')).astype(float);h,w=a.shape[:2];rgb=a[...,:3];lum=rgb.mean(-1)
yy,xx=np.mgrid[:h,:w]
low=yy>=h-14;a[...,3][low&(lum>150)]=0          # ground specks are light beige; legs are dark brown
cx,cy,rx,ry=107,64,21,17;inside=((xx-cx)/rx)**2+((yy-cy)/ry)**2<=1
body=inside&(lum<150)&(a[...,3]>200);col=np.median(rgb[body],0)
pale=inside&(lum>=150)
a[pale,:3]=col;a[pale,3]=255
Image.fromarray(a.clip(0,255).astype(np.uint8),'RGBA').save(P);print('specks cleared, thorax filled',int(pale.sum()),'px, colour',col.astype(int))
# (3) larva: the tan soil strip under the white body — soil is yellower (LAB b > 146) and darker than the body
import numpy as np
import cv2
L='app/src/main/assets/web/assets/forest/creatures/root-gnat-larva.png'
im=cv2.imread(L,cv2.IMREAD_UNCHANGED);lab=cv2.cvtColor(im[...,:3],cv2.COLOR_BGR2LAB).astype(int)
soil=(lab[...,2]>146)&(lab[...,0]<225)&(lab[...,0]>60)   # keep the dark head capsule (L<=60)
from scipy import ndimage as nd
m=(im[...,3]>40)&~soil;lb,n=nd.label(m);m=lb==(1+int(np.argmax(nd.sum(m,lb,range(1,n+1)))))
m=nd.binary_fill_holes(nd.binary_closing(m,iterations=2))   # the shaded underside comes back; loose specks go
im[...,3]=np.where(m,im[...,3],0).astype(np.uint8);cv2.imwrite(L,im);print('larva kept px',int(m.sum()))
