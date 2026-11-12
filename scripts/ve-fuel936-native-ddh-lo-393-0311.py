"""Nguồn936: pin nhiên liệu, từng hạt/mũi tên và nhãn AEM theo bản gốc."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-fuel936-lo-393.json').read_text());h=p['hash'];b=''
def path(d,fill='none',stroke='#252525',w=1.8):
 global b
 b+=f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'
def line(v,color='#252525',w=1.8):path('M'+'L'.join(f'{x} {y}'for x,y in v),stroke=color,w=w)
def lab(x,y,t,z=14,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#181818')
def arrow(a,z,width=8,color='#252525',w=1.5):
 global b
 dx,dy=z[0]-a[0],z[1]-a[1];ll=(dx*dx+dy*dy)**.5;ux,uy=dx/ll,dy/ll;bx,by=z[0]-ux*width,z[1]-uy*width;nx,ny=-uy*width*.36,ux*width*.36
 line([a,z],color,w)
 path('M'+f'{z[0]} {z[1]} L{bx+nx} {by+ny} L{bx+ux*width*.22} {by+uy*width*.22} L{bx-nx} {by-ny} Z',fill=color,stroke='none',w=0)
b+='<defs><radialGradient id="dot" cx="42%" cy="37%" r="65%"><stop offset="0" stop-color="#d499c3"/><stop offset=".6" stop-color="#a95c9e"/><stop offset="1" stop-color="#843075"/></radialGradient><linearGradient id="terminal"><stop stop-color="#888b85"/><stop offset=".5" stop-color="#e3e5dc"/><stop offset="1" stop-color="#777a73"/></linearGradient></defs>'
# Ba vùng và hai cổ điện cực riêng, giữ ba cửa mở.
path('M114 120 L126 120 L126 96 L148 96 L148 120 L161 120 L161 347 L114 347 Z',fill='#f8ae40')
path('M161 120 H296 V347 H161 Z',fill='#2ba7dd')
path('M296 120 H310 V96 H329 V120 H345 V347 H296 Z',fill='#e93e34')
# Vỏ giữ hai lối vào và một lối ra bên trái.
path('M18 156 H95 V131 Q95 120 106 120 H126 V96 H148 V120 H310 V96 H329 V120 H365 Q375 120 375 131 V156 H427 M427 184 H375 V334 Q375 347 365 347 H106 Q95 347 95 335 V311 H18 M18 274 H95 V184 H18',w=2)
path('M130 95 V88 H142 V95 Z',fill='url(#terminal)',stroke='#777b75',w=.9)
path('M313 95 V88 H325 V95 Z',fill='url(#terminal)',stroke='#777b75',w=.9)
line([[136,88],[136,43],[180,43],[190,31],[201,55],[214,31],[225,55],[236,31],[247,59],[254,42],[319,42],[319,88]],'#666963',1.3)
# Từng vị trí hạt riêng: 12 trái, 8 phải và 1 trong chú giải.
for x,y,rx,ry in [(144.5,145,4.3,5),(127.5,156.5,4.3,5),(142,172.5,4.3,5),(123.5,180.5,4.3,5),(147.5,199.5,4.3,5),(130.5,205.5,4.3,5),(124.5,230,4.3,5),(145.5,231.5,4.3,5),(144.5,259,4.3,5),(126.5,285.5,4.3,5),(150.5,305,4.3,5),(131.5,317.5,4.3,5),(319,149,4.3,5),(309,175,4.3,5),(326,191,4.3,5),(310,212.5,4.3,5),(331,240.5,4.3,5),(307,253,4.3,5),(328,279,4.3,5),(311.5,307,4.3,5),(80.5,20.5,4,4.7)]:
 b+=f'<ellipse cx="{x}" cy="{y}" rx="{rx}" ry="{ry}" fill="url(#dot)"/>'
for a,z,ww in [([155.5,19],[180.5,19],12),([266,19],[291,19],12),([117,84],[117,56],12),([333,51],[333,79],12),([136,135],[136,100],12),([319,99],[319,135],12)]:arrow(a,z,ww,'#923588',2)
for a,z in [([241,160],[215,160]),([212,210],[186,210]),([200,263],[174,263]),([227,312],[200,312])]:arrow(a,z,10,'#252d32',2)
for a,z in [([63,171],[95,171]),([406,170],[374,170]),([95,294],[63,294])]:arrow(a,z,12,'#60615e',2)
lab(91,27,'Electron',13.5,anchor='start');lab(102,43,'Flow',13.5,anchor='start');lab(226,77,'Load',14)
lab(245,166,'OH',16,anchor='start');lab(271,158,'-',11,anchor='start')
lab(217,216,'OH',16,anchor='start');lab(243,208,'-',11,anchor='start')
lab(205,269,'OH',16,anchor='start');lab(231,261,'-',11,anchor='start')
lab(230,318,'OH',16,anchor='start');lab(256,310,'-',11,anchor='start')
lab(19,177,'C₂H₅OH',10.5,anchor='start');lab(411,174,'O₂ + 2H₂O',10.5,anchor='start');lab(6,299,'CO₂ + H₂O',10.5,anchor='start')
lab(137,366,'Anode',14);lab(226,366,'AEM',14);lab(320,366,'Cathode',14)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="469" height="370" viewBox="0 0 469 370"><title>Sơ đồ pin theo nguồn936</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fuel936-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=936,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='21PURPLEellipses12LEFT8RIGHT1legend/6PURPLEfilledheads2RIGHT2UP2DOWN/4OHsupMINUS4BLACKLEFTfilledheads/3GRAYportheadsRIGHT-LEFT-LEFT/3zonesorange-blue-red/2nativeNECKS2grayterminals1wire3up3downresistor/EXACTElectron Flow-Load-Anode-AEM-Cathode-C2H5OH-O2+2H2O-CO2+H2O/ALLregularUPRIGHT-SUB25-SUPminus/3OPENports/NOaddedH-label-charge-currentvalue-formula-answer-alias')
(K/'cau-truc-fuel936-native-ddh-lo-393-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
