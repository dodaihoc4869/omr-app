"""Nguồn999: sơ đồ chữ chloroprene, không suy diễn công thức hay hiệu suất."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b3ea0e1e5831d63be8ae31c21236e23d1bab6dedaa07e8ebb6e8c63d1bc19e46';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,y,t in [(98,63,'Acetylene'),(400,63,'vinyl acetylene'),(381,104,'(C₄H₄)'),(720,63,'chloroprene'),(985,52,'cao su'),(990,99,'chloroprene')]:b+=F.label(x,y,t,27 if t=='vinyl acetylene' else 30)
for x1,x2,y in [(194,278,52),(529,612,51),(818,902,50)]:
 b+=f'<path d="M{x1} {y}H{x2} M{x2-10} {y-8}L{x2} {y}L{x2-10} {y+8}" fill="none" stroke="#252440" stroke-width="2.4" stroke-linejoin="round"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1106" height="145" viewBox="0 0 1106 145"><title>Sơ đồ tổng hợp cao su chloroprene theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chloroprene-chu-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=999,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4textnodes6lines/3openVRIGHT/Acetylene→vinyl acetylene(C4H4)→chloroprene→cao su chloroprene/2sub4/regularDDH/case-literal/noaddedformula-condition-yield-answer.')
(K/'cau-truc-chloroprene-chu-ddh-lo-285-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
