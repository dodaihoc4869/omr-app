"""Bộ bốn đồ thị cùng câu: phục hồi caption bằng glyph và ngữ cảnh, không giải đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-bo-4-graph-lo-154.json').read_text());rows=[]
for r in a:
 g=r['geometry154'];ax=g['axes'];x,y=ax['origin'];xx,yy=ax['xArrowHead'];vx,vy=ax['yArrowHead'];b=f'<g transform="translate(70 30) scale(3)"><path d="M{x} {y}V{vy}M{x} {y}H{xx}" fill="none" stroke="#252440" stroke-width="1.5"/><path d="M{vx} {vy}L{vx-4} {vy+12}L{vx} {vy+9}L{vx+4} {vy+12}Z M{xx} {yy}L{xx-13} {yy-4}L{xx-10} {yy}L{xx-13} {yy+4}Z" fill="#252440"/>'
 ps=g['curve']['samplesPixel'];d=f'M{ps[0][0]} {ps[0][1]}'
 if g['curve']['kind'].startswith('straight'):d+=f'L{ps[-1][0]} {ps[-1][1]}'
 else:
  xs=[p[0]for p in ps];ys=[p[1]for p in ps];pp=PchipInterpolator(xs,ys)
  for i in range(len(xs)-1):
   a,z=xs[i:i+2];py,qy=ys[i:i+2];h=z-a;c=pp.c[:,i];d+=f'C{a+h/3:.4f} {py+c[2]*h/3:.4f} {z-h/3:.4f} {qy-(3*c[0]*h*h+2*c[1]*h+c[2])*h/3:.4f} {z} {qy}'
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.5"/>'
 for key in['xLabel','yLabel']:
  z=ax[key];tx,ty=z['anchor'];b+=F.label(tx,ty+7,z['text'],22)
 base=g['caption']['visibleNativeBox'][3];b+=F.label(-12,base,g['caption']['text'],26,'start',weight='dam')+'</g>'
 raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1020" height="960" viewBox="0 0 1020 960"><title>Đồ thị có nhãn nguyên gốc theo bộ bốn nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bo-graph-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,hashPhongDam=F.font('dam')[1],trangThai='cho-soat-doc-lap',ghiChuDung='GIỮA./B./C./D.damthật/2axesarrow/[P]/Thờigian/1solidcurve/nodots-ticks-0-guide. Asteep/Bshallow/Cplateau/Dconcaveup;KHÔNGđổitheođápán. Chỉtáchlềinunknown978ROI252,278..295,291ngoàifigure,khôngđọcbịafooter/khôngbỏBhoặcXlabel.'))
(M/'cau-truc-bo-graph-ddh-lo-154-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
