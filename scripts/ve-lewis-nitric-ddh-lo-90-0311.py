"""Dựng chấm electron và mũi tên cho–nhận theo ảnh, không chuẩn hoá phương án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-87.json').read_text())}
def label(x,y,t):return F.label(x,y+16,t,46)
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="3"/>'
def dots(x,y,vertical=False):
 return ''.join(f'<circle cx="{x+(0 if vertical else d)}" cy="{y+(d if vertical else 0)}" r="5" fill="#ed1717"/>'for d in[-10,10])
def arrow(x,y,xx,yy):
 import math
 vx,vy=xx-x,yy-y;d=math.hypot(vx,vy);ux,uy=vx/d,vy/d
 return line(x,y,xx,yy)+f'<path d="M{xx} {yy}L{xx-ux*18-uy*7} {yy-uy*18+ux*7}L{xx-ux*18+uy*7} {yy-uy*18-ux*7}Z" fill="#252440"/>'
rows=[]
for i in [179,1253,199,1000,306,1080,1384,354]:
 w,h=460,330;b=''
 if i in [179,1253]:
  b=''.join(label(x,y,t) for x,y,t in [(110,145,'H'),(230,145,'N'if i==179 else'B'),(350,145,'H'),(230,265,'H')]);b+=dots(170,145,True)+dots(290,145,True)+dots(230,205)
  if i==179:b+=dots(230,85)
 elif i==199:
  b=label(160,160,'Cl')+label(300,160,'Cl')+dots(230,160,True)
  for x in[160,300]:b+=dots(x,100)+dots(x,220)
  b+=dots(90,160,True)+dots(370,160,True)
 elif i==1000:
  b=label(90,160,'O')+label(230,160,'C')+label(370,160,'O')
  for x in[90,370]:b+=dots(x,100)+dots(x,220)
  for x in[150,175,285,310]:b+=dots(x,160,True)
 elif i==306:b=F.label(230,184,'CO₂',64)
 elif i in[1080,1384]:
  w,h=620,330;b=''.join(label(x,y,t)for x,y,t in [(65,240,'H'),(180,180,'O'),(365,180,'N'),(530,70,'O'),(530,290,'O')]);b+=line(93,226,149,195)+line(213,180,332,180)+line(388,157,495,86)+line(395,168,502,97)+arrow(393,198,492,266)
  if i==1384:b+=F.label(315,310,'b)',34)
 elif i==354:
  w,h=620,380;b=''.join(label(x,y,t)for x,y,t in [(65,270,'H'),(215,350,'O'),(365,265,'N'),(365,65,'O'),(530,350,'O')]);b+=line(96,286,184,333)+line(245,334,333,283)+line(357,230,357,99)+line(373,230,373,99)+arrow(396,283,493,333)
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Công thức theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='lewis-nitric-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap'))
(M/'cau-truc-lewis-nitric-ddh-lo-90-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
