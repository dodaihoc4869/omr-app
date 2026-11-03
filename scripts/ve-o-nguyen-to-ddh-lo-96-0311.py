"""Ô nguyên tố: giữ chữ, dấu thập phân và cấu hình nguyên văn, chữ DDH thật."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-95.json').read_text())};rows=[]
for i in[807,764,468,658]:
 b='';txt=a[i]['text']
 if i in[764,468]:
  b='<rect x="10" y="10" width="480" height="500" rx="55" fill="#365b74"/><rect x="25" y="25" width="450" height="470" rx="40" fill="none" stroke="#fff" stroke-width="4"/>'
  for x,y,t,z,anchor in[(50,95,txt[0],48,'start'),(450,95,txt[1],42,'end'),(250,270,txt[2],180,'middle'),(250,350,txt[3],48,'middle'),(250,420,txt[4],38,'middle'),(250,480,txt[5],38,'middle')]:b+=F.label(x,y,t,z,anchor,fill='#fff',weight='dam')
 elif i==807:
  b='<rect x="10" y="10" width="480" height="500" rx="42" fill="#d5dadb"/><path d="M52 10H175V180H10V52Q10 10 52 10Z" fill="#a5aeb0"/>'
  b+=F.label(90,130,'7',90,weight='dam')+F.label(455,125,'14,007',66,'end',weight='dam')+F.label(250,365,'N',190,weight='dam')+F.label(250,465,'Nitrogen',64)
 else:
  b='<rect x="15" y="15" width="470" height="490" fill="#fff" stroke="#7a7a7a" stroke-width="12"/><rect x="22" y="22" width="210" height="160" fill="#dedede"/>'
  b+=F.label(120,150,'79',115,weight='dam')+F.label(465,115,'196,97',56,'end')+F.label(250,340,'Au',160,fill='#858585',weight='dam')+F.label(250,425,'Gold',80,fill='#858585')
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="500" height="520" viewBox="0 0 500 520"><title>Ô nguyên tố theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='o-nguyen-to-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='Giữ14,007/196,97dấuphẩy,30.974/22.990dấuchấm,cấuhình[Ne]3s²3p³/[Ne]3s¹;chữđậmWOFF2thật,khôngfauxbold.'))
(M/'cau-truc-o-nguyen-to-ddh-lo-96-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
