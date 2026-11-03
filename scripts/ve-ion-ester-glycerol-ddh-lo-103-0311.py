"""Giữ kích thước ion, nhóm ester mở và từng hoán vị R1/R2 trong nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-101.json').read_text())};rows=[]
def line(x,y,xx,yy):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="#252440" stroke-width="3"/>'
for i in[254,651,1142,1075,869,1316]:
 if i in[254,651]:
  w,h=740,300;b=''
  for x,y,rad,txt in[(80,75,45,'Al'),(80,225,23,'Al³⁺'),(430,75,32,'S'),(430,225,58,'S²⁻')]:b+=f'<circle cx="{x}" cy="{y}" r="{rad}" fill="#252440"/>'+F.label(x+rad+35,y+15,txt,49,'start')
 elif i in[1142,1075]:
  w,h=500,300;b=F.label(175,170,'C',50)+F.label(325,80,'O',50)+F.label(325,260,'O',50)
  for z in[(55,154,140,154),(200,131,286,80),(207,143,293,92),(208,176,290,225),(358,245,445,245)]:b+=line(*z)
 else:
  w,h=1200,350;b=''
  for k,panel in enumerate(a[i]['panels']):
   x=35+k*600;cx=x+345
   for row,key in enumerate(['top','middle','bottom']):
    rr=panel[key].split('–')[0];yy=65+row*125;b+=F.label(x,yy,rr,42,'start')+line(x+55,yy-15,x+105,yy-15)+F.label(x+120,yy,'COO',42,'start')+line(x+220,yy-15,cx-25,yy-15)+F.label(cx-F.advance('C',42)/2,yy,'CH₂'if row!=1 else'CH',42,'start')
   b+=line(cx,89,cx,145)+line(cx,214,cx,270)
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Nội dung cấu trúc theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ion-ester-glycerol-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='KhôngthêmCH3vàoesterendpoints/khôngcoibondlàcharge;glycerol3C/từngR1R2đúnghàng;Al>Al3+/S<S2−vàlabelsđúng.'))
(M/'cau-truc-ion-ester-glycerol-ddh-lo-103-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
