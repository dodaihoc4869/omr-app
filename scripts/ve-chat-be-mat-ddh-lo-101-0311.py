"""Sáu sơ đồ phân tử chất bề mặt: giữ loại đầu và hình đuôi từng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-101.json').read_text())};rows=[]
for i in[448,165,1083,931,920,214]:
 if i==214:
  w,h=1040,300;b='<path d="M40 90H665" stroke="#252440" stroke-width="3"/><circle cx="735" cy="90" r="70" fill="none" stroke="#252440" stroke-width="3"/>'+F.label(290,245,'Đuôi kỵ nước',42)+F.label(790,245,'Đầu ưa nước',42)
 else:
  w,h=430,180;gray=i in[931,920];n=8 if gray else 9;step=30 if gray else 26;x=40;d=f'M{x} 80Q{x+step/2:g} {50 if gray else 110} {x+step} 80';x+=step
  for k in range(1,n):x+=step;d+=f'T{x} 80'
  rad=50 if gray else 36;col='#686772'if gray else'#252440';b=f'<path d="{d}" fill="none" stroke="{col}" stroke-width="4" stroke-linecap="round"/><circle cx="{x+rad}" cy="80" r="{rad}" fill="'+('#d0d0d0'if gray else'#252440')+'" stroke="'+col+'" stroke-width="2"/>'
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Sơ đồ theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chat-be-mat-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Khôngsuycarbon/ion/têngroup. Đầuđenđặc hoặcxámnhạtviềntheotừngnguồn;214đuôithẳngdừngméptráivòngRỖNG,2nhãnnguyênvăn.'))
(M/'cau-truc-chat-be-mat-ddh-lo-101-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
