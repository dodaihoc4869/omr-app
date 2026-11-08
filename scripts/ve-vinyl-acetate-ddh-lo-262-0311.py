"""Nguồn744: giữ nguyên sơ đồ và hai dấu ngoặc đóng ở tên polymer."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='c6a70f48a7fbe7978f2dd31ac46bd998ea13255e5bf205858bd68cc9538833aa'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b=''
for x,y,t,z in [(120,81,'CH₂ = CH₂',31),(414,81,'CH₃COOH',31),(851,81,'CH₃COOCH = CH₂',31),(1235,81,'Poly(vinyl acetate))',30),(267,65,'+O₂/xt, t°',18),(606,65,'+O₂+CH₂=CH₂/xt, t°',18),(1029,65,'xt, t°',18),(267,94,'(1)',18),(606,94,'(2)',18),(1029,94,'(3)',18)]:b+=F.label(x,y,t,z)
for a,z in [(198,338),(490,710),(981,1079)]:b+=f'<path d="M{a} 73H{z} M{z-8} 65L{z} 73L{z-8} 81" fill="none" stroke="#252440" stroke-width="1.8" stroke-linejoin="round"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1395" height="140" viewBox="0 0 1395 140"><title>Sơ đồ tổng hợp theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='vinyl-acetate-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=744,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='CH2=CH2→CH3COOH→CH3COOCH=CH2→Poly(vinyl acetate)); giữ hai ngoặc đóng nguyên bản/3RIGHTheads/3nums/conditionsliteral/noanswer.')
(K/'cau-truc-vinyl-acetate-ddh-lo-262-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
