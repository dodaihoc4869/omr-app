"""Giữ số thùy, hướng trục, vùng xen phủ và caption của từng nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a={r['i']:r for r in json.loads((M/'doc-molecule-lo-117.json').read_text())};rows=[]
DEFS='<defs><radialGradient id="orb" cx="35%" cy="30%" r="80%"><stop offset="0" stop-color="#f4f4f4"/><stop offset="0.3" stop-color="#bababa"/><stop offset="1" stop-color="#7f7f7f"/></radialGradient></defs>'
def line(x,y,xx,yy,w=2,color='#686772'):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{color}" stroke-width="{w}"/>'
def tip(x,y,angle,length=10,width=5):
 t=math.radians(angle);ux,uy=math.cos(t),math.sin(t);return f'<path d="M{x} {y}L{x-ux*length-uy*width/2} {y-uy*length+ux*width/2}L{x-ux*length+uy*width/2} {y-uy*length-ux*width/2}Z" fill="#686772"/>'
def shape(length=85,half=27,fill='url(#orb)',opacity=1):
 d=f'M0 0C{length*.3} {-half*.5} {length*.72} {-half*1.2} {length*.9} {-half}C{length*1.08} {-half*.75} {length*1.08} {half*.75} {length*.9} {half}C{length*.72} {half*1.2} {length*.3} {half*.5} 0 0Z'
 return f'<path d="{d}" fill="{fill}" fill-opacity="{opacity}" stroke="#686772" stroke-width="0.8"/>'
def lobe(x,y,angle,length=85,half=27,flat=False):return f'<g transform="translate({x} {y}) rotate({angle})">'+shape(length,half,'#8e8e8e'if flat else'url(#orb)',.52 if flat else 1)+'</g>'
def pair(x,y,angle,length=85,half=27,flat=False):return lobe(x,y,angle,length,half,flat)+lobe(x,y,angle+180,length,half,flat)
def axes(yhead=True):
 b=line(160,35,160,285)+line(20,160,290,160)+line(55,265,250,70)+tip(160,35,-90)+tip(55,265,135)
 if yhead:b+=tip(290,160,0)
 return b+F.label(175,35,'z',23)+F.label(305,168,'y',23)+F.label(55,292,'x',23)
for i in[627,737,981,1175,1337]:
 b=DEFS
 if i==627:
  w,h=350,390;b+=axes()+pair(160,160,-45)+F.label(170,355,'AO p',28)
 elif i in[737,981]:
  w,h=1360,340
  for k,kind in enumerate(['sphere','x','y','z']):
   q=axes(yhead=k!=0)
   q+=('<circle cx="160" cy="160" r="55" fill="url(#orb)" stroke="#686772" stroke-width="1"/>')if kind=='sphere'else pair(160,160,{'x':-45,'y':0,'z':-90}[kind])
   b+=f'<g transform="translate({k*340} 0)">'+q+'</g>'
 elif i==1175:
  w,h=806,257;b+=pair(273,126,0,162,60,True)+pair(531,126,0,162,60,True)+line(77,126,725,126,1.4)
 else:
  w,h=2000,440
  for k in range(4):
   q=''
   if k==0:
    for x in[195,270]:q+=f'<circle cx="{x}" cy="200" r="55" fill="#8e8e8e" fill-opacity="0.52" stroke="#686772" stroke-width="0.6"/>'
   elif k==1:q+='<circle cx="90" cy="200" r="50" fill="#8e8e8e" fill-opacity="0.52" stroke="#686772" stroke-width="0.6"/>'+pair(250,200,0,150,37,True)+line(20,200,460,200,1.6)+tip(460,200,0)
   elif k==2:q+=pair(150,200,0,130,37,True)+pair(350,200,0,130,37,True)+line(10,200,540,200,1.6)+tip(540,200,0)
   else:
    q+=pair(205,200,-90,125,37,True)+pair(260,200,-90,125,37,True)+line(205,20,205,355,1.4)+line(260,20,260,355,1.4)+line(160,200,305,200,1.4)
   q+=F.label(250,410,a[i]['captions'][k],26);b+=f'<g transform="translate({k*500} 0)">'+q+'</g>'
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Hình orbital và xen phủ theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nhom-orbital-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(a[i],svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Giữthứtự/caption/4lobesvàoverlap.737/981panel1yheadrấtyếu/capvuôngnênkhôngthêmmũinhọnrõ;panel2..4giữheadx/y/z.627captionAO p,khôngalias593phaWHITE.'))
(M/'cau-truc-nhom-orbital-ddh-lo-122-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
