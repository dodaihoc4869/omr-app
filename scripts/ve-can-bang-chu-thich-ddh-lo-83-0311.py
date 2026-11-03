"""Nguồn1068: giữ hai chú thích cùng mũi tên, không bỏ vì giống biểu đồ128."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(x for x in json.loads((M/'doc-dung-moi-lo-79.json').read_text())if x['i']==1068);scale=1.3
def line(x,y,xx,yy,width=2,extra=''):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="#252440" stroke-width="{width}" {extra}/>'
def smooth(points):
 hs=[points[k+1][0]-points[k][0]for k in range(len(points)-1)];ss=[(points[k+1][1]-points[k][1])/hs[k]for k in range(len(hs))];ms=[ss[0]]
 for k in range(1,len(points)-1):
  w1=2*hs[k]+hs[k-1];w2=hs[k]+2*hs[k-1];ms.append((w1+w2)/(w1/ss[k-1]+w2/ss[k])if ss[k-1]*ss[k]>0 else 0)
 ms.append(0);d=f'M{points[0][0]} {points[0][1]}'
 for k,h in enumerate(hs):
  x,y=points[k];xx,yy=points[k+1];d+=f'C{x+h/3:g} {y+ms[k]*h/3:g} {xx-h/3:g} {yy-ms[k+1]*h/3:g} {xx:g} {yy:g}'
 return d+'H580'
g=line(141,35,141,534)+line(141,534,911,534)+'<path d="M141 35L135 49H147ZM911 534L897 528V540Z" fill="#252440"/>'
for value,yy in r['geometry']['yTickPixel']:g+=line(130,yy,151,yy)
for item in r['geometry']['guides']:g+=line(item['x1'],item['y'],item['x2'],item['y'],1.8,'stroke-dasharray="6 5"')
for pts in [[(141,534),(184,384),(260,271),(353,185),(455,148)],[(142,315),(184,384),(265,460),(350,490),(455,498)]]:g+=f'<path d="{smooth(pts)}" fill="none" stroke="#252440" stroke-width="2.2"/>'
for item in r['annotations']:
 tx,ty=item['arrow']['tail'];hx,hy=item['arrow']['head'];g+=line(tx,ty,hx,hy)+f'<path d="M{hx} {hy}L{hx+10} {hy-5}V{hy+5}Z" fill="#252440"/>'
b=f'<g transform="scale({scale})">'+g+'</g>'
for value,yy in r['geometry']['yTickPixel']:b+=F.label(122*scale,yy*scale+9,str(value),29,'end')
for item in r['geometry']['guides']:
 x,y=item['labelXY'];b+=F.label(x*scale,y*scale,item['label'],29,'start')
b+=F.label(518*scale,115*scale,r['caption'][0],30)+F.label(526*scale,584*scale,r['xLabel'],30)+F.label(65*scale,315*scale,r['yLabel'],30,extra=f'transform="rotate(-90 {65*scale:g} {315*scale:g})"')
for item in r['annotations']:
 xx,yy=item['textXY']
 for k,text in enumerate(item['text']):
  assert xx*scale+F.advance(text,30)<1240
  b+=F.label(xx*scale,(yy+k*34)*scale,text,30,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1260" height="830" viewBox="0 0 1260 830"><title>Đồ thị theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='can-bang-chu-thich-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Giữ ytick/guide theo vị trí ảnh nguồn, không nội suy thêm số. Hai mũi tên chỉ trái và4dòng chú thích được giữ đủ; không thêm HI/H2/I2 khác.')
(M/'cau-truc-can-bang-chu-thich-ddh-lo-83-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
