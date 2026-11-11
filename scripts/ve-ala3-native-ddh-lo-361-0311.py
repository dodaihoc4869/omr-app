"""Mạch cuộn hở nguồn3: dựng đúng nét nguồn, không đóng vòng hoặc suy từ tên."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='009da405cc26bd7f43abcb0760ec825bce001dd3f2c8c780d615b83b73bed7c1';b=''
vertices=[(35,30),(35,58),(10,73),(10,101),(35,116),(35,145),(60,159),(85,145),(111,159),(137,145),(137,116),(162,101),(162,73),(137,58),(137,29),(111,14),(85,29),(85,58)]
def line(v,w):return f'<path d="M{v[0]} {v[1]}L{w[0]} {w[1]}" stroke="#606060" stroke-width="1.8" fill="none"/>'
for v,w in zip(vertices,vertices[1:]):b+=line(v,w)
for v,w in [((111,21),(131,33)),((156,75),(156,99)),((111,152),(131,140)),((21,18),(38,27)),((18,22),(35,32)),((35,30),(50,20))]:b+=line(v,w)
b+=F.label(10,20,'O',14,weight='dam',fill='#606060')+F.label(60-F.advance('O',14,'dam')/2,20,'OH',14,anchor='start',weight='dam',fill='#606060')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="168" height="165" viewBox="0 0 168 165"><title>Mạch cuộn hở theo nguồn3</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ala3-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=3,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='18bareCOPENcoiledchain/3CCdouble1COdouble2raysCONTACTupperOHslope-lowerverticalstem/2O-OHfirstOanchor/TRUEdamUPRIGHTchem/grayuniformthin/0ring0arrows0stereo/noaddedH-formula-caption-answer')
(K/'cau-truc-ala3-native-ddh-lo-361-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
