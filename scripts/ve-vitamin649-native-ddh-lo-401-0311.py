"""Nguồn649: vitamin E acetate, giữ các đỉnh riêng và nhánh thứ ba ngắn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-vitamin649-lo-401.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,w=1.4):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def line(v,w=1.4):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
v=g['aromaticRing']['orderedVertices'];line(v+[v[0]])
for key in ['innerRays','methylBranches']:
 for v in g['aromaticRing'][key]:line(v)
for v in g['heteroRing']['bonds']:line(v)
line(g['heteroRing']['qMethylBranch'])
line(g['sideChain']['orderedVerticesIncludingInitialRingC'])
for v in g['sideChain']['methylBranches']:line(v)
line(g['acetate']['rootLeft']);line(g['acetate']['rootRight'])
for v in g['acetate']['rootRays']:line(v)
for x,y in [(76,50),(43,107),(208,126)]:b+=F.label(x,y,'O',16.5,anchor='middle',fill='#202020')
b+=F.label(340,187,'Vitamin E acetate',22,anchor='middle',fill='#202020',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="817" height="202" viewBox="0 0 817 202"><title>Công thức theo nguồn649</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='vitamin649-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=649,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='31C3O=9ringC+3aromaticMethyl+1qMethyl+13sidePathC+3sideMethyl+2acetyl/2fusedsixRings1ringO1Ph3innerCCdouble/1CO2splitraysCONTACTrespectivearms/3OregularUPRIGHT/EXACTVitamin E acetateTRUEdamUPRIGHT/individualnonperiodicvertices-3rdsideMethylSHORTER/RIGHTblankto817KEEP/0H-stereo-arrow-charge/NOaddedformula-name-answer-alias')
(K/'cau-truc-vitamin649-native-ddh-lo-401-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
