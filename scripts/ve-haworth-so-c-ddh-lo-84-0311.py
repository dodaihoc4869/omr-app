"""Nguồn1036: không tự thêm H hoặc sửa anomer theo lời câu dẫn; giữ sáu sốC."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F
r=next(x for x in json.loads((M/'doc-dung-moi-lo-79.json').read_text())if x['i']==1036)
branches={c:{d:v for d,v in info.items()if d in['up','down']}for c,info in r['substituents'].items()if c in H.COORDS};b=H.body(branches)
for x,y,value in[(535,250,'1'),(368,378,'2'),(250,378,'3'),(100,250,'4'),(205,185,'5'),(225,65,'6')]:b+=F.label(x,y,value,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="490" viewBox="0 0 700 490"><title>Cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='haworth-so-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap')
(M/'cau-truc-haworth-so-c-ddh-lo-84-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
