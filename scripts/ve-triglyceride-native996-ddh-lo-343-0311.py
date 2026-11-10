"""Triglyceride996: đếm đỉnh theo native, không suy từ tên acid."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-triglyceride996-lo-343.json').read_text());g=p['geometry'];h=p['hash']
def line(pts):return '<path d="M'+'L'.join(f'{x} {y}' for x,y in pts)+'" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
b=line([(55,130),(55,213)])
for c in g['chains']:
 b+=line(c['vertices'])
 for d in c['doubleCC']:b+=line(d['innerParallel'])
for o in g['esterSingleO']:
 for bond in o['bonds']:b+=line(bond)
 x0,y0,x1,y1=o['bbox'];b+=F.label((x0+x1)/2,y1,'O',27,weight='de')
for o in g['carbonyls']:
 for bond in o['rays']:b+=line(bond)
 x0,y0,x1,y1=o['bbox'];baseline=y1-2 if y0==49 else y1;b+=F.label((x0+x1)/2,baseline,'O',27,weight='de')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="767" height="323" viewBox="0 0 767 323"><title>Triglyceride theo nguồn996</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triglyceride-native996-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=996,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='57C6O/3acyl18C+3glycerolC/1-1-2CCdouble/3COsplitfeet/bottomrightfootonslope/6regularuprightO/ALLthin/noH-CH2-caption-answer-noalias490801939')
(K/'cau-truc-triglyceride-native996-ddh-lo-343-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
