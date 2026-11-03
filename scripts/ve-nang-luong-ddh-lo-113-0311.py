"""Giữ mức năng lượng và hai đường liền/đứt theo từng mốc ảnh nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-graph-chi-tiet-lo-109.json').read_text())if r['i']==766);b='<g transform="translate(30 30) scale(1.5)"><path d="M47 39V330H413" fill="none" stroke="#252440" stroke-width="1.1"/><path d="M47 31L44 41H50ZM421 330L411 327V333Z" fill="#252440"/>'
for v,y in r['axes']['yTicks']:b+=f'<path d="M42 {y}H52" stroke="#252440" stroke-width="1"/>'+F.label(34,y+5,str(v),17,'end')
for c in r['curves']:
 pts=c['samples'];xs=[p[0]for p in pts];f=PchipInterpolator(xs,[p[1]for p in pts]);d=' '.join(('M'if x==xs[0]else'L')+f'{x} {float(f(x)):.3f}'for x in range(xs[0],xs[-1]+1));dash=' stroke-dasharray="5 5"'if c['style'].startswith('dashed')else'';b+=f'<path d="{d}" fill="none" stroke="#686772" stroke-width="1.8"{dash}/>'
 (x,y),(xx,yy)=c['leader'];b+=f'<path d="M{x} {y}L{xx} {yy}" stroke="#686772" stroke-width="1.4"/>'
 x,y=c['captionAnchor'];b+=F.label(x,y,c['label'],17);ll=c['peakValueLabel'];x,y=ll['at'];y-=10 if ll['text']=='(85)'else 0;b+=F.label(x,y,ll['text'],17)
for ll in r['otherLabels']:
 x,y=ll['at'];y-=10 if ll['text']=='(85)'else 0;b+=F.label(x,y,ll['text'],17)
b+=F.label(111,14,'Năng lượng (kJ/mol)',18)+F.label(525,331,'Tiến trình phản ứng',18)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="600" viewBox="0 0 1000 600"><title>Đồ thị năng lượng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nang-luong-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Giữ10→60/peak110liền85đứt/4tickY/2leader/đủnhãnngoặcvuông và(110)(85),khôngtựsửasốhaythêmguide.')
(M/'cau-truc-nang-luong-ddh-lo-113-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
