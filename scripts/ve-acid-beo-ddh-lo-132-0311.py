"""Dựng mạch acid theo số đỉnh/liên kết đọc ở từng nguồn; không chuẩn hoá theo tên chất."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
j=json.loads((M/'doc-molecule-lo-130.json').read_text());rows=[]
for r in j:
 if r['i'] not in [785,899,1038,941,660,1182,52]:continue
 n,doubles=(14,[6]) if r['i'] in[785,899,1038,941] else (18,[6,9]) if r['i'] in[660,1182] else (22,[6,9,12])
 points=[(20,90)]
 for atom in range(2,n+1):
  x,y=points[-1];points.append((x+(48 if atom-1 in doubles else 24),y if atom-1 in doubles else 140-y))
 b=''
 for bond in range(1,n):
  x,y=points[bond-1];xx,yy=points[bond]
  if bond==n-1:xx-=4;yy=y+(yy-y)*(xx-x)/(points[bond][0]-x)
  b+=f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round"/>'
  if bond in doubles:b+=f'<path d="M{x+6} {y+7}H{xx-6}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round"/>'
 x,y=points[-1];b+=F.label(x,y+9,'COOH',25,'start');w=x+F.advance('COOH',25)+22
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.2f}" height="130" viewBox="0 0 {w:.2f} 130"><title>Acid béo theo mạch nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-beo-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',diemCarbon=points,bondDoiTuMethyl=doubles,ghiChuDung='Giữ COOH gộp, mạch14/18/22C theo source; mọi C=C ngang cao/2nhánh cùng dưới,khôngtựsửa theo tên thường.'))
(M/'cau-truc-acid-beo-ddh-lo-132-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
