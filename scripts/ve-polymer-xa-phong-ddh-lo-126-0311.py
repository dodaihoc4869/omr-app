"""Giữ chiều dài đoạn mạch, ngoặc ngắn, nhánh và chỉ số trong nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-124.json').read_text())};rows=[]
def line(x,y,xx,yy):return f'<path d="M{x:g} {y:g}L{xx:g} {yy:g}" stroke="#252440" stroke-width="3" fill="none"/>'
def arrow(x,y,xx):return line(x,y,xx-15,y)+f'<path d="M{xx} {y}L{xx-20} {y-7}V{y+7}Z" fill="#252440"/>'
def atom(x,y,t,size=40):return F.label(x-F.advance('C',size)/2,y,t,size,'start')
for i in[349,387,346]:
 if i==349:
  w,h=1500,320;b=F.label(70,140,'n',40)+atom(150,140,'CH₂')+atom(340,140,'CH')+line(225,123,310,123)+line(225,135,310,135)+line(340,155,340,210)+atom(340,255,'CN')+arrow(500,130,750)+F.label(625,70,'t⁰, xt, p',32)
  b+=atom(950,140,'CH₂')+atom(1150,140,'CH')+line(840,125,920,125)+line(1025,125,1120,125)+line(1200,125,1350,125)+line(1150,155,1150,210)+atom(1150,255,'CN')
  b+='<path d="M870 75Q840 127 870 180M1300 75Q1330 127 1300 180" fill="none" stroke="#252440" stroke-width="3"/>'+F.label(1350,192,'n',34)
 elif i==387:
  w,h=1650,310;points=[150+180*k for k in range(8)];b='';ends=[]
  for k,x in enumerate(points):
   t='CH₂'if k%2==0 else'CH';b+=atom(x,120,t);start=x-F.advance('C',40)/2;ends.append(start+F.advance(t,40))
   if k%2:b+=line(x,137,x,195)+atom(x,245,'Cl')
  b+=line(20,105,points[0]-F.advance('C',40)/2-12,105)
  for k in range(7):b+=line(ends[k]+12,105,points[k+1]-F.advance('C',40)/2-12,105)
  b+=line(ends[-1]+12,105,1620,105)
 else:
  w,h=2150,420;b='';prefix='C₁₅H₃₁COO';cx=20+F.advance(prefix,40)+F.advance('C',40)/2
  for k,t in enumerate(['CH₂','CH','CH₂']):b+=F.label(20,75+k*135,prefix+t,40,'start')
  b+=line(cx,105,cx,165)+line(cx,240,cx,300)+F.label(500,225,'+',40)+F.label(680,225,'3NaOH',40)+arrow(900,210,1100)+F.label(1000,155,'t⁰',32)+F.label(1170,225,'3C₁₅H₃₁COONa',40,'start')+F.label(1650,225,'+',40)
  for k,t in enumerate(['CH₂OH','CHOH','CH₂OH']):b+=F.label(1840,75+k*135,t,40,'start')
  cx=1840+F.advance('C',40)/2;b+=line(cx,105,cx,165)+line(cx,240,cx,300)
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Công thức và phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-xa-phong-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='349nmonomer/ngoặcNGẮNquanhbackbonenative,CNnhánhdướingoặc/nngoài/stub;3878C4Cl/khôngngoặnn/cap;346C15H31đủ3rows/3NaOH/3salt/glycerol3Cvertical/2plus.'))
(M/'cau-truc-polymer-xa-phong-ddh-lo-126-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
