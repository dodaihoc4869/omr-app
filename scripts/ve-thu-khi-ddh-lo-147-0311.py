"""Bốn cách thu khí: giữ hướng, chiều bình và ba bọt rõ của nguồn, không giải tên khí."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-144.json').read_text())if r['i']==1197);g=r['geometry']
def path(d,w=1.2,c='#252440',extra=''):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def rounded(ps):
 d=f'M{ps[0][0]} {ps[0][1]}'
 for i in range(1,len(ps)-1):
  a,p,z=ps[i-1:i+2];da=math.dist(a,p);dz=math.dist(p,z);rr=min(4,da/2,dz/2);q=[p[k]+(a[k]-p[k])*rr/da for k in[0,1]];v=[p[k]+(z[k]-p[k])*rr/dz for k in[0,1]];d+=f'L{q[0]} {q[1]}Q{p[0]} {p[1]} {v[0]} {v[1]}'
 return d+f'L{ps[-1][0]} {ps[-1][1]}'
b='<defs><clipPath id="water"><path d="M643 129H833V192Q833 205 817 205H656Q643 205 643 192Z"/></clipPath><clipPath id="inside"><path d="M718 92H773L755 145V175H735V145Z"/></clipPath></defs><g transform="translate(25 25) scale(2)">'
b+=path('M47 200L82 77V62H90M97 62H105V77L139 200Q139 202 136 202H50Q47 202 47 200')
b+=path('M261 37H352L316 160V176H309M303 176H299V160L261 37')
b+=path('M453 205L489 83V66H497M503 66H513V83L546 205Q546 207 543 207H456Q453 207 453 205')
# Ký hiệu nước ngắn, không biểu thị số hạt hay thể tích.
for clip in['water','inside']:
 b+=f'<g clip-path="url(#{clip})">'
 for row,y in enumerate(range(92,207,12)):
  for x in range(644+(row%2)*9,835,23):b+=path(f'M{x} {y}h6',.9)
 b+='</g>'
b+=path('M642 119V192Q642 206 656 206H817Q834 206 834 192V119M642 128H834')
b+=path('M700 36H791L755 145V175H747M740 175H735V145L700 36')+path('M718 91H773',1,extra='stroke-dasharray="7 6"')
for panel in g.values():
 ps=panel['gasTubeDoublePath']
 if panel is g['panelT']:b+=path(rounded([[651.5,86],[721,182],[732,187],[743,184],[743,129]]),4,'#fff')
 for pts in ps:b+=path(rounded(pts),1.2)
 if 'bubbleCirclesApprox'in panel:
  for x,y,rr in panel['bubbleCirclesApprox']:b+=f'<circle cx="{x}" cy="{y}" r="{rr}" fill="#fff" stroke="#252440" stroke-width="1"/>'
 tail=panel['flowArrow']['tail'];head=panel['flowArrow']['head'];x,y=head;dx=x-tail[0];dy=y-tail[1];dd=math.hypot(dx,dy);ux,uy=dx/dd,dy/dd;px,py=-uy,ux;b+=path(f'M{tail[0]} {tail[1]}L{x} {y}')+f'<path d="M{x} {y}L{x-8*ux+2.4*px} {y-8*uy+2.4*py}L{x-8*ux-2.4*px} {y-8*uy-2.4*py}Z" fill="#252440"/>'
 text,(x,y)=panel['label'];b+=F.label(x,y+6,text,18)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1820" height="500" viewBox="0 0 1820 500"><title>Bốn cách thu khí theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='thu-khi-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='4panelXYZT:flowXleft/Yright/Zright/Tdownright;đứng/úpđúngsource,doublepathtubeskhôngđếnđáyX/Z;Tbath2mứcnước/3bubbleRÕ;khôngtênkhí/đápán/labelphụ.')
(M/'cau-truc-thu-khi-ddh-lo-147-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
