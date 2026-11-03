"""Bộ268/1351/668/772 giữ từng H/OH và phục hồi nhãn bằng glyph+ngữ cảnh nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F;rows=[]
for r in json.loads((M/'doc-bo-haworth-4-lo-84.json').read_text()):
 b=H.body(r['substituents'])+F.label(35,470,r['caption'][0],36,'start',weight='dam')
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 700 500"><title>Cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='haworth-nhan-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap'))
(M/'cau-truc-haworth-nhan-ddh-lo-86-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
