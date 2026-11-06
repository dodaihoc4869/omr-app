"""Nguồn385: alpha, mạch hở, beta fructose; giữ nguyên nhãn và hướng các nhóm."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='44cf15f355c45359262f7c1322b572524c9660b5fa8bef7a2c599304b26752f2';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=24):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
def c_anchor(x,y,t='HOCH₂',z=24):return F.label(x-F.advance('HO',z)-F.advance('C',z)/2,y,t,z,'start')
def taper(p,q):
 dx=q[0]-p[0];dy=q[1]-p[1];n=math.hypot(dx,dy);ux=-dy/n;uy=dx/n
 pts=[(p[0]+ux*.8,p[1]+uy*.8),(q[0]+ux*3,q[1]+uy*3),(q[0]-ux*3,q[1]-uy*3),(p[0]-ux*.8,p[1]-uy*.8)]
 return '<path d="M'+'L'.join(f'{a:.3f} {b:.3f}'for a,b in pts)+'Z" fill="#252440"/>'
b=''
for sh in [0,724]:
 b+='<g transform="translate('+str(sh)+' 0)">'
 b+=line('M64 207L132 174M155 174L220 207M64 207V170M64 207V239M103 282V239M103 282V322M190 282V239M190 282V323')
 b+=taper((64,207),(103,282))+taper((220,207),(190,282))+line('M103 282H190',6)
 b+=F.label(144,179,'O',24)+c_anchor(64,163)+F.label(64,261,'H',24)+F.label(103,235,'H',24)+first(103,345,'OH')+last(190,233,'HO')+F.label(190,345,'H',24)
 if sh==0:b+=line('M220 207V178M220 207V248')+first(220,171,'CH₂OH')+first(220,268,'OH')
 else:b+=line('M220 207V174M220 207V242')+first(220,167,'OH')+first(220,264,'CH₂OH')
 for x,y,t in [(67,142,'6'),(54,215,'5'),(115,306,'4'),(180,306,'3'),(232,210,'2')]:b+=F.label(x,y,t,18)
 b+=F.label(219,148,'1',18) if sh==0 else F.label(220,284,'1',18)
 b+='</g>'
b+=line('M510 49V356M510 101H565M510 109H565M454 169H565M454 235H565M454 302H565')
b+=first(510,45,'CH₂OH')+first(510,378,'CH₂OH')+F.label(577,114,'O',24)
b+=last(440,178,'HO')+F.label(577,178,'H',24)
for y in [235,302]:b+=F.label(442,y+10,'H',24)+first(577,y+10,'OH')
for x,y,t in [(510,22,'1'),(497,111,'2'),(499,166,'3'),(499,232,'4'),(499,299,'5'),(493,378,'6')]:b+=F.label(x,y,t,18)
for x in [298,637]:b+=line(f'M{x} 209H{x+85}l-6-6M{x+85} 215H{x}l6 6',1.2)
b+=F.label(139,377,'dạng α-fructose',18)+F.label(523,411,'fructose, mạch hở',18)+F.label(888,373,'dạng β-fructose',18)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="422" viewBox="0 0 1024 422"><title>Ba dạng fructose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fructose-ba-dang-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=385,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='alpha-open-beta/18Cnums9standaloneH/6terminalCH2OHgroupsinclHOCH2/18O/4TAPER2bold/2equilibriumpairs/3captionsGreek-DDHpath/noaddedH-carbonyl-answer.')
(K/'cau-truc-fructose-ba-dang-ddh-lo-230-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
