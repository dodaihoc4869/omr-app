"""Nguồn265: ba vòng chéo và chỉ số lặp 7 000 nguyên văn."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='2d018b8b2f83477d81f66ca0aa16fa33d4fc5edea603868e445b7f538065467b';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=20):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.8,p[1]+uy*.8),(q[0]+ux*3,q[1]+uy*3),(q[0]-ux*3,q[1]-uy*3),(p[0]-ux*.8,p[1]-uy*.8)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
def ring(x,y,left=False,right=False):
 b=f'<g transform="translate({x} {y})">'+line('M-40 38L0 0H39M64 12L91 38')+F.label(52,9,'O',20)
 b+=taper((-40,38),(0,74))+line('M0 74H52',5.5)+taper((91,38),(52,74))
 b+=line('M0 0V-20M0 0V14M-40 38V12M91 38V65M0 74V60M0 74V94M52 74V54M52 74V94')
 b+=first(0,-25,'CH₂OH')+F.label(0,33,'H',18)+F.label(-40,8,'H',18)+F.label(91,83,'H',18)+first(0,55,'OH')+F.label(0,114,'H',18)+F.label(52,50,'H',18)+first(52,114,'OH')
 if left:b+=line('M-40 38V65')+first(-40,83,'OH')
 if right:b+=line('M91 38V12')+first(91,8,'OH')
 return b+'</g>'
b=ring(126,199,left=True)+ring(348,138)+ring(569,76,right=True)
b+=line('M217 237L251 213M274 198L308 176M439 176L473 152M497 139L529 114')+F.label(262,213,'O',20)+F.label(484,153,'O',20)
b+=line('M298 88H287V259H298M502 88H512V259H502')+F.label(519,265,'7 000',15,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="749" height="348" viewBox="0 0 749 348"><title>Carbohydrate có chỉ số lặp 7 000 theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cellulose-7000-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=265,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3Haworthchéo/15H/8OH/3CH2OH/2bridgeO/6TAPER3horizontalbold/leftOHdown-rightOHup/brackets7 000literal/noaddedcaption-carbonnums/DDHpath.')
(K/'cau-truc-cellulose-7000-ddh-lo-219-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
