"""Nguồn590: ba vòng ghế cellulose literal, khép bộ amylose/cellulose."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6e0ca319b0c0ee2547a3924a380ebc68c7c43a5ea478434000bc37fd9353f252';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,size=26):return F.label(x-F.advance(t[0],size)/2,y,t,size,'start')
def wedge(p,q):
 x,y=p;u,v=q;ll=math.hypot(u-x,v-y);nx=-(v-y)/ll;ny=(u-x)/ll;return '<path d="M'+f'{x} {y}L{u+nx*4} {v+ny*4}L{u-nx*4} {v-ny*4}Z" fill="#252440"/>'
b=''
for dx in [0,236,470]:
 b+=f'<g transform="translate({dx} 0)">'+line('M72 70L142 86L190 74M142 86L107 69V62')+F.label(204,82,'O',26)+wedge((72,70),(102,121))+line('M102 121L147 107L185 122',6)+wedge((205,87),(185,122))
 b+=line('M102 121H89M185 122V142')+F.label(88,128,'HO',26,'end')+first(185,167,'OH')+first(106,59,'CH₂OH',28)+'</g>'
b+=line('M43 99L72 70M220 76L248 95M275 95L308 70M456 76L484 95M511 95L542 70M690 76L714 96')+F.label(260,112,'O',26)+F.label(496,112,'O',26)+F.label(27,113,'…',26)+F.label(726,113,'…',26)+F.label(386,209,'Phân tử cellulose',27)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="770" height="240" viewBox="0 0 770 240"><title>Phân tử cellulose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='cellulose-ba-ghe-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=590,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3chairrings/3CH2OHbentCfirst/3HO+3OH/3ringO+2bridgeO/6taper+6lowerbold/ellipsis2ends/caption/noHnumbersadded/sourceupperO-stubconnectivityliteral/notfiniteSMILES/printcornerexcluded.');(K/'cau-truc-cellulose-ba-ghe-ddh-lo-196-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
