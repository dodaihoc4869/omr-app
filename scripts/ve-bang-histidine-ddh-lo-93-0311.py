"""Giữ vị trí NH trong vòng, trạng thái proton và bảng pH theo nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-87.json').read_text())}
def line(x,y,xx,yy,w=2.6):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def lab(x,y,t,size=32):return F.label(x,y,t,size)
b=''.join(line(x,10,x,490,2)for x in[10,230,750,1270,1790])+''.join(line(10,y,1790,y,2)for y in[10,80,490])+lab(120,55,'pH',36)+lab(120,280,'Dạng tồn tại',29)
for k,(ph,roman) in enumerate([('4,0','I'),('7,6','II'),('12,0','III')]):
 q=lab(100,110,'H')+lab(100,150,'N')+lab(60,255,'HN'if k==0 else'N')+lab(305,265,'NH₃'if k<2 else'NH₂')+lab(380,65,'O')+lab(455,169,'O')+lab(479,146,'−',23)
 if k==0:q+=lab(60,288,'+',23)
 if k<2:q+=lab(267,236,'+',23)
 for z in[(120,157,155,175),(155,175,140,245),(147,179,133,237),(140,245,82,250),(48,232,35,190),(55,228,43,193),(35,190,82,157),(155,175,230,130),(230,130,305,175),(305,175,380,130),(380,130,433,157),(374,130,374,80),(386,130,386,80),(305,175,305,230)]:q+=line(*z)
 q+=lab(260,350,'Dạng ('+roman+')',34)
 b+=lab(490+k*520,55,ph,36)+f'<g transform="translate({230+k*520} 90)">'+q+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1800" height="500" viewBox="0 0 1800 500"><title>Các dạng histidine theo pH trong nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='histidine-table-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
rows=[dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='GiữtopNHcả3vòng;bottomleftHN+chỉI,NởII/III. I/IIalphaNH3+,IIIalphaNH2;COO−cả3. Khônghoánvịtautomer/H,khôngcircle,khôngstereo. HeaderpH4,0/7,6/12,0 vàcaptionDạng(I)/(II)/(III),khungđầyđủ.')for i in[222,1135,566]]
(M/'cau-truc-bang-histidine-ddh-lo-93-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
