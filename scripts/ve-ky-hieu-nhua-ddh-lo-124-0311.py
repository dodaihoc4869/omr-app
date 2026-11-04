"""Tái dùng hình đã soát theo đúng nội dung, giữ0và đường ngăn cặp nguồn."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-124.json').read_text())};assets=sorted(json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text())['assets'],key=lambda r:r['hash']);manifest=json.loads((M/'danh-muc-da-kiem.json').read_text())['theoHashNguon'];rows=[]
def base(i):return manifest[assets[i]['hash']]
def inner(r):
 s=(M/r['tep']).read_text();return s[s.index('>')+1:s.rindex('</svg>')]
for i in[67,810,933,399,755]:
 if i in[67,810,933]:
  original=base(1119 if i==933 else 1140);fn=original['tep'];hh=original['hashSvg'];raw=(M/fn).read_bytes();basis=[original]
 else:
  basis=[base(792),base(676 if i==399 else 405)];parts=[]
  for k,r in enumerate(basis):
   s=inner(r)
   if i==755:s=s.replace('#252440','#686772')
   parts.append(f'<g transform="translate({25+k*550} 25)">'+s+'</g>')
  b=''.join(parts)
  if i==399:b+='<path d="M550 20V530" fill="none" stroke="#252440" stroke-width="3"/>'
  raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="550" viewBox="0 0 1100 550"><title>Cặp ký hiệu vật liệu theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='tai-che-pair-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',svgCoSo=[v['tep']for v in basis],hashSvgCoSo=[v['hashSvg']for v in basis],ghiChuDung='67/810giữ5PP,93303PVCgiữ0.3992HDPE|3PVCcólinegiữa;7552HDPE4LDPEgrayKHÔNGline.Khôngtựcoialiasđạt,phảisoáttừngPNG/base/renderhash.'))
(M/'cau-truc-ky-hieu-nhua-ddh-lo-124-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
