"""Nguồn846: bốnliênkếtđơn thường, giữCltrái/NH3phải, khôngápnêmnguồnkhác."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9b5c68d0710927a02185c1588bdb14e533618c6ce73f6458156d5f36ed0aedd3';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<g transform="translate(20 20)"><path d="M82 65L143 114 M172 114L229 63 M83 190L143 138 M172 138L230 189" fill="none" stroke="#252440" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
b+=F.label(158,136,'Pt',30)+F.label(45,77,'Cl',34,'start')+F.label(45,203,'Cl',34,'start')+F.label(231,72,'NH₃',32,'start')+F.label(231,200,'NH₃',32,'start')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="377" height="288" viewBox="0 0 377 288"><title>Phức theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phuc-pt-cl-nh3-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=846,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='1Pt2Cl2N6H/4SINGLEthinuniformdiagonal/2ClLEFT2NH3RIGHT/Nanchors-NOT-H-or3/no-wedge-dash-bracket-charge-caption-arrow-answer.')
(K/'cau-truc-phuc-pt-cl-nh3-ddh-lo-271-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
