"""Nguồn13: fructose với bốn mũi tên, giữ nhãn và đầu mũi tên literal."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='01ece4fc016efadb4afb6af1d3160e9c21da3102418c9b65ae813f01480e20ed';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=30):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*5} {v+ny*5}L{u-nx*5} {v-ny*5}Z" fill="#252440"/>'
def arrow(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);dx=(u-x)/ll;dy=(v-y)/ll;nx=-dy;ny=dx;return line(f'M{x} {y}L{u} {v}',1.6)+'<path d="M'+f'{u} {v}L{u-dx*11+nx*3} {v-dy*11+ny*3}L{u-dx*11-nx*3} {v-dy*11-ny*3}Z" fill="#252440"/>'
b=line('M93 125L186 96M218 96L314 125')+F.label(204,100,'O',30)+wedge((93,125),(134,180))+line('M134 180L271 182',7)+wedge((314,125),(271,182))
b+=line('M93 125V98M93 125V146M134 180V151M134 180V208M271 182V151M271 182V207M314 125V103M314 125V151')+first(93,91,'CH₂OH')+F.label(93,171,'H',30)+F.label(134,150,'H',30)+first(134,233,'OH')+F.label(271-F.advance('H',30)-F.advance('O',30)/2,153,'HO',30,'start')+F.label(271,233,'H',30)+first(314,92,'CH₂OH')+first(314,177,'OH')
b+=arrow((374,211),(324,181))+arrow((275,62),(275,122))+arrow((55,194),(115,209))+arrow((406,162),(390,105))
for x,y,t in [(383,226,'1'),(275,58,'2'),(43,202,'3'),(410,181,'4')]:b+=F.label(x,y,t,30,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="480" height="275" viewBox="0 0 480 275"><title>Vòng fructose có bốn mũi tên theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='fructose-bon-mui-ten-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=13,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5ring/Otop/2CH2OH/all3H/HO-C3up-OH-C4down/C2OHdownCH2OHup/2taper+horizontalbold/4arrowslabelsdam1..4NOTCnumbers/arrow2bondO-C2literal/noCaption/DDHpath.');(K/'cau-truc-fructose-bon-mui-ten-ddh-lo-192-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
