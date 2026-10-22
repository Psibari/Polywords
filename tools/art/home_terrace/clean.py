import numpy as np, cv2
from PIL import Image
from scipy import ndimage as ndi
U='/root/.claude/uploads/1c49d361-9115-52ce-9284-12e6232d8de7/'
def clean(path, erode=2, minblob=400, cut_y=None, speck=True):
    a=np.array((path if not isinstance(path,str) else Image.open(path)).convert('RGBA')).astype(np.float32)
    al=a[...,3]
    if cut_y is not None: al[cut_y:]=0
    m=(al>128)
    # keep only big components (kills stray specks)
    lab,n=ndi.label(m); sizes=ndi.sum(m,lab,range(1,n+1))
    keep=np.isin(lab,[i+1 for i,s in enumerate(sizes) if s>=minblob])
    m=keep
    m=ndi.binary_fill_holes(m) if False else m
    # morphological open to drop thin hairs, then erode to lose fringe ring
    k=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(5,5))
    m8=cv2.morphologyEx(m.astype(np.uint8),cv2.MORPH_OPEN,k)
    m8=cv2.erode(m8,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(2*erode+1,2*erode+1)))
    # smooth contour: blur mask, rethreshold, then 1px feather
    s=cv2.GaussianBlur(m8.astype(np.float32),(0,0),1.6)
    m2=(s>0.5).astype(np.uint8)
    feather=cv2.GaussianBlur(m2.astype(np.float32),(0,0),0.9)
    # defringe RGB: replace edge-band colour with interior colour (inpaint from eroded core)
    core=cv2.erode(m2,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
    rgb=a[...,:3].astype(np.uint8)
    band=(m2>0)&(core==0)
    inp=cv2.inpaint(rgb,(1-core).astype(np.uint8)*255,5,cv2.INPAINT_TELEA)
    rgb[band]=inp[band]
    out=np.dstack([rgb,(feather*255).astype(np.uint8)])
    return Image.fromarray(out,'RGBA')
if __name__=='__main__':
    w=clean(U+'a0063890-image.png',erode=2,cut_y=458)
    # crop to bbox
    bb=w.getbbox(); w=w.crop(bb); w.save('wall_clean.png'); print('wall',w.size,bb)
    bg=Image.new('RGBA',w.size,(120,200,120,255)); bg.alpha_composite(w)
    bg.crop((0,w.size[1]-130,460,w.size[1])).resize((1380,390),Image.NEAREST).save('wc_bottom.png')
    bg.crop((0,0,300,210)).resize((900,630),Image.NEAREST).save('wc_tl.png')
