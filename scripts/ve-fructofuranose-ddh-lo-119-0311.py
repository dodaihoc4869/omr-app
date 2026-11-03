"""Vòng năm cạnh: giữ từng nhánh, carbonẩn và chỉ số nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('haworth',G/'scripts/haworth-ddh-0311.py');H=importlib.util.module_from_spec(s);s.loader.exec_module(H);F=H.F
sources={r['i']:r for r in json.loads((M/'doc-molecule-lo-117.json').read_text())};rows=[]
for i in[935,113,799]:
 b=H.line(150,240,310,187)+H.line(350,187,510,240)+F.label(330,190,'O',32)+H.wedge((150,240),(220,320),2,10)+H.line(220,320,440,320,10)+H.wedge((440,320),(510,240),10,2)
 b+=H.line(510,240,510,155)+F.label(510-F.advance('O',32)/2,135,'OH',32,'start')+H.line(440,320,440,230)+F.label(440-F.advance('O',32)/2,210,'OH',32,'start')+H.line(220,320,220,405)+F.label(220-F.advance('O',32)/2,440,'OH',32,'start')
 if i in[935,113]:
  b+=H.line(150,240,150,130)+H.line(150,130,200,100)+F.label(220,105,'OH',32,'start')+H.line(510,240,510,350)+H.line(510,350,560,380)+F.label(580,395,'OH',32,'start')
  for x,y,t in[(125,125,'6'),(120,245,'5'),(190,355,'4'),(440,355,'3'),(540,245,'2'),(500,385,'1')]:b+=F.label(x,y,t,24)
 else:
  b+=H.line(150,240,150,165)+F.label(150-F.advance('C',32)/2,145,'CH₂OH',32,'start')+H.line(510,240,510,350)+F.label(510-F.advance('C',32)/2,385,'CH₂OH',32,'start')
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="740" height="500" viewBox="0 0 740 500"><title>Cấu trúc vòng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fructofuranose-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(sources[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='5ringOtop/C2right/C3lowerright/C4lowerleft/C5left;OH2up/3up/4down;935/113C1vàC6implicitvertexkha triển+đủsố1..6,799giữ2CH2OHtextKHÔNGsố.0Hexplicit/caption/charge.'))
(M/'cau-truc-fructofuranose-ddh-lo-119-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
