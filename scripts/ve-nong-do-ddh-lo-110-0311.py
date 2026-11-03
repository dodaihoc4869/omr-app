"""Đồ thị nồng độ từ các mốc pixel đã đọc; giữ hai plateau1 và0,5 riêng."""
from pathlib import Path
import importlib.util,json,hashlib
from scipy.interpolate import PchipInterpolator
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-graph-chi-tiet-lo-109.json').read_text())if r['i']==637)
b='<g transform="translate(40 40) scale(3)"><path d="M50 12V149H282" fill="none" stroke="#252440" stroke-width="0.8"/><path d="M50 5L48 13H52ZM289 149L281 147V151Z" fill="#252440"/>'
for guide in r['guides']:
 (x,y),(xx,yy)=guide['from'],guide['to'];b+=f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#686772" stroke-width="0.6" stroke-dasharray="3 3"/>'
for c in r['curves']:
 pts=c['samples'];xs=[p[0]for p in pts];ys=[p[1]for p in pts];f=PchipInterpolator(xs,ys);d=' '.join(('M'if x==xs[0]else'L')+f'{x:.2f} {float(f(x)):.3f}'for x in range(xs[0],xs[-1]+1));b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="0.9"/>'
b+='</g>'+F.label(155,200,'1',32,'end')+F.label(155,350,'0,5',32,'end')+F.label(630,585,'Thời gian phản ứng',34)+F.label(70,285,'Nồng độ (mol L⁻¹)',32,extra='transform="rotate(-90 70 285)"')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="630" viewBox="0 0 1000 630"><title>Biến đổi nồng độ theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nong-do-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
row=dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='PCHIPquaanchorspixelnguồn,khôngkhớptheothểthứchóahọc/khôngthêmX,Y/0/tickX/captionHình1.1. Hai guides/plateau1và0,5 khácnhau.')
(M/'cau-truc-nong-do-ddh-lo-110-ban-dung.json').write_text(json.dumps([row],ensure_ascii=False,indent=2))
