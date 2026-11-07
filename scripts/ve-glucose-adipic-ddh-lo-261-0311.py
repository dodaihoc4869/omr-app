"""Nguồn745: hai bước chuyển hoá; giữ nguyên hiệu suất và chất trung gian in nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='95710609f02476234ea139f061362ce564de1aedba50b0f54c088a079c0d497d'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,y,t,z in [(101,80,'Glucose',31),(547,80,'HOOC–CH=CH–CH=CH–COOH',31),(1016,80,'Adipic acid',31),(235,63,'enzyme',19),(235,90,'H=80%',19),(859,63,'+H₂',19),(859,90,'H=75%',19)]:b+=F.label(x,y,t,z)
for a,z in [(170,298),(795,924)]:b+=f'<path d="M{a} 70H{z} M{z-9} 62L{z} 70L{z-9} 78" fill="none" stroke="#252440" stroke-width="1.8" stroke-linejoin="round"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1154" height="135" viewBox="0 0 1154 135"><title>Sơ đồ hai bước theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='glucose-adipic-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=745,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Glucose→HOOC-CH=CH-CH=CH-COOH→Adipic acid/2RIGHTarrows/enzymeH=80%/+H2H=75%/literalcase-noaddedanswer-catalyst-formula.')
(K/'cau-truc-glucose-adipic-ddh-lo-261-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
