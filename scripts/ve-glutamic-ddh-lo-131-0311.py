"""Giữ nguyên công thức lên men và cụm sản phẩm phụ, không thêm điều kiện."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-130.json').read_text()) if r['i']==567)
a='C₆H₁₂O₆';z='HOOC – CH(NH₂) – CH₂ – CH₂ – COOH + sản phẩm phụ';size=26
x=20;end=x+F.advance(a,size);right=end+65;w=right+F.advance(z,size)+22
b=F.label(x,53,a,size,'start')+f'<path d="M{end+13} 43H{right-14}" fill="none" stroke="#252440" stroke-width="1.8"/><path d="M{right-14} 43L{right-24} 39L{right-21} 43L{right-24} 47Z" fill="#252440"/>'+F.label(right,53,z,size,'start')
raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.2f}" height="85" viewBox="0 0 {w:.2f} 85"><title>Phương trình lên men glucose</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glutamic-literal-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Giữ C6H12O6→HOOC–CH(NH2)–CH2–CH2–COOH+sảnphẩmphụ, khôngthêm điềukiện/hệsố haychất khác.')
(M/'cau-truc-glutamic-ddh-lo-131-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
