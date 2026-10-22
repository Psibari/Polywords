import numpy as np, cv2, matplotlib.colors as mc
from PIL import Image
import simplify2 as S
HUE=0.717
def retarget(img, v_med, s_med, s_follow=0.55, v_cap=0.90, skip_dark=0.15):
    a=np.array(img.convert('RGBA')).astype(np.float32); al=a[...,3]; m=al>128
    hsv=mc.rgb_to_hsv(a[...,:3]/255.); v=hsv[...,2]; s=hsv[...,1]
    ref=m&(v>skip_dark)
    vm=np.median(v[ref]); sm=np.median(s[ref])
    k=v_med/vm
    v2=np.clip(v*k,0,v_cap)
    s2=np.clip(s_med+(s-sm)*s_follow,0.30,0.85)
    out=mc.hsv_to_rgb(np.dstack([np.full_like(v,HUE),s2,v2]))*255
    out=np.dstack([out,al]).astype(np.uint8); return Image.fromarray(out,'RGBA'), vm, sm
def hx(c): return '#%02X%02X%02X'%tuple(int(round(x)) for x in c)
# FLOOR: simplified faces -> #271E3D, seams #100A1C
fl=Image.open('floor_s.png'); a=np.array(fl); al=a[...,3]; m=al>128
v=a[...,:3].max(2).astype(np.float32); seam=(v<40)&m
fd,_,_=retarget(fl,0.24,0.51,s_follow=0.35,skip_dark=0.2)
b=np.array(fd).astype(np.float32); sm_=cv2.GaussianBlur(seam.astype(np.float32),(0,0),1.2)[...,None]
b[...,:3]=b[...,:3]*(1-sm_)+np.array([16,10,28],np.float32)*sm_
Image.fromarray(np.clip(b,0,255).astype(np.uint8),'RGBA').save('floor_daily.png')
# WALL: simplify from regraded wall, retarget to bricks #30244D (v .30 s .53), then shade toward the console
w=S.stone_simplify(Image.open('wall_g.png')); wd,vm,sm=retarget(w,0.37,0.53,s_follow=0.5)
a=np.array(wd).astype(np.float32); H=a.shape[0]; y=np.arange(H)/H
grad=1.0-0.30*np.clip((y-0.30)/0.70,0,1)**1.2
a[...,:3]*=grad[:,None,None]
Image.fromarray(np.clip(a,0,255).astype(np.uint8),'RGBA').save('wall_daily.png')
# CASING: light (pillar #4F3983 .51 / top slab #6D51AD .68) -> median ~.56
fr,vm,sm=retarget(Image.open('frame_s.png'),0.56,0.53,s_follow=0.6,v_cap=0.95); fr.save('frame_daily.png')
# SLABS (buttons): dark, panel ~#2B1B51 (v .32 s .68)
for n in ('slab_hunt','slab_book'):
    sl,vm,sm=retarget(Image.open(n+'_s.png'),0.27,0.66,s_follow=0.6); sl.save(n+'_daily.png')
# report medians as hex
for n in ('floor_daily','wall_daily','frame_daily','slab_hunt_daily'):
    a=np.array(Image.open(n+'.png')); m=(a[...,3]>200)&(a[...,:3].max(2)>40)
    print(n,hx(np.median(a[...,:3][m],0)))
