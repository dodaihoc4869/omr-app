"""Đồ thị pH từ từng nguồn: giữ ba nhãn số, không đặt tên enzyme."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-graph-chi-tiet-lo-109.json').read_text())};rows=[]
for i in[1110,1202]:
 r=a[i];axes=r['axes'];ox,oy=axes['origin'];xx,xy=axes['xArrowHead'];yx,yt=axes['yArrowHead'];b=f'<g transform="translate(70 70) scale(1.5)"><path d="M{yx} {yt+8}V{oy}H{xx-8}" fill="none" stroke="#252440" stroke-width="1.4"/><path d="M{yx} {yt}L{yx-3} {yt+10}H{yx+3}ZM{xx} {xy}L{xx-10} {xy-3}V{xy+3}Z" fill="#252440"/>'
 for v,x in axes['xTicks']:
  if v==1:continue
  b+=f'<path d="M{x} {oy}V{oy+6}" stroke="#252440" stroke-width="1"/>'
 for c in r['curves']:
  pts=c['samples'];xs=[p[0]for p in pts];f=PchipInterpolator(xs,[p[1]for p in pts]);d=' '.join(('M'if x==xs[0]else'L')+f'{x} {float(f(x)):.3f}'for x in range(xs[0],xs[-1]+1));b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.7"/>'
 b+='</g>'
 for v,x in axes['xTicks']:b+=F.label(70+x*1.5,70+oy*1.5+38,str(v),26)
 for c in r['curves']:
  x,y=c['captionAnchor'];b+=F.label(70+x*1.5,70+y*1.5,c['label'],29)
 x,y=axes['xLabelAnchor'];b+=F.label(70+x*1.5,70+y*1.5,'pH',32)
 x,y=axes['yLabelAnchor'];x=70+x*1.5;y=70+y*1.5;b+=F.label(x,y,'Hiệu suất phản ứng',32,extra=f'transform="rotate(-90 {x} {y})"')
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="750" viewBox="0 0 1100 750"><title>Hiệu suất theo pH trong nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='enzyme-ph-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='MỗiPNGdùnganchorsriêng/PCHIP;giữ3curve/nhãn(1)(2)(3)/label1..12/tickmarks2..12/2arrow,khôngyTicks/guide/tênenzyme.'))
(M/'cau-truc-enzyme-ph-ddh-lo-111-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
