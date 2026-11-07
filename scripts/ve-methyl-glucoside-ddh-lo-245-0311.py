"""Nguồn548: methyl glucoside giữ các OH và OCH3 đúng nhánh."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='673f5c9ab9c64f59ef0a927e69bd17f854ebda30b953625f0decfd35da5be32a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.5):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.7,p[1]+uy*.7),(q[0]+ux*3.5,q[1]+uy*3.5),(q[0]-ux*3.5,q[1]-uy*3.5),(p[0]-ux*.7,p[1]-uy*.7)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=line('M57 146L106 110H169M189 118L226 145M106 110V72L133 56M57 146V180M106 183V146M180 183V216M226 145V186',1.7)
b+=taper((57,146),(106,183))+taper((226,145),(180,183))+line('M106 183H180',6)
b+=F.label(180,116,'O',24)
for x,y in [(145,55),(57,197),(106,140),(180,233)]:b+=first(x,y,'OH')
b+=first(226,204,'OCH₃')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="323" height="270" viewBox="0 0 323 270"><title>Công thức methyl glucoside theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='methyl-glucoside-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=548,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='singleHaworth/4OH+ringO+OCH3DOWN/0H-0Cnums-0CH2OH/2taper1bold/C6barebentOH/noextra captions/DDHpath.')
(K/'cau-truc-methyl-glucoside-ddh-lo-245-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
