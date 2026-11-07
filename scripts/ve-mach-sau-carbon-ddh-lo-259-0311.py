"""Nguồn738: đoạn mạch có sáu C, giữ từng H và CH3 được in tường minh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='6edf378c49a1fe9c9aa57b402686a4b9a7fe6c5bf00b2bf48098fe3b3ece82d2'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
b='';xs=[140,222,304,386,468,550]
for j,x in enumerate(xs):
 b+=F.label(x,122,'C',29)+F.label(x,183,'H',29)
 b+=f'<path d="M{x} 66V96 M{x} 128V158" fill="none" stroke="#252440" stroke-width="2"/>'
 if j%2==0:b+=F.label(x,61,'H',29)
 else:b+=F.label(x-F.advance('C',29)/2,61,'CH₃',29,'start')
for a,z in [(58,124),(155,206),(237,288),(319,370),(401,452),(483,534),(565,631)]:b+=f'<path d="M{a} 113H{z}" fill="none" stroke="#252440" stroke-width="2"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="695" height="218" viewBox="0 0 695 218"><title>Đoạn mạch theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='mach-sau-carbon-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=738,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='6explicitbackboneC/3topH+3topCH3alternatingstartingH/6bottomH/12verticalbonds7horizontalincl2freeends/noextra bracket-n-caption-answer.')
(K/'cau-truc-mach-sau-carbon-ddh-lo-259-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
