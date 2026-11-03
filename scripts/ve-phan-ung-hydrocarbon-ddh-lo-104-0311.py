"""Ba phản ứng giữ số carbon, nhóm hiện chữ và hệ số đúng hình nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-101.json').read_text())};rows=[]
def line(x,y,xx,yy):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" fill="none" stroke="#252440" stroke-width="3"/>'
def chain(points):return ''.join(line(*p,*q)for p,q in zip(points,points[1:]))
def arrow(x,y,xx):return line(x,y,xx-15,y)+f'<path d="M{xx} {y}L{xx-20} {y-7}V{y+7}Z" fill="#252440"/>'
def ring(cx,cy,r):
 p=[(cx+math.sin(k*math.pi/3)*r,cy-math.cos(k*math.pi/3)*r)for k in range(6)];b=chain(p+[p[0]]);q=[(cx+(x-cx)*.84,cy+(y-cy)*.84)for x,y in p]
 for k in[0,2,4]:b+=line(*q[k],*q[(k+1)%6])
 return b,p
for i in[1369,613,1362]:
 if i==1369:
  w,h=1120,380;b=chain([(40,230),(100,190),(160,230),(220,190),(280,230),(340,190),(400,230),(460,190)])+arrow(490,220,650)+F.label(575,180,'xt, t°',31)
  b+=chain([(700,190),(770,240),(840,190),(910,240),(980,190),(1050,240)])+line(770,240,770,320)+line(980,190,980,110)
 elif i==613:
  w,h=1300,400;b=F.label(35,260,'CH₃[CH₂]₅CH₃',43,'start')+arrow(520,245,690)+F.label(605,200,'xt, t⁰',34);rr,p=ring(880,250,100);b+=rr+line(880,150,880,100)+F.label(880,75,'CH₃',43)+F.label(1080,260,'+',43)+F.label(1140,260,'H₂',43,'start')
 else:
  w,h=1300,480;b,p=ring(220,300,120);b+=line(220,180,220,125)+F.label(220,90,'CH₂CH₃',43)+arrow(430,300,650)+F.label(540,250,'xt, t⁰',34)
  rr,p=ring(900,300,120);b+=rr+line(900,180,900,125)+F.label(900,90,'CH₃',43)+line(*p[1],1070,200)+F.label(1130,210,'CH₃',43)
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Phản ứng theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phan-ung-hydrocarbon-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='1369giữ8C→8C/2,5dimethylhexane.613giữ[CH2]5/tolueneCH3/+H2KHÔNG4.1362giữethyltext→ortho2CH3text/khôngphụphẩm.'))
(M/'cau-truc-phan-ung-hydrocarbon-ddh-lo-104-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
