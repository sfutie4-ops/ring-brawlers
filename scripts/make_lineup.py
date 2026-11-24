# Rebuild the loading-screen fighter lineup: Zaito moves to the back row (Batas takes his front spot)
# and his cut-out edge is smoothed so the head halo and ragged shoes disappear.
import json,sys
from PIL import Image,ImageFilter,ImageDraw,ImageEnhance
import os
# sheets as of commit 8c81092 (git show 8c81092:assets/cinematics/<file>) into a folder, passed as LINEUP_SHEETS
R=os.environ.get('LINEUP_SHEETS','assets/cinematics/')
OUT=sys.argv[1]
fr=json.load(open(R+'frames.json'))
def frame(k,i):
    x,y,w,h=map(int,fr[k][i][:4]);c=Image.open(R+k+'.webp').convert('RGBA').crop((x,y,x+w,y+h));return c.crop(c.getbbox())
SHEETS={0:'loonie-priest',1:'abra-renewed',2:'shehyee-replacement',3:'batas-ink',4:'smugglaz-replacement',5:'aklas-ink',7:'apekz-replacement',8:'sinio-ink'}
spr={ci:frame(k,0) for ci,k in SHEETS.items()};spr[6]=frame('idle-expressions',12)
def clean(im):
    # tighten the alpha matte by ~1px and re-feather it: removes the light halo and jagged edge
    r,g,b,a=im.split()
    a=a.filter(ImageFilter.MinFilter(7)).filter(ImageFilter.GaussianBlur(1.1)).point(lambda v:0 if v<40 else min(255,int((v-40)*255/170)))
    # drop thin stray strands above the head (rows with only a few opaque pixels)
    import numpy as np
    A=np.array(a);rows=(A>60).sum(1);top=next(i for i,n in enumerate(rows) if n>=A.shape[1]*.06);A[:top]=0;a=Image.fromarray(A)
    return Image.merge('RGBA',(r,g,b,a))
spr[6]=clean(spr[6])
LW,LH=1500,720;lu=Image.new('RGBA',(LW,LH),(0,0,0,0))
order=[(5,220,560,.62),(6,1345,566,.64),(1,390,600,.72),(8,1110,600,.72),(2,560,640,.84),(7,940,640,.84),(4,330,700,.92),(3,1150,700,.92),(0,750,712,1.0)]
def rim(im,col,alpha):
    sil=Image.new('RGBA',im.size,col+(0,));sil.putalpha(im.split()[3].point(lambda v:int(v*alpha)));return sil
for ci,cx,by,sc in order:
    s=spr[ci];th=int(560*sc);tw=int(s.width*th/s.height);s=s.resize((tw,th),Image.LANCZOS)
    if cx>LW/2 and ci!=0: s=s.transpose(Image.FLIP_LEFT_RIGHT)
    pad=12;canvas=Image.new('RGBA',(tw+pad*2,th+pad*2),(0,0,0,0))
    canvas.alpha_composite(rim(s,(255,70,180),.95),(pad-5,pad-2));canvas.alpha_composite(rim(s,(60,210,255),.95),(pad+5,pad-2))
    o=rim(s,(8,6,14),1).filter(ImageFilter.MaxFilter(5));canvas.alpha_composite(o,(pad,pad));canvas.alpha_composite(rim(s,(255,70,180),.9),(pad-4,pad-1));canvas.alpha_composite(rim(s,(60,210,255),.9),(pad+4,pad-1))
    body=s.copy()
    if sc<.99:body=ImageEnhance.Brightness(body).enhance(.62+.38*sc)
    canvas.alpha_composite(body,(pad,pad))
    if ci==6:
        g=Image.linear_gradient('L').resize(canvas.size).point(lambda v:255 if v<int(255*.70) else max(0,255-int((v-255*.70)*255/(255*.16))))
        dark=Image.new('RGBA',canvas.size,(10,7,18,255));dark.putalpha(canvas.split()[3])
        canvas=Image.composite(canvas,dark,g)
    sh=Image.new('RGBA',(int(tw*1.2),40),(0,0,0,0));ImageDraw.Draw(sh).ellipse((0,0,int(tw*1.2),40),fill=(0,0,0,150));sh=sh.filter(ImageFilter.GaussianBlur(8))
    lu.alpha_composite(sh,(int(cx-tw*.6),by-24))
    lu.alpha_composite(canvas,(int(cx-tw/2-pad),by-th-pad))
lu.save(OUT+'/lineup.webp','WEBP',quality=86,method=6,alpha_quality=90)
bg=Image.open('/home/user/ring-brawlers/assets/loading/bg.webp').convert('RGBA');bg.alpha_composite(lu.resize((1300,624)),(150,276));bg.convert('RGB').save(OUT+'/preview.jpg',quality=85)
