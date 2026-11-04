"""Dựng đồ thị theo pixel nguồn, không áp thời điểm giả cho các điểm lấy mẫu."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=json.loads((M/'doc-khep-aspirin-lo-143.json').read_text())[0];g=r['geometry'];b='<g transform="translate(20 20) scale(2)">'
for x in g['minorGridXApprox']:b+=f'<path d="M{x} 106V343" stroke="#bbb" stroke-width=".65" stroke-dasharray="4 4"/>'
for y in g['minorGridYApprox']:b+=f'<path d="M116 {y}H611" stroke="#bbb" stroke-width=".65" stroke-dasharray="4 4"/>'
for t in g['xTicks'][1:-1]:b+=f'<path d="M{t["x"]} 106V343" stroke="#777" stroke-width=".9" stroke-dasharray="4 4"/>'
for t in g['yTicks'][1:-1]:b+=f'<path d="M116 {t["y"]}H611" stroke="#777" stroke-width=".9" stroke-dasharray="4 4"/>'
b+='<rect x="116" y="106" width="495" height="237" fill="none" stroke="#252440" stroke-width="1.6"/>'
for t in g['xTicks']:
 x=t['x'];b+=f'<path d="M{x} 343V351" stroke="#252440" stroke-width="1.4"/>'+F.label(x,379,t['text'],24)
for t in g['yTicks']:
 y=t['y'];b+=f'<path d="M108 {y}H116" stroke="#252440" stroke-width="1.4"/>'+F.label(103,y+8,t['text'],24,'end')
pts=g['curveSamples'];xs=[p[0]for p in pts];ys=[p[1]for p in pts];pp=PchipInterpolator(xs,ys);d=f'M{xs[0]} {ys[0]}'
for i in range(len(xs)-1):
 x,xx=xs[i:i+2];y,yy=ys[i:i+2];h=xx-x;c=pp.c[:,i];dy0=c[2];dy1=3*c[0]*h*h+2*c[1]*h+c[2];d+=f'C{x+h/3:.4f} {y+dy0*h/3:.4f} {xx-h/3:.4f} {yy-dy1*h/3:.4f} {xx} {yy}'
b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="1.8"/>'
for x,y in g['openCircles']:b+=f'<circle cx="{x}" cy="{y}" r="5" fill="#fff" stroke="#252440" stroke-width="1.7"/>'
for y,t in zip([49,79],g['titleLines']):b+=F.label(363,y,t,25)
b+=F.label(363,410,g['xLabel'],24)+'<g transform="translate(32 225) rotate(-90)">'+F.label(0,0,g['yLabel'],24)+'</g></g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1320" height="910" viewBox="0 0 1320 910"><title>Đồ thị aspirin theo vị trí nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-aspirin-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='10opencircles/1curvePCHIPqua20pixelanchors/major-minorgrid/box4cạnh/noarrow. GIỮ90tạix378không350/khônggánthờigiangiảchosamples/title2dòng/axisM-phút/Y0,0..0,10.')
(M/'cau-truc-do-thi-aspirin-ddh-lo-143-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
