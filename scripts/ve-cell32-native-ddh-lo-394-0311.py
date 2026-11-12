"""Nguồn32: bình điện phân với từng nét màng và sóng nước riêng theo nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-cell32-lo-394.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#303030',w=1):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1,color='#303030'):path('M'+'L'.join(f'{x} {y}'for x,y in v),stroke=color,w=w)
def lab(x,y,t,z=22):
 global b
 b+=F.label(x,y,t,z,anchor='middle',fill='#202020')
for e in g['electrodes']:
 x,y,r,bot=e['bboxApprox'];b+=f'<path d="M{x} {y}H{r}V{bot}H{x}Z" fill="#808080"/>'
for key in ['outerLeftBottomRight','topLeftOpeningLip','topLeftInnerLip','topRightOuterLip']:line(g['vessel'][key],.9)
for key in ['wireLeft','wireRight']:line(g['battery'][key],1)
for key in ['leftLongBar','rightShortBar']:line(g['battery'][key],1)
for name in ['plus','minus']:
 o=g['polarity'][name];x,y=o['center'];r=o['radius'];b+=f'<circle cx="{x}" cy="{y}" r="{r}" fill="none" stroke="#303030" stroke-width=".9"/>';line(o['horizontal'],.9)
 if name=='plus':line(o['vertical'],.9)
# Mỗi gạch màng giữ hàng và chiều dài riêng; sóng đi qua phía trên chúng.
for a in g['membrane']['strokes']:line([a['from'],a['to']],.9,'#606060')
pts=g['waterSurface']['orderedExtremaApprox'];d='M'+f'{pts[0][0]} {pts[0][1]}'
for a,z in zip(pts,pts[1:]):
 dx=(z[0]-a[0])*.5;d+=f' C{a[0]+dx} {a[1]} {z[0]-dx} {z[1]} {z[0]} {z[1]}'
path(d,w=.9)
l=g['leader'];line([l['shaftFrom'],l['headTip']],.9);tip=l['headTip'];a,z=l['headBaseApprox'];path(f'M{tip[0]} {tip[1]}L{a[0]} {a[1]}L{z[0]} {z[1]}Z',fill='#303030',stroke='none',w=0)
lab(199,52,'4.5V',22);lab(208,74,'5A',22);lab(251,358,'Màng ngăn xốp',24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="393" height="389" viewBox="0 0 393 389"><title>Bình điện phân theo nguồn32</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cell32-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=32,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='57INDIVIDUALhorizontalhatchNOTticks-nonperiodic90.5..323.5/2GRAYelectrodes/2batterybarsLONGLEFT-shortRIGHT/2DRAWNpolaritycirclesPLUSLEFT-MINUSRIGHT/7interiorcrests7interiortroughs+LEFTboundarycrestRIGHTpartialtrough/BLACKwaveOVERhatch-electrodes/1FILLEDupleftleaderFREEtip217313/EXACT4.5V-DOT-5A-Màng ngăn xốp/ALLregularUPRIGHT/2OPENtopmouths/NOaddedbubbles-anodecathode-ions-colors-quantities-answer-alias')
(K/'cau-truc-cell32-native-ddh-lo-394-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
