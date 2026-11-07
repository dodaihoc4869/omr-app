"""Nguồn720: đoạn mạch có ba cặp ngoặc, giữ nhãn và hướng nhánh nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1407a116ec16210715dc272ed2f7bed1ba9436dfde6e6beb9e642445efaeed04'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2):return f'<path d="{d}" stroke="#252440" stroke-width="{w}" fill="none" stroke-linejoin="round"/>'
b='';centres=[]
for x,t in [(75,'CH₂'),(158,'CH'),(258,'CH₂'),(344,'CH'),(423,'CH'),(498,'CH₂'),(596,'CH₂'),(680,'CH')]:
 b+=F.label(x,99,t,28,'start');centres.append(x+F.advance('C',28)/2)
b+=line('M48 89H72 M130 89H154 M200 89H254 M313 89H338 M393 86H418 M393 93H418 M472 89H494 M552 89H592 M650 89H676 M729 89H775')
x=centres[1];b+=line(f'M{x} 106V130')+F.label(x+13,158,'CN',28)
x=centres[7];b+=line(f'M{x} 106V130 M{x} 130L{x+32} 148V184L{x} 202L{x-32} 184V148Z M{x+27} 151V181 M{x} 196L{x-26} 181 M{x-26} 151L{x} 136',1.8)
b+=line('M73 47C50 81 54 121 72 154 M213 49C233 78 233 126 214 154 M258 53C238 70 236 100 254 124 M554 62C576 86 575 110 563 131 M603 55C582 95 582 155 595 203 M737 59C758 100 763 159 741 205',1.8)
for x,y,t in [(229,159,'a'),(574,138,'b'),(758,212,'c')]:b+=F.label(x,y,t,17)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="820" height="254" viewBox="0 0 820 254"><title>Đoạn mạch ba nhóm theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-ba-doan-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=720,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='8backboneC/4CH2+4CH/1CCdouble/middleCH=CH/branchCNdown+phenyl6C3doubleDown/3roundpairs+abcsub/noextra n-answer-caption.')
(K/'cau-truc-polymer-ba-doan-ddh-lo-256-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
