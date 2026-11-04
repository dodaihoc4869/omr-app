"""Phương trình chữ và mô hình K: giữ biến, điều kiện, số hạt đúng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-124.json').read_text())};rows=[]
def arrow(x,y,xx):return f'<path d="M{x} {y}H{xx-15}" stroke="#252440" stroke-width="3"/><path d="M{xx} {y}L{xx-20} {y-7}V{y+7}Z" fill="#252440"/>'
for i in[164,297,859,786]:
 b=''
 if i==164:
  w,h=700,700;b='<defs><radialGradient id="electron" cx="30%" cy="25%"><stop offset="0" stop-color="#fff6ba"/><stop offset="0.45" stop-color="#ffb719"/><stop offset="1" stop-color="#ef5c07"/></radialGradient><radialGradient id="nucleus"><stop offset="0" stop-color="#0088ff"/><stop offset="1" stop-color="#0043ef"/></radialGradient></defs>'
  radii=[120,170,220,270];angles=[[-90,90],[-90,-45,0,45,90,135,180,225],[-90,-45,0,45,90,135,180,225],[-90]]
  for r in radii:b+=f'<circle cx="350" cy="350" r="{r}" fill="none" stroke="#00737b" stroke-width="3"/>'
  b+='<circle cx="350" cy="350" r="65" fill="url(#nucleus)"/>'+F.label(350,340,'19p',34,fill='#fff')+F.label(350,385,'20n',34,fill='#fff')
  for r,aa in zip(radii,angles):
   for degree in aa:
    t=math.radians(degree);x=350+r*math.cos(t);y=350+r*math.sin(t);b+=f'<circle cx="{x:.5f}" cy="{y:.5f}" r="14" fill="url(#electron)" stroke="#dc3d03" stroke-width="1.5"/>'
 elif i==297:
  w,h=1400,240;b=F.label(35,140,'2 CH₃CHO',44,'start')+arrow(450,125,700)+F.label(575,75,'xt',32)+F.label(575,185,'H = 90%',32)+F.label(780,140,'CH₃COOCH₂CH₃',44,'start')
 elif i==859:
  w,h=1800,240
  for x,t in[(150,'Glycerol'),(650,'X'),(1150,'Y'),(1650,'Z')]:b+=F.label(x,145,t,44)
  for x,xx in[(340,520),(780,1020),(1280,1520)]:b+=arrow(x,125,xx)+F.label((x+xx)/2,70,'+CH₃COOH',32)+F.label((x+xx)/2,190,'−H₂O',32)
 else:
  w,h=1740,240
  for x,t in[(150,'Benzene'),(800,'Nitrobenzene'),(1500,'Aniline')]:b+=F.label(x,145,t,44)
  b+=arrow(340,125,570)+F.label(455,70,'+HNO₃, H₂SO₄ (đặc)',32)+arrow(1030,125,1320)+F.label(1175,70,'+Fe + HCl, t⁰',32)
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Nội dung theo hình nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phan-ung-va-k-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='1642/8/8/1=19electron/19p20nkhôngKthêm;297giữxt/H=90%;859giữXYZbiến/3lần+CH3COOH−H2O;786giữtênchấtEnglish/điềukiệnnguyênvăn.'))
(M/'cau-truc-phan-ung-va-k-ddh-lo-125-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
