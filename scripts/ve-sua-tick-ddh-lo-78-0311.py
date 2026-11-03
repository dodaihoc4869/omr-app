"""Sửa thiếu tick X ở404/525; giữ nguyên SVG cũ và rút chứng nhận cũ khỏi bộ chọn."""
from pathlib import Path
import json,hashlib,xml.etree.ElementTree as E,importlib.util
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem'
oldfn='hoa-ddh-a3c6843ca3a9a836d62e40bfa7b313221ce72523e0e8b4def6ef2254e5680c66.svg';oldhash='a3c6843ca3a9a836d62e40bfa7b313221ce72523e0e8b4def6ef2254e5680c66'
assert hashlib.sha256((M/oldfn).read_bytes()).hexdigest()==oldhash
E.register_namespace('', 'http://www.w3.org/2000/svg');root=E.fromstring((M/oldfn).read_bytes());d=''.join(f'M{100+11*v} 366V374'for v in[10,20,30,40,50,60]);E.SubElement(root,'{http://www.w3.org/2000/svg}path',{'d':d,'stroke':'#252440','stroke-width':'2','fill':'none'})
raw=E.tostring(root,encoding='utf-8');hh=hashlib.sha256(raw).hexdigest();fn='do-thi-tick-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
assets=sorted(json.loads((P/'nguon/kiem-ke.json').read_text())['assets'],key=lambda a:a['hash']);source=assets[404]['hash'];withdraw=[]
for file in M.glob('cau-truc-*-ban-dung.json'):
 if file.name=='cau-truc-sua-tick-ddh-lo-78-ban-dung.json':continue
 rows=json.loads(file.read_text());changed=False
 for r in rows:
  if r.get('hash')==source and r.get('trangThai')=='da-soat-doc-lap'and r.get('svg')!=fn:
   withdraw.append({'tepMetadata':file.name,'hashNguon':source,'svgCu':r.get('svg'),'hashSvgCu':r.get('hashSvg'),'lyDo':'Bản đang chọn thiếu6tickX nhìn thấy ở nguồn404; tạm ngưng mọi biến thể cũ của nguồn này, không fallback khi chờ bản mới.'})
   r['trangThai']='can-soat-lai-thieu-tick';r['lyDoThuHoi']=withdraw[-1]['lyDo'];changed=True
 if changed:file.write_text(json.dumps(rows,ensure_ascii=False,indent=2))
if withdraw:(M/'thu-hoi-tick-lo-78.json').write_text(json.dumps(withdraw,ensure_ascii=False,indent=2))
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
target=M/'cau-truc-sua-tick-ddh-lo-78-ban-dung.json';previous={r['i']:r for r in json.loads(target.read_text())}if target.exists()else{};rows=[]
for i in[404,525]:
 a=assets[i];r=dict(i=i,hash=a['hash'],fileNguon=a['file'],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ticksThem=[10,20,30,40,50,60],ghiChu='Giữ nguyên dữ liệu/curve/đỉnh37/hết50/guide37/chữ; thêm6tickX nhìn thấy trong cả2nguồn. Không ghi đè SVG cũ.')
 old=previous.get(i,{})
 if old.get('hashSvgDaSoat')==hh and old.get('trangThai')=='da-soat-doc-lap':
  for k in['trangThai','hashSvgDaSoat','nguoiSoat']:r[k]=old[k]
 rows.append(r)
target.write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng biến thể có6tick; rút',len(withdraw),'bản ghi cũ, chờ soát hash mới.')
