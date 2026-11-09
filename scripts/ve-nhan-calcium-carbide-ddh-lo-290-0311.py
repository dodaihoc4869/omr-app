"""Vẽ nhãn sơ đồ phẳng nguồn1143; không thay ảnh bao bì chụp."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ce5cb5f2f7a9590058db69468bde17dfd8083a5f392f47694d7bc9e33685bd2b';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='<rect x="36" y="35" width="648" height="267" fill="#f2f2f2" stroke="#252440" stroke-width="3"/><rect x="41" y="40" width="638" height="257" fill="none" stroke="#252440" stroke-width="1.5"/>'
for x,y,t,z,a in [(51,116,'Calcium carbide',29,'start'),(618,116,'CaC₂',29,'end'),(618,157,'64,10 g/mol',29,'end'),(51,197,'Độ tinh khiết: 99%',29,'start'),(51,237,'Chất dễ cháy, nguy hiểm',29,'start')]:b+=F.label(x,y,t,z,anchor=a)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="723" height="337" viewBox="0 0 723 337"><title>Nhãn calcium carbide theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nhan-calcium-carbide-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=1143,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Flat drawn label independently confirmed by root nativeFULL; 2rectangles/grayfill/5regulartextnodes4rows/CaCsub2/64,10 g/mol/Độ tinh khiết: 99%/Chất dễ cháy, nguy hiểm/noaddedhazardicon-bottle-reaction-answer.')
(K/'cau-truc-nhan-calcium-carbide-ddh-lo-290-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
