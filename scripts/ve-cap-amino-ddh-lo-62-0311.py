"""Ghép hai amino acid giữ nêm và hai tên có sẵn trong nguồn212."""
from pathlib import Path
import importlib.util,json,hashlib,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
N='http://www.w3.org/2000/svg';E.register_namespace('',N)
src=next(r for r in json.loads((M/'doc-molecule-lo-57.json').read_text())if r['i']==212)
base={r['i']:r for r in json.loads((M/'cau-truc-dung-chung-ddh-lo-57-ban-dung.json').read_text())}
root=E.Element('{'+N+'}svg',{'width':'1400','height':'390','viewBox':'0 0 1400 390'})
E.SubElement(root,'{'+N+'}title').text='Hai cấu trúc theo nguồn'
for i,x,cx,name in[(286,20,350,'Lysine'),(28,740,1060,'Glutamic acid')]:
 inner=E.fromstring((M/base[i]['svg']).read_bytes());inner.attrib.update(x=str(x),y='20',width='640',height='282',preserveAspectRatio='xMidYMid meet');root.append(inner)
 root.append(E.fromstring(F.label(cx,350,name,32,fill='#087f8e')))
b=E.tostring(root,encoding='utf-8');hh=hashlib.sha256(b).hexdigest();fn='cap-amino-ddh-'+hh+'.svg';(M/fn).write_bytes(b)
r=dict(src,svg=fn,hashSvg=hh,byteSvg=len(b),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap')
(M/'cau-truc-cap-amino-ddh-lo-62-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
