"""Giữ mốc pixel, tất cả đường dóng/nhãn và thứ tự đường cong từ hai nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-graph-chi-tiet-lo-109.json').read_text())};rows=[]
for i in[1095,1330]:
 r=a[i];ax=r['axes'];ox,oy=ax['origin'];xx,yy=ax['xArrowHead'];yx,yt=ax['yArrowHead'];scale=2.2 if i==1095 else 1.1;margin=70 if i==1095 else 30;b=f'<g transform="translate({margin} {margin}) scale({scale})">'
 if i==1095:
  for x in r['grid']['verticalXs']:b+=f'<path d="M{x} 8V275" stroke="#999" stroke-width="0.65" stroke-dasharray="1 2"/>'
  for y in r['grid']['horizontalYs']:b+=f'<path d="M45 {y}H360" stroke="#999" stroke-width="0.65" stroke-dasharray="1 2"/>'
 else:
  for q in r['guides']:
   (x,y),(endx,endy)=q['from'],q['to'];b+=f'<path d="M{x} {y}L{endx} {endy}" stroke="#252440" stroke-width="2" stroke-dasharray="6 5"/>'
 b+=f'<path d="M{yx} {yt+7}V{oy}H{xx-7}" stroke="#252440" stroke-width="{1 if i==1095 else 2.6}" fill="none"/><path d="M{yx} {yt}L{yx-3 if i==1095 else yx-6} {yt+10 if i==1095 else yt+20}H{yx+3 if i==1095 else yx+6}ZM{xx} {yy}L{xx-10 if i==1095 else xx-20} {yy-3 if i==1095 else yy-6}V{yy+3 if i==1095 else yy+6}Z" fill="#252440"/>'
 for v,y in ax['yTicks']:
  b+=f'<path d="M{ox-5 if i==1095 else ox-10} {y}H{ox}" stroke="#252440" stroke-width="1"/>'+F.label(ox-9 if i==1095 else ox-16,y+4 if i==1095 else y+9,str(v),12 if i==1095 else 26,'end')
 if i==1095:
  for v,x in ax['xTicks']:
   if v!=0:b+=f'<path d="M{x} {oy}V{oy+4}" stroke="#252440" stroke-width="1"/>'
   b+=F.label(x,oy+14,str(v),12)
 else:
  b+='<path d="M274 450V461" stroke="#252440" stroke-width="2"/>'+F.label(168,484,'0',28)+F.label(274,504,'t₁',28)
 for c in r['curves']:
  pts=c['samples'];xs=[p[0]for p in pts];f=PchipInterpolator(xs,[p[1]for p in pts]);d=' '.join(('M'if x==xs[0]else'L')+f'{x} {float(f(x)):.3f}'for x in range(xs[0],xs[-1]+1));color='#929292'if c.get('color')=='grey'else'#252440';b+=f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{1.8 if i==1095 else 5}"/>'
  if i==1095:
   x,y=c['endOpenCircle'];b+=f'<circle cx="{x}" cy="{y}" r="2.2" fill="#fff" stroke="#686772" stroke-width="0.8"/>';x1,y1,x2,y2=c['legendBox'];nx,ny=c['legendNotch'];b+=f'<path d="M{x1} {y1}H{x2}V{y2}H{x1}V{ny+3}L{nx} {ny}L{x1} {ny-3}Z" fill="#686772"/>';x,y=c['legendTextAnchor'];b+=F.label(x,y+4,c['label'],11,fill='#fff',weight='dam')
  else:
   x,y=c['labelAnchor'];b+=F.label(x,y,c['label'],28)
 x,y=ax['xLabelAnchor'];b+=F.label(x,y,r['xLabel'],13 if i==1095 else 30)
 x,y=ax['yLabelAnchor'];b+=F.label(x,y,r['yLabel'],13 if i==1095 else 30,extra=f'transform="rotate(-90 {x} {y})"')+'</g>'
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="780" viewBox="0 0 1100 780"><title>Đồ thị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='haber-nox-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='PCHIPquaanchorsnative,nochuẩnhoáhóahọc.1095đủ5curve/5circlemở/5legend350..550°C/grid/ticks.1330đủ3curve/4guideY+guideverticalt1/từnglabel/color.'))
(M/'cau-truc-haber-nox-ddh-lo-115-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
