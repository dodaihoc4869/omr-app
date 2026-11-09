"""Nguồn1358: giữ đoạn mạch và hai đầu nét đứt đúng bản in."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='f5f0d70c65f4c26f90844c4b225b7b7d27d2e481f6b98ec0c0ebb38a380e176c';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d):return '<path d="'+d+'" fill="none" stroke="#202020" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>'
v=[[(124,115),(162,140),(199,115),(237,140),(274,115),(310,140)],[(385,140),(423,115),(460,140),(498,115),(535,140),(572,115)],[(647,115),(684,140),(722,115),(759,140),(797,115),(833,140),(872,115)]]
assert [len(a)for a in v]==[6,6,7]
b=''.join(path('M'+'L'.join(f'{x} {y}'for x,y in a))for a in v)
b+=path('M109 125L124 115 M310 140L326 130 M370 130L385 140 M572 115L584 123 M631 125L647 115 M872 115L876 118')
# Chân của từng tia C=O nằm trên hai nét xiên riêng, không thêm cầu ngang.
b+=path('M307 138V176 M314 138V176 M568 78V118 M575 78V117 M830 138V176 M837 138V176')
b+=path('M44 109L47 112 M52 115L55 117 M60 120L63 122 M880 122L884 125 M889 128L893 131 M899 134L903 136 M907 139L909 140')
for x,y,t in [(86,150,'NH'),(346,123,'NH'),(607,150,'NH'),(310,202,'O'),(572,71,'O'),(833,202,'O')]:b+=F.label(x,y,t,28,fill='#202020')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="953" height="251" viewBox="0 0 953 251"><title>Đoạn mạch theo nguồn1358</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='doan-polyamide-ba-nh-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1358,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='19bareC3N3O/3literalNH3COdouble/first6-middle6-last7CincludingRIGHTterminal/3LEFT4RIGHTshortdashes/COsplitfeet/allthinregularDDH/noaddedH-CH2-brackets-n-name-caption-answer')
(K/'cau-truc-doan-polyamide-ba-nh-ddh-lo-310-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
