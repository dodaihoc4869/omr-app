"""Dựng lại cấu trúc đã kiểm nội dung bằng font app; mọi bản mới chờ kiểm hash/bố cục."""
from pathlib import Path
import importlib.util,json,hashlib,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311/kiem'
def module(name,file):
 s=importlib.util.spec_from_file_location(name,G/'scripts'/file);m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m
D=module('dung','dung-cau-truc-vector-0311.py');C=module('chu','doi-chu-svg-ddh-0311.py');mapping=json.loads((P/'danh-muc-da-kiem.json').read_text())['theoHashNguon'];source={}
for n in [5,7]:
 for a in json.loads((P/f'cau-truc-lo-{n}.json').read_text()):
  if a.get('kind')!='grid'or a['hash']not in mapping or mapping[a['hash']].get('font')=='DDH Rounded':continue
  source[a['hash']]=dict(a,phongApp=True)
rows=D.build(list(source.values()))
for r in rows:
 if r.get('trangThai')!='cho-soat-doc-lap':continue
 try:
  root=E.fromstring((P/r['svg']).read_bytes());C.convert(root);b=E.tostring(root,encoding='utf-8');h=hashlib.sha256(b).hexdigest();fn='cau-truc-ddh-'+h+'.svg';(P/fn).write_bytes(b);r.update(svg=fn,hashSvg=h,byteSvg=len(b),font='DDH Rounded',hashPhong=C.F.HASH)
 except Exception as e:r.update(trangThai='can-soat-phong',loiPhong=str(e))
previous=json.loads((P/'cau-truc-grid-ddh-lo-17-ban-dung.json').read_text())if(P/'cau-truc-grid-ddh-lo-17-ban-dung.json').exists()else[]
old={a['hash']:a for a in previous}
for a in rows:
 prior=old.get(a['hash'],{})
 if prior.get('trangThai')=='da-soat-doc-lap'and prior.get('hashSvgDaSoat')==a.get('hashSvg'):
  for k in ['trangThai','hashSvgDaSoat','nguoiSoat']:a[k]=prior[k]
fresh={a['hash']for a in rows};rows +=[a for a in previous if a['hash']not in fresh]
(P/'cau-truc-grid-ddh-lo-17-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Dựng',len(rows),'nguồn, chờsoát',sum(r['trangThai']=='cho-soat-doc-lap'for r in rows))
