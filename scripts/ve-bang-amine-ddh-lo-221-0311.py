"""Nguồn267: giữ nguyên bảng lựa chọn, không sửa bậc amine theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='2d931f4f91072ec53bd61fd0fcfde4d826a551948226ccdfa761ea596a5168ea';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.9):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def first(x,y,t,z=27):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
def last(x,y,t,z=27):return F.label(x+F.advance(t[-1],z)/2,y,t,z,'end')
b=line('M47 52H1169V633H47ZM579 52V633M47 96H1169M47 241H1169M47 437H1169',1.2)
b+=F.label(313,84,'Cột (A)',32,weight='dam')+F.label(874,84,'Cột (B)',32,weight='dam')
b+=F.label(884,178,'a) N-methylbutan-2-amine; amine bậc ba',26)+F.label(874,350,'b) butan-1-amine; amine bậc một',28)+F.label(874,545,'c) benzenamine; amine bậc một',28)
# Ba cấu trúc giữ hướng liên kết và các nhóm được ghi rõ trong nguồn.
b+=line('M249 140L294 112L340 140V196L294 224L249 196ZM294 122L331 145M257 145V191M331 191L294 214M340 140L373 120')+first(388,123,'NH₂')
b+=line('M309 272L328 305H381L407 352L389 384')+last(301,270,'H₂N')+last(381,411,'H₃C')
b+=line('M288 534L308 500H364L384 467M364 500L384 534M384 562L372 582')+last(280,559,'H₃C')+first(391,465,'CH₃')+first(391,559,'NH')+last(365,607,'H₃C')
for x,y,t in [(217,231,'(1)'),(233,425,'(2)'),(208,621,'(3)')]:b+=F.label(x,y,t,30)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1223" height="679" viewBox="0 0 1223 679"><title>Bảng ghép cấu tạo amine theo đề</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='bang-amine-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=267,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3structures/Ph3DOUBLE/NH2-H2N-H3C-CH3-NHliteral/alltablechoices-a-b-c/3numbers/2headersdam/grid/noaddedanswers/nofixaminebậcba/DDHpath.')
(K/'cau-truc-bang-amine-ddh-lo-221-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
