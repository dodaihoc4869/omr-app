"""Nguồn299: hai Haworth có nhãn carbon và nhóm thế đúng ảnh nguồn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='33a1405b7456c02797ec9e791c1c0f665a97e25748cab1f843ba2fd6bcce1adb';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=28):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.7,p[1]+uy*.7),(q[0]+ux*2.8,q[1]+uy*2.8),(q[0]-ux*2.8,q[1]-uy*2.8),(p[0]-ux*.7,p[1]-uy*.7)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
def ring(x,y,bottom):
 b=f'<g transform="translate({x} {y})">'+line('M-60 58L0 0H64M92 15L138 58')+F.label(78,13,'O',28)
 b+=taper((-60,58),(0,113))+line('M0 113H80',5)+taper((138,58),(80,113))
 b+=line('M0 0V-31M0 0V24M-60 58V16M-60 58V95M138 58V15M138 58V95M0 113V86M0 113V150M80 113V83M80 113V150')
 b+=first(0,-38,'CH₂OH')+F.label(0,47,'H',28)+F.label(-60,12,'H',28)+first(-60,123,'OH')+first(138,6,'OH')+F.label(138,125,'H',28)+first(0,79,'OH')+F.label(0,178,'H',28)+F.label(80,77,'H',28)+first(80,176,bottom)
 for a,c,t in [(151,52,'1'),(94,136,'2'),(-14,141,'3'),(-73,67,'4'),(-16,-3,'5'),(-2,-64,'6')]:b+=F.label(a,c,t,18)
 return b+'</g>'
b=ring(125,128,'OH')+ring(738,118,'NH₂')+F.label(173,351,'glucose',26)+F.label(787,345,'glucosamine',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="982" height="398" viewBox="0 0 982 398"><title>Glucose và glucosamine theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-glucosamine-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=299,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2Haworth/10H/12Cnums/2CH2OH/7OH+NH2-C2DOWNright/βC1OHUPboth/4weakTAPER2horizontalbold/2captionslowercase/noextraH-DDHpath.')
(K/'cau-truc-glucose-glucosamine-ddh-lo-223-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
