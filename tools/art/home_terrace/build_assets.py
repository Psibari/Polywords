import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
import matplotlib.colors as mc
from clean import clean, U
def regrade(img, hue_t=0.715, hue_w=0.5, sat_mul=1.22, sat_add=0.03, sat_max=0.80, val_mul=1.16, val_max=0.68):
    a=np.array(img).astype(np.float32); al=a[...,3]
    hsv=mc.rgb_to_hsv(a[...,:3]/255.)
    h,s,v=hsv[...,0],hsv[...,1],hsv[...,2]
    dh=((hue_t-h+0.5)%1)-0.5
    h2=(h+dh*hue_w)%1
    s2=np.clip(s*sat_mul+sat_add,0,sat_max)
    # keep the deep recess dark: lift only tones above the dark band
    lift=np.clip((v-0.10)/0.18,0,1)
    v2=np.minimum(v*(1+(val_mul-1)*lift),val_max)
    out=mc.hsv_to_rgb(np.dstack([h2,s2,v2]))*255
    return Image.fromarray(np.dstack([out,al]).astype(np.uint8),'RGBA')
def save(im,name):
    bb=im.getbbox(); im=im.crop(bb); im.save(name); print(name,im.size,bb); return im
# wall
w=clean(U+'a0063890-image.png',erode=2,cut_y=458); w=regrade(w); save(w,'wall_g.png')
# plaques: split two slabs
p=clean(U+'e0b07c1e-image.png',erode=1,minblob=800)
p=regrade(p)
pa=np.array(p)[...,3]>20
rows=np.where(pa.any(1))[0]; gap=np.where(np.diff(rows)>1)[0][0]
r0,r1,r2,r3=rows[0],rows[gap],rows[gap+1],rows[-1]
save(p.crop((0,r0,p.size[0],r1+1)),'slab_hunt_g.png'); save(p.crop((0,r2,p.size[0],r3+1)),'slab_book_g.png')
# frame: make hole transparent
f=Image.open(U+'107caa10-image.png').convert('RGBA'); a=np.array(f)
dark=(a[...,:3].max(2)<14)
lab,n=ndi.label(dark); cl=lab[400,450]; hole=(lab==cl)
print('hole px',hole.sum(), 'bbox',np.where(hole.any(0))[0][[0,-1]],np.where(hole.any(1))[0][[0,-1]])
a[hole,3]=0
f=Image.fromarray(a,'RGBA')
f=clean(f,erode=2,minblob=800); f=regrade(f); f=save(f,'frame_g.png')
# floor: black grout -> deep violet, drop bottom shadow strip, keep alpha
fl=Image.open(U+'da228a38-image.png').convert('RGBA'); a=np.array(fl)
a[870:,3]=0
fl=Image.fromarray(a,'RGBA'); fl=clean(fl,erode=1,minblob=2000)
a=np.array(fl).astype(np.float32); blk=a[...,:3].max(2)<40
a[...,:3][blk]=np.array([13,9,34])*1.0
fl=Image.fromarray(a.astype(np.uint8),'RGBA'); save(fl,'floor_g.png')
# cage halves
for k,n in (('fb570787','cage_top'),('30e274a7','cage_base')):
    c=clean(U+k+'-image.png',erode=1,minblob=300); save(c,n+'_g.png')
