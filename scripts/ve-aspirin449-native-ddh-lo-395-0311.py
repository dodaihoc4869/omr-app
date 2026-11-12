"""Nguồn449: giữ CH₃COO theo bản gốc, hai vòng đọc riêng và hai chú thích nghiêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-aspirin449-lo-395.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,fill='none',stroke='#303030',w=2):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=2):path('M'+'L'.join(f'{x} {y}'for x,y in v),w=w)
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#202020')
def first(x,y,t,z=26):lab(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def last(x,y,t,z=26):lab(x+F.advance(t[-1],z)/2,y,t,z,anchor='end')
def italic(x,y,t,z=30):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='middle',fill='#202020')+'</g>'
for key in ['salicylic','aspirin']:
 a=g[key];pts=a['ringVerticesClockwiseApprox'];line(pts+[pts[0]])
 for v in a['innerDoubleRays']:line(v,1.8)
 for v in a['substituentBonds'].values():line(v)
first(305,29,'COOH',24);last(221,75,'HO',26)
first(746,31,'COOH',24);last(662,77,'CH₃COO',26)
lab(5,115,'(CH₃CO)₂O',26,anchor='start');lab(169,115,'+',27)
lab(868,124,'CH₃COOH',26,anchor='start');lab(834,125,'+',27)
line(g['arrow']['shaft'],1.6);v=g['arrow']['filledHeadApprox'];path('M'+'L'.join(f'{x} {y}'for x,y in v)+'Z',fill='#303030',stroke='none',w=0)
italic(292,195,'salicylic acid');italic(746,195,'aspirin')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1007" height="210" viewBox="0 0 1007 210"><title>Phản ứng theo nguồn449</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aspirin449-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=449,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22knownC12Oincludinganhydrideandaceticacid/2Ph12bareC6innerCCdouble-individualnonperiodicvertices/EXACT(CH3CO)2O-CH3COO-NOTOOCCH3-CH3COOH/2COOH-FIRSTCanchors-HOandCH3COOLASTOanchors/1FILLEDrightheadconcavebase-2plus/ALLchemicalregularUPRIGHT-SUB23/2regularITALIClowercasecaptionssalicylic acid-aspirin/0expandedCO-stereo-charge/NOaddedH-water-catalyst-temperature-yield-answer-alias451608')
(K/'cau-truc-aspirin449-native-ddh-lo-395-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
