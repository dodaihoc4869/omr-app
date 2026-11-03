"""Phương trình và glyph alpha từ cmap thật của DDH, chỉ số dựng riêng bằng path."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-95.json').read_text())};rows=[]
for i in[390,231]:
 if i==231:w,h=240,200;b=F.label(120,155,'α',170)
 else:
  w,h=1900,260;b=F.label(35,180,'N₂(g) + 3H₂(g)',48,'start')+F.label(645,100,'380 – 450 °C, 25 – 200 bar, Fe',31)+F.label(980,180,'2NH₃(g)',48,'start')
  b+='<path d="M410 151H910L895 139M910 169H410L425 181" stroke="#252440" stroke-width="3" fill="none"/>'
  b+=F.label(1280,180,'Δ',44,'start')+F.label(1315,195,'r',27,'start')+F.label(1333,180,'H',44,'start')+F.label(1370,153,'°',27,'start')+F.label(1370,195,'298',27,'start')+F.label(1430,180,'= −92 kJ',44,'start')
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Nội dung theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ammonia-alpha-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='αvàΔcótrongcmapmergedappthật;khôngdùngcmapmảnhvietnameseđểkếtluậnthiếu. r/298dựngpathsize nhỏởsubscript,°superscript;−92kJgiữnguyên.'))
(M/'cau-truc-ammonia-alpha-ddh-lo-100-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
