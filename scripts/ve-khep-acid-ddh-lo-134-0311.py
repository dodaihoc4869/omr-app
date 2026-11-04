"""Khép bộ phương án: EPA nối đôi dưới; các bản dùng lại vẫn phải soát nguồn riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'cau-truc-acid-beo-ddh-lo-132-ban-dung.json').read_text());base={r['i']:r for r in a};j=json.loads((M/'doc-khep-acid-lo-134.json').read_text());rows=[]
for r in j:
 if r['i'] not in[903,258,745,496,1139,656,932,26,580]:continue
 if r['i'] in[1139,656,932,26,580]:
  bb=base[660 if r['i'] in[1139,656]else 52];fn=bb['svg'];raw=(M/fn).read_bytes();hh=hashlib.sha256(raw).hexdigest()
 else:
  n=20;doubles=[3,6,9,12,15];points=[(20,90)]
  for atom in range(2,n+1):
   x,y=points[-1];points.append((x+(48 if atom-1 in doubles else 24),y if atom-1 in doubles else 140-y))
  b=''
  for bond in range(1,n):
   x,y=points[bond-1];xx,yy=points[bond]
   if bond==n-1:xx-=4;yy=y+(yy-y)*(xx-x)/(points[bond][0]-x)
   b+=f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round"/>'
   if bond in doubles:b+=f'<path d="M{x+6} {y-7}H{xx-6}" fill="none" stroke="#252440" stroke-width="2" stroke-linecap="round"/>'
  x,y=points[-1];b+=F.label(x,y+9,'COOH',25,'start');w=x+F.advance('COOH',25)+22;raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w:.2f}" height="130" viewBox="0 0 {w:.2f} 130"><title>Acid béo với năm nối đôi theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='acid-beo-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='903/258/745/496:20C5ZdoubleNGANGDƯỚI hai nhánh lên;1139/65618C2Z;932/26/58022C3Z. Base dùng lại phải mở từngsource/render/exacthash.'))
(M/'cau-truc-khep-acid-ddh-lo-134-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
