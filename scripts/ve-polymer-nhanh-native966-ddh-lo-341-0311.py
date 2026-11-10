"""Đoạn polymer nguồn966: giữ chữ NH, đầu nét đứt và chân carbonyl riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ad8b00fb9ad10dfa9165393bffff77e2a86b07b5f083f0857b18baa899f12ec8';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
def line(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def label(x,y,t,anchor='start'):
 global b
 b+=F.label(x,y,t,24,anchor=anchor)
for x in [25,97,169,241,313,385,529,601]:label(x,86,'NH')
label(477,86,'N','middle')
for x in [80,224,368,585]:label(x,23,'O','middle')
line('M65 67L80 57.5H83.5L95 65 M209 67L224 57.5H227.5L239 65 M353 67L368 57.5H372L383 65 M569 67L585 57.5H588L600 65')
for left,right,foot in [(76.5,83.5,57),(220.5,227.5,57),(365.5,372,58.5),(581.5,588,58.5)]:
 line(f'M{left} 28V{foot} M{right} 28V58')
line('M137 67L153 58L168 67 M281 67L297 58L312 67 M425 67L441 58L456 67L463 69 M491 69L513 58L528 67')
line('M9 58L13 60 M18 63L22 65 M644 68L649 65 M653 62L659 58')
line('M477 91V118L488 127 M475.5 117.5L477 118 M475.5 117.5L449 132.5 M478.5 123.5L453 138.5')
label(441,149,'O','middle');label(493,149,'NH')
line('M534 129L549 120L572 133');label(577,149,'OH')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="667" height="156" viewBox="0 0 667 156"><title>Đoạn polymer có nhánh theo nguồn966</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polymer-nhanh-native966-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=966,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='10C10N6O/9NH1branchN1OH/4mainCO1branchCO/4mainbareC1branchbareC/2dashesEACH/ALLthinregularupright/CO1-2LEFTnativewhitegap-CO3-4contact-branchinnergap/noaddedCH2-H-bracket-n-caption-answer')
(K/'cau-truc-polymer-nhanh-native966-ddh-lo-341-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
