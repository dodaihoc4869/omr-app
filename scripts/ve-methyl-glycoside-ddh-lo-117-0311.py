"""Giữ OCH3 hướng xuống và nhánh C6 mở, không sửa hình theo tên ở câu dẫn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F
r=next(r for r in json.loads((M/'doc-molecule-lo-117.json').read_text())if r['i']==1184)
branches={c:v for c,v in r['substituents'].items()if c!='C5'};b=H.body(branches)+H.line(225,180,225,95)+H.line(225,95,285,60)+F.label(300,65,'OH',30,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="500" viewBox="0 0 700 500"><title>Cấu trúc theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='methyl-glycoside-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='C1OCH3xuống/C2OHxuống/C3OHlên/C4OHxuống/C5nhánhC6lênrồiOHchéotrênphải. C6implicitnodeKHÔNGinCH2sourcekhôngcótext. KhôngHexplicit/sốC/caption/tựsửatheostemfructose.')
(M/'cau-truc-methyl-glycoside-ddh-lo-117-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
