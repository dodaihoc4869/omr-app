"""Ba vòng chéo nguồn977: ngoặc gồm vòng giữa và O cầu bên phải, số 7 000."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='aede1db1caa28087c17bc5e0155f008635da32df9a284d253b59c8b6ed6797d7';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.5):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def first(x,y,t,z=24):return F.label(x-F.advance(t[0],z)/2,y,t,z,anchor='start')
def taper(a,z):return f'<path d="M{a[0]} {a[1]}L{z[0]} {z[1]+3}L{z[0]} {z[1]-3}Z" fill="#252440"/>'
def ring(x,y,left=False,right=False):
 b=f'<g transform="translate({x} {y})">'+line('M-40 40L0 0H46 M70 11L97 40')+F.label(58,8,'O',24)
 b+=taper((-40,40),(0,80))+line('M0 80H57',6)+taper((97,40),(57,80))
 b+=line('M0 0V-21 M0 0V17 M-40 40V14 M97 40V68 M0 80V62 M0 80V102 M57 80V61 M57 80V102')
 b+=first(0,-25,'CH₂OH')+F.label(0,36,'H',22)+F.label(-40,9,'H',22)+F.label(97,91,'H',22)+first(0,56,'OH')+F.label(0,123,'H',22)+F.label(57,53,'H',22)+first(57,123,'OH')
 if left:b+=line('M-40 40V68')+first(-40,91,'OH')
 if right:b+=line('M97 40V17')+first(97,9,'OH')
 return b+'</g>'
b=ring(64,181,left=True)+ring(299,116)+ring(533,51,right=True)
b+=line('M161 221L198 197 M220 179L259 156 M396 156L433 132 M455 115L493 91')+F.label(209,197,'O',24)+F.label(444,132,'O',24)
b+=line('M246 62H235V245H246 M464 62H474V245H464')+F.label(481,251,'7 000',16,anchor='start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="691" height="309" viewBox="0 0 691 309"><title>Ba vòng carbohydrate xếp chéo theo nguồn977</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ba-vong-cheo-native977-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=977,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='18C16O15H8freeOH3CH2OH/3ringO2bridgeO/6TAPER3boldfront6px-verticalfeet/ALLregularupright/leftOHdown-rightOHup/1SQUAREpairincludesMIDDLEplusRIGHTbridgeO-excludesLEFTbridgeO/literal7 000SPACE/noaddedname-n-carbonnums-answer-noalias265-506')
(K/'cau-truc-ba-vong-cheo-native977-ddh-lo-342-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
