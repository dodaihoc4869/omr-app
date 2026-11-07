"""Nguồn743: sơ đồ ba phản ứng, không điền chất X hoặc đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1907b3ca18d038df6af92575879dd5d9989ff81027648aaf78b78934c0b18ce9'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=F.label(71,79,'HC',31)+F.label(150,79,'CH',31)+'<path d="M102 65H119 M102 70H119 M102 75H119" stroke="#252440" stroke-width="1.8"/>'
for x,y,t,z in [(365,79,'X',31),(550,79,'PVAc',31),(791,79,'PVA',31),(263,63,'+CH₃COOH',19),(444,63,'xt,t°,p',19),(674,63,'+NaOH, t°',19),(263,89,'(1)',18),(444,89,'(2)',18),(674,89,'(3)',18)]:b+=F.label(x,y,t,z)
for a,z in [(179,347),(382,504),(595,751)]:b+=f'<path d="M{a} 70H{z} M{z-8} 62L{z} 70L{z-8} 78" fill="none" stroke="#252440" stroke-width="1.8" stroke-linejoin="round"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="887" height="135" viewBox="0 0 887 135"><title>Sơ đồ ba phản ứng theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='pvac-pva-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=743,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='HC≡CH→X→PVAc→PVA/3RIGHTheads/3numberlabels/conditions+CH3COOH;xt,t°,p;+NaOH,t°/casePVAc/noaddedformulaX-answer.')
(K/'cau-truc-pvac-pva-ddh-lo-261-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
