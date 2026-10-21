import numpy as np, cv2
from PIL import Image
def _rim(rgb,sigma=9,gain=0.9):
    v=rgb.astype(np.float32).max(2)
    r=np.clip(v-cv2.GaussianBlur(v,(0,0),sigma),0,60)
    return r[...,None]*gain
def floor_simplify(img, grout_thr=44, med=21):
    a=np.array(img.convert('RGBA')); rgb=a[...,:3]; al=a[...,3]; m=al>128
    v=rgb.max(2)
    g=((v<grout_thr)&m).astype(np.uint8)
    g=cv2.morphologyEx(g,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3)))
    g=cv2.morphologyEx(g,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
    face=cv2.inpaint(rgb,((g>0)|(~m)).astype(np.uint8)*255,6,cv2.INPAINT_TELEA)
    sm=cv2.medianBlur(face,med); sm=cv2.bilateralFilter(sm,9,30,9)
    out=sm.astype(np.float32)+_rim(face,9,0.7)
    gm=cv2.GaussianBlur(g.astype(np.float32),(0,0),1.3)[...,None]
    dark=np.array([13,9,34],np.float32)
    out=out*(1-gm)+dark*gm
    out=np.clip(out,0,255).astype(np.uint8); out[~m]=rgb[~m]
    return Image.fromarray(np.dstack([out,al]),'RGBA')
def stone_simplify(img, med=9):
    a=np.array(img.convert('RGBA')); rgb=a[...,:3]; al=a[...,3]; m=al>128
    fill=cv2.inpaint(rgb,(~m).astype(np.uint8)*255,3,cv2.INPAINT_TELEA)
    sm=cv2.medianBlur(fill,med); sm=cv2.bilateralFilter(sm,9,28,8)
    out=sm.astype(np.float32)+_rim(fill,7,0.6)
    out=np.clip(out,0,255).astype(np.uint8); out[~m]=rgb[~m]
    return Image.fromarray(np.dstack([out,al]),'RGBA')
if __name__=='__main__':
    floor_simplify(Image.open('floor_g.png')).save('floor_s.png')
    for n in ('wall','frame','slab_hunt','slab_book'):
        stone_simplify(Image.open(n+'_g.png')).save(n+'_s.png')
    def cmp(n,scale,crop):
        a=Image.open(n+'_g.png'); b=Image.open(n+'_s.png')
        sz=(int(a.size[0]*scale),int(a.size[1]*scale)); x0,y0,x1,y1=[int(c*scale) for c in crop]
        A=a.resize(sz,Image.LANCZOS).crop((x0,y0,x1,y1)); B=b.resize(sz,Image.LANCZOS).crop((x0,y0,x1,y1))
        bg=Image.new('RGBA',(A.size[0]*2+8,A.size[1]),(20,20,30,255)); bg.alpha_composite(A,(0,0)); bg.alpha_composite(B,(A.size[0]+8,0)); return bg
    cmp('floor',0.7,(150,150,650,450)).save('cmp_floor.png')
    cmp('wall',0.498,(0,0,445,317)).save('cmp_wall.png')
    cmp('frame',0.44,(0,0,795,300)).save('cmp_frame.png')
