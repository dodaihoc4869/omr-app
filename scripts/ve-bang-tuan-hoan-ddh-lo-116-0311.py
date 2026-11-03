"""Sơ đồ bốn chu kỳ giữ đúng các ô, mười ô d và bốn ký hiệu nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-molecule-lo-106.json').read_text())if r['i']==1162)
def cell(x,y,xx,yy):return f'<rect x="{x}" y="{y}" width="{xx-x}" height="{yy-y}" fill="none" stroke="#252440" stroke-width="0.9"/>'
b='<g transform="translate(20 15) scale(1.4)">';p=[449,493,537,581,632,683,734]
b+=cell(9,30,53,61)+cell(683,30,734,61)
for y,yy in[(61,93),(93,124)]:
 b+=cell(9,y,53,yy)+cell(53,y,99,yy)
 for x,xx in zip(p,p[1:]):b+=cell(x,y,xx,yy)
coords=[9,53,99]+[99+k*35 for k in range(1,11)]+p[1:]
for x,xx in zip(coords,coords[1:]):b+=cell(x,124,xx,156)
for x,y,t in[(31,20,'I'),(76,52,'II'),(471,52,'III'),(515,52,'IV'),(559,52,'V'),(606.5,52,'VI'),(657.5,52,'VII'),(708.5,20,'VIII'),(31,115,'Na'),(515,84,'C'),(559,115,'P'),(708.5,84,'Ne')]:b+=F.label(x,y,t,18)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="280" viewBox="0 0 1100 280"><title>Vị trí các ô nguyên tố theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-tuan-hoan-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='4hàng,2ôrow1/8ôrow2/8ôrow3/18ôrow4với10ôdtrống. Na/C/P/Neđúngô,nhómI..VIIIđúngvịtrí,khôngthêmnhãn/hoátrị.')
(M/'cau-truc-bang-tuan-hoan-ddh-lo-116-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
