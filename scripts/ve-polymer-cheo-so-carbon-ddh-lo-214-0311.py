"""Nguồn160: ba vòng Haworth chéo với đầy đủ số carbon, không thêm tên chất."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1b842e1ee8d68bf8b6db65b3778f23f06a269e5aafd0fdd9d782e2d0c29060a4';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=1.9):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=27,a='middle'):return F.label(x,y,t,z,a)
def first(x,y,t,z=27):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def ring(dx,dy):
 b=f'<g transform="translate({dx} {dy})">'+path('M151 316L205 262H266M293 274L335 316')+label(280,274,'O')
 b+=path('M151 316L205 369M335 316L281 369',2.4)+path('M205 369H281',5)
 b+=path('M205 262V234M205 262V286M151 316V277M205 369V343M205 369V402M281 369V343M281 369V402M335 316V359')
 b+=first(205,225,'CH₂OH')+label(205,307,'H')+label(151,272,'H')+first(205,337,'OH')+label(205,425,'H')+label(281,338,'H')+first(281,425,'OH')+label(335,385,'H')
 for x,y,t in [(335,304,'1'),(297,391,'2'),(192,391,'3'),(139,313,'4'),(192,260,'5'),(207,202,'6')]:b+=label(x,y,t,20)
 return b+'</g>'
b=ring(0,0)+ring(316,-88)+ring(632,-180)
b+=path('M99 359L151 316M335 316L382 279M417 258L467 228M651 228L699 190M731 173L783 136M967 136L1015 98')
b+=label(81,373,'O')+label(400,281,'O')+label(715,191,'O')+label(1031,103,'O')+label(43,374,'...',27,'start')+label(1051,103,'...',27,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="450" viewBox="0 0 1120 450"><title>Ba vòng có số carbon theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-cheo-so-carbon-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=160,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3diagonalHaworth/18Cnums/15H/allOH-CH2OH/3ringO2bridge2terminalO/2ellipsis/normalfrontdiagonals3horizontalbold/noCaption/DDHpath.');(K/'cau-truc-polymer-cheo-so-carbon-ddh-lo-214-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
