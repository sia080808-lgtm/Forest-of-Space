# Spider mite (잎응애, SRS D04.23 NB-08) from the predatory-mite cut (SRS sheet 06): both sheet mites share the same
# drawing template, but the spider mite sits on a same-coloured leaf and cannot be cut out. Recolour the clean cut to the
# sheet 08 palette (pale yellow body, cream legs) and add its two dark olive side blotches. Eyes and outline keep their value.
import sys,numpy as np
from PIL import Image, ImageFilter
src,out=sys.argv[1],sys.argv[2]
im=Image.open(src).convert('RGBA');a=np.array(im).astype(float);rgb,al=a[...,:3],a[...,3]
lum=rgb.mean(-1);r,g=rgb[...,0],rgb[...,1]
dark=np.array([160,140,84.]);light=np.array([240,226,168.])          # sheet 08 body shadow / highlight
t=np.clip((lum-70)/(200-70),0,1)[...,None]**.75
new=dark+(light-dark)*t
legs=(r-g)<55                                                            # legs are less saturated than the body
new[legs]=(np.array([200,160,104.])+(np.array([248,224,182.])-np.array([200,160,104.]))*t[legs])
eyes=(lum<95)&(al>200);new[eyes]=np.array([58,44,32.])
o=np.dstack([new,al]).clip(0,255).astype(np.uint8);res=Image.fromarray(o,'RGBA')
# two olive blotches on the back (body-only mask), soft watercolour edges
h,w=al.shape;body=((~legs)&(al>200)).astype(np.uint8)*255
blot=Image.new('L',(w,h),0)
from PIL import ImageDraw
d=ImageDraw.Draw(blot);d.ellipse((92,24,128,54),fill=190);d.ellipse((132,40,176,80),fill=185)
blot=blot.filter(ImageFilter.GaussianBlur(6));bm=np.minimum(np.array(blot).astype(float),np.array(Image.fromarray(body).filter(ImageFilter.MinFilter(5))).astype(float))/255
c=np.array(res).astype(float);olive=np.array([92,92,50.])
c[...,:3]=c[...,:3]*(1-bm[...,None]*.85)+olive*bm[...,None]*.85
Image.fromarray(c.clip(0,255).astype(np.uint8),'RGBA').save(out);print(out,w,h)
