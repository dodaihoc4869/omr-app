"""Sơ đồ lưu hóa nguồn723: từng đường mạch cong riêng, không suy đỉnh carbon."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-poly723-lo-385.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(d,w=1.8):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#202020" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
def line(v,w=1):path('M'+'L'.join(f'{x} {y}'for x,y in v),w)
for d in g['manualPaths']:path(d)
for r in g['SSbridges']:
 for v in r['shortBonds']:line(v)
 for x,y in r['centers']:
  b+=f'<g transform="rotate(-20 {x} {y})">'+F.label(x,y+4.5,'S',13,fill='#202020')+'</g>'
line(g['arrow']['shaft'])
for v in g['arrow']['openVLegs']:line(v)
b+=F.label(339.5,88,'nS',13,fill='#202020')
b+=F.label(336,106,'t',12,fill='#202020')+F.label(343,101,'o',8,fill='#202020')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="698" height="174" viewBox="0 0 698 174"><title>Sơ đồ lưu hóa theo nguồn723</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='poly723-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=723,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4LEFT4RIGHTindividualorganiccurves-UNKNOWNpolymerC-NOatomvertices/5SS10S15shortshafts/ALLregular-SrotateMINUS20/1OPENVrighthead/literalnS-NOplus-tSUPo/tinyRIGHTrow3LEFThookUNKNOWNretain/0H-caption-ring-repeatbracket/NOaddedname-answer-alias/502partner384passed-thisONLYnewfull')
(K/'cau-truc-poly723-native-ddh-lo-385-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
