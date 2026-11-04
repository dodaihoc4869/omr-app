"""Nguồn1046: α-fructose ⇌ mạch hở ⇌ β-fructose, đủ H/OH và số carbon."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=dict(next(r for r in json.loads((M/'doc-molecule-lo-169.json').read_text())if r['i']==1046));r.pop('chiLaDuLieuDungChuaSoatRender',None)
def line(d,w=1.7):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def at(x,y,t,size=24,carbon=False):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def ho(x,y):return F.label(x-F.advance('H',24)-F.advance('O',24)/2,y,'HO',24,'start')
def hoch(x,y):return F.label(x-F.advance('HO',24)-F.advance('C',24)/2,y,'HOCH₂',24,'start')
def wedge(p,q):
 x1,y1=p;x2,y2=q;nx,ny=-(y2-y1),x2-x1;ll=math.hypot(nx,ny);nx/=ll;ny/=ll;pts=[(x1+nx*.8,y1+ny*.8),(x2+nx*2.8,y2+ny*2.8),(x2-nx*2.8,y2-ny*2.8),(x1-nx*.8,y1-ny*.8)];return '<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#252440"/>'
b='<g transform="translate(15 15)">'
for dx,dy,beta in [(0,0,False),(695,-2,True)]:
 b+=f'<g transform="translate({dx} {dy})">'+line('M90 229L153 198M179 198L240 229L211 300H127L90 229')+wedge((90,229),(127,300))+line('M127 300H211',5)+wedge((240,229),(211,300))+F.label(166,201,'O',25)
 b+=line('M90 229V194M90 229V258M127 300V259M127 300V337M211 300V259M211 300V337M240 229V198M240 229V264')
 b+=hoch(90,190)+F.label(90,278,'H',24)+F.label(127,253,'H',24)+at(127,359,'OH')+ho(211,253)+F.label(211,359,'H',24)
 if beta:b+=at(240,190,'OH')+at(240,284,'CH₂OH')+F.label(240,305,'1',18)
 else:b+=at(240,192,'CH₂OH')+at(240,288,'OH')+F.label(237,171,'1',18)
 for x,y,t in [(251,232,'2'),(198,323,'3'),(138,324,'4'),(80,234,'5'),(94,172,'6')]:b+=F.label(x,y,t,18)
 b+=F.label(170,392,'dạng β-fructose'if beta else'dạng α-fructose',19)+'</g>'
b+=line('M518 77V373M518 126H570M518 132H570')+F.label(582,138,'O',24)
for y,left,right in [(191,'HO','H'),(255,'H','OH'),(319,'H','OH')]:b+=line(f'M464 {y}H570')+F.label(460,y+8,left,24,'end')+F.label(575,y+8,right,24,'start')
b+=at(518,71,'CH₂OH')+at(518,393,'CH₂OH')
for x,y,t in [(517,50,'1'),(505,135,'2'),(507,187,'3'),(507,251,'4'),(507,316,'5'),(501,390,'6')]:b+=F.label(x,y,t,18)
b+=F.label(532,425,'fructose, mạch hở',19)
for x1,x2 in [(313,395),(639,722)]:b+=line(f'M{x1} 229H{x2}m-6 -5l6 5M{x2} 235H{x1}m6 5l-6 -5',1.4)
b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="485" viewBox="0 0 1120 485"><title>Ba dạng fructose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fructose-can-bang-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3panelsα/open/β/2equilibriumarrowpairs/1..6numbersMỖIpanel/3ringHexplicit/HOCH2leftC6reverse/αC2OHdownCH2OHupvsβOHupCH2OHdown/3frontbold/FischernoCcentertext/C2=O/3captions/noanswer.')
(M/'cau-truc-fructose-can-bang-ddh-lo-176-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
