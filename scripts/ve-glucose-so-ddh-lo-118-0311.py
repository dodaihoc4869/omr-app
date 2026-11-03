"""Glucose đánh số: OH1 lên, không dùng bản cóOH1 xuống."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F
r=next(r for r in json.loads((M/'doc-molecule-lo-117.json').read_text())if r['i']==1243)
br={c:dict(v)for c,v in r['substituents'].items()};br['C5']={'up':'CH₂OH','down':None};b=H.body(br)
for x,y,t in[(525,300,'1'),(370,378,'2'),(250,378,'3'),(100,250,'4'),(205,180,'5'),(225,65,'6')]:b+=F.label(x,y,t,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="490" viewBox="0 0 700 490"><title>Cấu trúc có số carbon theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-so-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='C1OHlên/C2OHxuống/C3OHlên/C4OHxuống/C5CH2OHlên,khôngHexplicit/6sốCđúngvịtrí/khôngchữCởvertex. Khôngalias1036OH1down.')
(M/'cau-truc-glucose-so-ddh-lo-118-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
