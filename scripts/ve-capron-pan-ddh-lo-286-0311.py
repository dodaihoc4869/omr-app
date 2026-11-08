"""Nguồn1043: hai đoạn lặp có chú thích, giữ công thức thu gọn và ngoặc nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='bbdd63af031f6ca0565958120d330d3742bdeedf64450701c932afb71cd8e26d';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2.3):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="butt"/>'
b=path('M47 84H87 M142 84H156 M253 84H265 M321 79H345 M479 85H521 M581 83H608 M664 85H706 M623 96V121')
b+=path('M81 61Q68 82 81 103 M325 57Q339 79 325 102 M510 65Q487 106 510 149 M676 63Q699 105 676 147',2.1)
for x,y,t,z,a in [(90,96,'HN',28,'start'),(164,96,'(CH₂)₅',28,'start'),(270,96,'CO',28,'start'),(348,102,'n',18,'middle'),(526,92,'CH₂',28,'start'),(615,92,'CH',28,'start'),(615,152,'CN',28,'start'),(692,155,'n',18,'middle'),(182,203,'capron',28,'middle'),(613,202,'polyacrylonitrile',28,'middle')]:b+=F.label(x,y,t,z,a)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="768" height="245" viewBox="0 0 768 245"><title>Hai công thức cấu tạo polymer theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='capron-pan-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1043,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2separatepolymers/HN-(CH2)5-COleft/CH2-CHwithCNDOWNright/2outerroundpairs+1innerroundpair/sub2-sub5-2nsub/4crossbracketfreeends/lowercasecapron-polyacrylonitrile/regularDDH/Canchors/noexpandedCOdouble-addedH-answer.')
(K/'cau-truc-capron-pan-ddh-lo-286-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
