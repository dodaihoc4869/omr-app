"""Dựng nhóm cùng cấu trúc, giữ riêng nhãn đúng từng nguồn."""
from pathlib import Path
import json,hashlib,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';src=json.loads((M/'doc-molecule-lo-57-dot-1.json').read_text());rows=[]
E.register_namespace('', 'http://www.w3.org/2000/svg')
base={x['i']:x for name in ['cau-truc-amino-nem-ddh-lo-47-ban-dung.json','cau-truc-lysine-nem-ddh-lo-52-ban-dung.json','cau-truc-molecule-ddh-lo-44-ban-dung.json','cau-truc-peptide-h-ddh-lo-56-ban-dung.json']for x in json.loads((M/name).read_text())}
for r in src:
 i=r['i'];v=base[{28:276,1114:276,286:904,1125:1044,1274:1377}[i]];fn=v['svg'];b=(M/fn).read_bytes()
 if i in [28,1114]:
  tree=E.fromstring(b);removed=[]
  for e in list(tree):
   if e.attrib.get('aria-label')in ['(1)','(2)']:removed.append(e.attrib['aria-label']);tree.remove(e)
  assert set(removed)=={'(1)','(2)'},'Phải tách đúng hai nhãn không có trong nguồn mới'
  b=E.tostring(tree,encoding='utf-8');fn='amino-ddh-'+hashlib.sha256(b).hexdigest()+'.svg';(M/fn).write_bytes(b)
 x=dict(r,svg=fn,hashSvg=hashlib.sha256(b).hexdigest(),byteSvg=len(b),font='DDH Rounded',hashPhong=v['hashPhong'],trangThai='cho-soat-doc-lap',ghiChuDungChung='Cùng cấu trúc, giữ nguyên H/nêm/cách ghi nguồn;28/1114 không có nhãn nhóm chức nên không đưa (1)/(2) từ mẫu276 vào.')
 rows.append(x)
(M/'cau-truc-dung-chung-ddh-lo-57-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
print('Đã dựng',len(rows),'nguồn; chờ soát từng nguồn độc lập.')
