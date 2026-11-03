"""Dựng phân tử và grid mới với chữ thân/caption đều thành path DDH."""
from pathlib import Path
import importlib.util,json,hashlib,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
def module(name,file):
 s=importlib.util.spec_from_file_location(name,G/'scripts'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
D=module('dung','dung-cau-truc-vector-0311.py');C=module('chu','doi-chu-svg-ddh-0311.py')
rows=D.build(json.loads((M/'cau-truc-molecule-ddh-lo-61.json').read_text()))
for r in rows:
 if r.get('trangThai')!='cho-soat-doc-lap':continue
 root=E.fromstring((M/r['svg']).read_bytes());C.convert(root)
 assert not any(e.tag.rsplit('}',1)[-1]in['text','tspan','image']for e in root.iter())
 b=E.tostring(root,encoding='utf-8');h=hashlib.sha256(b).hexdigest();fn='cau-truc-ddh-'+h+'.svg';(M/fn).write_bytes(b)
 r.update(svg=fn,hashSvg=h,byteSvg=len(b),font='DDH Rounded',hashPhong=C.F.HASH)
(M/'cau-truc-molecule-ddh-lo-61-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng',len(rows),'nguồn; lỗi',sum(r['trangThai']!='cho-soat-doc-lap'for r in rows))
