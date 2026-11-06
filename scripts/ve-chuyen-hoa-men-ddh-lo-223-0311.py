"""Nguồn303: giữ các điều kiện công khai, không giải nhãn X/Y."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='3412a711dbf23e5dae2977be97397bea80996ebc966da459b439bf6e5aedeabb';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.5,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}"/>'
b=F.label(6,69,'CO₂ + H₂O',40,'start')+F.label(454,69,'X',40)+F.label(688,70,'Y',40)+F.label(873,70,'C₂H₅OH',40,'start')
b+=line('M226 52H431M478 56H667M711 56H865')
for x,y in [(431,52),(667,56),(865,56)]:b+=line(f'M{x-18} {y-6}L{x} {y}L{x-18} {y+6}L{x-13} {y}Z',.7,'#252440')
b+=F.label(336,37,'ánh sáng',30)+F.label(334,92,'chất diệp lục',30)+F.label(568,40,'+ H₂O',32)+F.label(571,92,'men amylase',30)+F.label(785,41,'men rượu',30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="113" viewBox="0 0 1024 113"><title>Sơ đồ chuyển hóa theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='chuyen-hoa-men-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=303,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='CO2+H2O→X→Y→C2H5OH/3RIGHTheads/5conditionsliteral/ánh sáng-chất diệp lục/+H2O-menamylase/menrượu/allsubscripts/noanswer-noextraO2/DDHpath.')
(K/'cau-truc-chuyen-hoa-men-ddh-lo-223-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
