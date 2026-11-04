"""Giữ bốn đồ thị liên kết và nhãn; không hiện H/C ẩn trong nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-peptide-chi-tiet-lo-135.json').read_text()) if r['i']==1063);b='<g transform="translate(25 25) scale(4)">'
for p in r['panelGeometry']:
 for e in p['edges']:
  x,y=p['vertices'][e['from']];xx,yy=p['vertices'][e['to']];d=math.hypot(xx-x,yy-y);px,py=-(yy-y)/d,(xx-x)/d
  shifts=[0] if e['order']==1 else [0,-3] if e['order']==2 else[-3,0,3]
  for sh in shifts:b+=f'<path d="M{x+sh*px} {y+sh*py}L{xx+sh*px} {yy+sh*py}" fill="none" stroke="#252440" stroke-width="1.1" stroke-linecap="round"/>'
 b+=F.label(*p['labelAnchor'],p['caption'],13)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="2330" height="380" viewBox="0 0 2330 380"><title>Bốn cấu trúc hydrocarbon theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hydrocarbon-grid-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='4panelngang/a5C/b6C/c5C/d7C,triple3nét/2terminalalkene/0H-Ctext,giữ4nhãn.')
(M/'cau-truc-hydrocarbon-ddh-lo-136-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
