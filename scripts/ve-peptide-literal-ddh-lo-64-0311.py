"""Peptide495: giữ COOH nhánh thu gọn và mọi H amide như nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(x for x in json.loads((M/'doc-molecule-lo-57.json').read_text())if x['i']==495)
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
def atom(x,y,label):return F.label(x-F.advance(label[0],36)/2,y,label,36,'start')
b='<path d="M95 194L150 160L240 210L312 171M348 171L420 210L510 160L582 199M618 199L690 160L780 210L852 171M888 171L960 210L1050 160L1122 199M1158 199L1230 160L1320 210L1390 173M150 160V90M960 210V280M1230 160V90L1170 55M1230 90L1290 55M420 210V285L465 325H510" fill="none" stroke="#252440" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>'
for x in[240,780,1320]:b+=line(x,210,x,275)+line(x+10,216,x+10,275)+atom(x,315,'O')
for x in[510,1050]:b+=line(x,160,x,95)+line(x+10,154,x+10,95)+atom(x,82,'O')
for x in[330,870]:b+=atom(x,173,'N')+atom(x,135,'H')
for x in[600,1140]:b+=atom(x,223,'N')+atom(x,261,'H')
b+=F.label(80,210,'H₂N',36,'end')+atom(535,338,'COOH')+atom(1410,173,'OH')
svg=('<svg xmlns="http://www.w3.org/2000/svg" width="1520" height="400" viewBox="0 0 1520 400"><title>Cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(svg).hexdigest();fn='peptide-ddh-'+hh+'.svg';(M/fn).write_bytes(svg)
r.update(svg=fn,hashSvg=hh,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap')
(M/'cau-truc-peptide-literal-ddh-lo-64-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
