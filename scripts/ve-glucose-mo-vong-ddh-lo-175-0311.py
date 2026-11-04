"""Nguồn1120/1030: mạch hở C tường minh và vòng α-glucose với nhãn liên kết."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-molecule-lo-169.json').read_text());out=[]
def line(d,w=1.2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=18):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x1,y1=p;x2,y2=q;nx,ny=-(y2-y1),x2-x1;ll=math.hypot(nx,ny);nx/=ll;ny/=ll;pts=[(x1+nx*.45,y1+ny*.45),(x2+nx*2.5,y2+ny*2.5),(x2-nx*2.5,y2-ny*2.5),(x1-nx*.45,y1-ny*.45)];return '<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#252440"/>'
b='<g transform="translate(25 20) scale(2)">'
rows=[('H','O'),('H','OH'),('HO','H'),('H','OH'),('H','OH'),('H','OH')]
for j,(left,right) in enumerate(rows):
 y=20+j*41;b+=F.label(65,y+7,'C',20)+F.label(27,y+7,left,20,'end')+F.label(97,y+7,right,20,'start')+line(f'M33 {y}H51')
 if j==0:b+=line(f'M77 {y-2}H92M77 {y+2}H92')
 else:b+=line(f'M77 {y}H92')
 if j<5:b+=line(f'M65 {y+11}V{y+28}')
b+=line('M65 236V251')+F.label(65,274,'H',20)
b+=line('M152 108L189 70H230M251 78L278 108L241 145H189L152 108')+wedge((152,108),(189,145))+line('M189 145H241',4)+wedge((278,108),(241,145))
b+=F.label(241,78,'O',19)+line('M189 70V42M152 108V135M189 145V116M241 145V174M278 108V136')
for x,y,t in [(189,39,'CH₂OH'),(152,155,'OH'),(189,111,'OH'),(241,195,'OH'),(278,156,'OH')]:b+=first(x,y,t,19)
for x,y,t in [(277,89,'(1)'),(244,128,'(2)'),(214,166,'(3)'),(211,63,'(4)')]:b+=F.label(x,y,t,16)
b+=F.label(225,231,'α-glucose',18)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="710" height="620" viewBox="0 0 710 620"><title>Mạch hở và mạch vòng glucose với nhãn liên kết</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-mo-vong-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
for i in [1120,1030]:
 r=dict(next(r for r in a if r['i']==i));r.pop('chiLaDuLieuDungChuaSoatRender',None);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='2panelsNOarrow/chainall6Cexplicit+5verticalCC/H-C=Otop/C6HleftOHrightHbelow/ring0H/CH2OHtext/C1OHdown/3frontbold/(1)..(4)LÀBONDkhôngcarbonnumbers/α-glucosecaption;khônggiảiquestion.')
 out.append(r)
(M/'cau-truc-glucose-mo-vong-ddh-lo-175-ban-dung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
