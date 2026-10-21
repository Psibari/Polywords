import numpy as np, cv2
from PIL import Image
import simplify2 as S
# ---- floor: rim only near grout ----
def floor_simplify2(img, grout_thr=44, med=21):
    a=np.array(img.convert('RGBA')); rgb=a[...,:3]; al=a[...,3]; m=al>128
    v=rgb.max(2); vm=cv2.medianBlur(np.where(m,v,0).astype(np.uint8),41).astype(np.float32)
    g=(((v<grout_thr)|(v<0.62*vm))&m).astype(np.uint8)
    g=cv2.morphologyEx(g,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3)))
    g=cv2.morphologyEx(g,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
    face=cv2.inpaint(rgb,((g>0)|(~m)).astype(np.uint8)*255,6,cv2.INPAINT_TELEA)
    sm=cv2.bilateralFilter(cv2.medianBlur(face,med),9,30,9).astype(np.float32)
    near=(cv2.distanceTransform((1-g).astype(np.uint8),cv2.DIST_L2,3)<9).astype(np.float32)
    near=cv2.GaussianBlur(near,(0,0),2)[...,None]
    rim=S._rim(face,9,0.8)*near
    out=sm+rim
    gm=cv2.GaussianBlur(g.astype(np.float32),(0,0),1.3)[...,None]
    out=out*(1-gm)+np.array([13,9,34],np.float32)*gm
    out=np.clip(out,0,255).astype(np.uint8); out[~m]=rgb[~m]
    return Image.fromarray(np.dstack([out,al]),'RGBA'), g
fs,g=floor_simplify2(Image.open('floor_g.png')); fs.save('floor_s.png')
a=np.array(fs); al=a[...,3]; m=al>128
v=a[...,:3].astype(np.float32).max(2)
face=(m&(g==0)); lo=13.0; hi=float(np.percentile(v[face],97))
t=np.clip((v-lo)/(hi-lo),0,1.15)
def ramp(dark,light,name):
    d=np.array(dark,np.float32); l=np.array(light,np.float32)
    rgb=d+(l-d)*t[...,None]
    rgb[(~face)&m]=np.array([10,8,26],np.float32)*(1-t[(~face)&m][:,None]*0)+0  # grout stays deep
    # keep soft grout edge by blending with original darkness
    out=np.clip(rgb,0,255).astype(np.uint8); Image.fromarray(np.dstack([out,al]),'RGBA').save(name)
# on-palette floors (faces map t~0.65): dark -> light
ramp([12,10,30],[40,35,86],'floor_slate.png')   # night slate: #1A1830/#211B4A family
ramp([18,9,30],[64,30,90],'floor_plum.png')   # plum: #7B2D8B family, darkened
# ---- wall: simplify, then shade toward the console (bottom) ----
w=S.stone_simplify(Image.open('wall_g.png')); a=np.array(w).astype(np.float32); H=a.shape[0]
grad=np.ones(H,np.float32); y=np.arange(H)/H
grad=0.88-0.40*np.clip((y-0.35)/0.65,0,1)**1.3   # overall 0.88 down to ~0.48 at the base
a[...,:3]*=grad[:,None,None]
# cool/deepen the shadow a touch (toward #0F0D2A)
sh=(1-grad/0.88)[:,None,None]*0.35
a[...,:3]=a[...,:3]*(1-sh)+np.array([15,13,42],np.float32)*sh
Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA').save('wall_s.png')
# preview floors at display scale
fl=[Image.open(n) for n in ('floor_g.png','floor_s.png','floor_slate.png','floor_plum.png')]
sc=0.45; tiles=[im.resize((int(im.size[0]*sc),int(im.size[1]*sc)),Image.LANCZOS) for im in fl]
sheet=Image.new('RGBA',(tiles[0].size[0]*2+10,tiles[0].size[1]*2+10),(10,10,20,255))
for i,t_ in enumerate(tiles): sheet.alpha_composite(t_,((i%2)*(t_.size[0]+10),(i//2)*(t_.size[1]+10)))
sheet.convert('RGB').save('floors_prev.png'); print(sheet.size)
