"""Nguồn913: giữ ba công thức R thu gọn và chú thích sodium stearate trên cùng dòng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a69caf8ed6c927cbdb21bdbfcdc4310e4e626db23ebc68d03a014db2748941cb';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<path d="M249 86H377 M367 79L377 86L367 94 M523 86H657 M647 79L657 86L647 94" fill="none" stroke="#252440" stroke-width="2"/>'
for x,t in [(50,'R-CH₂-CH₂-R'),(383,'R-COOH'),(671,'R-COONa'),(818,'(sodium stearate)')]:b+=F.label(x,95,t,28,'start')
for x,t,n in [(313,'+ O₂ /xt','(1)'),(590,'+ NaOH','(2)')]:b+=F.label(x,79,t,21)+F.label(x,110,'-H₂O',21)+F.label(x,143,n,24)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1082" height="195" viewBox="0 0 1082 195"><title>Sơ đồ chuyển hóa hydrocarbon theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='hydrocarbon-xa-phong-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=913,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3condensedRformulasR-CH2-CH2-R→R-COOH→R-COONa/2RIGHTopenVheads/+O2slashxt/+NaOH/2minusH2O/indices1-2/inline(sodium stearate)regularcase/noaddedRvalue-expandedbonds-temp-phase-yield-answer.')
(K/'cau-truc-hydrocarbon-xa-phong-ddh-lo-279-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
