"""Nguồn1013: ba mũi tên tái chế riêng và chữ PET bằng phông đậm thật."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b6020478d310e28d5745ed1cf5e3db55ebd6b3cec2754a2f505c9d2f158f4f20';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for d in ['M85 108L110 66C125 39 148 38 165 61L183 91L193 86L187 112L161 106L172 100L155 73C146 58 135 60 126 74L101 116Z','M186 128L202 120L224 159C241 187 229 213 202 214H164V225L143 206L164 187V196H195C212 196 216 186 208 172Z','M83 124L91 150L80 145L68 166C57 184 65 196 82 196H131V214H82C50 214 39 195 53 166L66 143L58 136Z']:
 b+=f'<path d="{d}" fill="#000000"/>'
b+=F.label(137,179,'1',93,weight='dam',fill='#000000')
b+=F.label(139,282,'PET',55,weight='dam',fill='#000000')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="273" height="323" viewBox="0 0 273 323"><title>Ký hiệu PET theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ky-hieu-pet-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1013,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3separatefilledcurvedCLOCKWISEarrows/3integralheads/center1actualdam/PETbelowactualdam/flatblack/noaddedcircle-triangle-charge-caption-answer.')
(K/'cau-truc-ky-hieu-pet-ddh-lo-285-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
