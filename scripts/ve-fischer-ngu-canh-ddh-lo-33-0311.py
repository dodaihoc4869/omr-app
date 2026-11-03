"""Bốn công thức: khôi phục nhãn bị cắt bằng ngữ cảnh bộ PA công khai, không suy hóa học."""
from pathlib import Path
import json,hashlib,importlib.util,xml.etree.ElementTree as E
G=Path(__file__).resolve().parents[1];P=G/'docs/hinh-vector-0311';M=P/'kiem';E.register_namespace('','http://www.w3.org/2000/svg');sp=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(sp);sp.loader.exec_module(F);src=json.loads((M/'doc-fischer-4-ngu-canh.json').read_text());bases=json.loads((M/'cau-truc-fischer-ddh-lo-14-ban-dung.json').read_text());rows=[]
for old in src['records']:
 pattern=''.join('K'if a.get('kind')=='carbonyl'else('L'if a['left']=='HO'else'R')for a in old['rows']);base=next(a for a in bases if a.get('rows')==pattern and a.get('top')=='CH₂OH'and not a.get('carbonNumbers'));root=E.fromstring((M/base['svg']).read_bytes());root.set('height','540');root.set('viewBox','0 0 360 540');root.append(E.fromstring(F.label(180,508,old['caption'][0],30)))
 svg=E.tostring(root,encoding='utf-8');h=hashlib.sha256(svg).hexdigest();fn='fischer-ngucanh-ddh-'+h+'.svg';(M/fn).write_bytes(svg);r=dict(old);r.update(svg=fn,hashSvg=h,byteSvg=len(svg),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',bangChungNhan='doc-fischer-4-ngu-canh.json',pattern=pattern);rows.append(r)
(M/'cau-truc-fischer-ngu-canh-ddh-lo-33-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2));print('Đã dựng4côngthức/nhãn theo bằngchứng bộPA, chờsoát.')
