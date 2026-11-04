"""Gán ứng viên dùng lại cho nguồn riêng; chỉ được chọn sau proof độc lập đúng hash."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-149.json').read_text())if r['i']==1304);fn='polymer-xa-phong-ddh-a5f677f01625c969c2441e21fb22f34372489b5b39d53a5d5fbdc825883e2237.svg';raw=(M/fn).read_bytes();hh=hashlib.sha256(raw).hexdigest();r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',baseNguon=346,ghiChuDung='Nguồn1304đãmởriêng/candidate346:3row15-31COOCH2/CH/CH2nốidọc,+3NaOH,t0,3salt+glycerol3rowOH/2plussign;phảimởsource/base/renderđộc lậpexacthash,khôngduyệtfingerprint.')
(M/'cau-truc-xa-phong-alias-ddh-lo-152-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
