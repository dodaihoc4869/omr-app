"""Năm mạch acid béo: giữ từng đỉnh, COOH cô đọng và hàng5 khác độ dài."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-five375-lo-375.json').read_text());h=p['hash'];b=''
def path(v):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" stroke="#252525" stroke-width="1.6" fill="none"/>'
anchors=[(972,42),(699,97),(962,134),(1045,214),(745,263)]
for j,row in enumerate(p['geometry']['rows']):
 b+=path(row['orderedBareC']+[row['COOH']['bond'][1]])
 for v in row['innerDoubleRays']:b+=path(v)
 x,y=anchors[j];z=26;b+=F.label(x-F.advance('C',z)/2,y,'COOH',z,anchor='start',fill='#252525')
 b+=F.label(22,[48,102,163,220,269][j],row['rowLabel']['text'],30,fill='#252525')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1115" height="280" viewBox="0 0 1115 280"><title>Năm mạch acid béo theo nguồn1257</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='five375-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=1257,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5OPENchains19-13-17-19-18bareC+COOHfirstC=20-14-18-20-19C/91C10O/CCdouble5-1-2-3-1/5literalcondensedCOOH-FIRSTCanchors/ALLregularUPRIGHT5numsNOTdam/row3COOHUP-othersDOWN/row5nonperiodic18bareC-startLEFTUP-keeps231vs232Ydrift/0expandedCOdouble-arrows-stereo/no18Cnormalize-H-names-omega6answer-noalias321')
(K/'cau-truc-five375-native-ddh-lo-375-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
