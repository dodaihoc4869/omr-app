"""Nguồn687: bốn phản ứng và vị trí ký hiệu nguyên văn, không tự sửa phân loại."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='7f532a0f9678b09f0935ab441ce927eca11d555ed657f5faee2387546a199923'
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh'] if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.7):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def arrow(x,y,end,bold=False):
 return line(f'M{x} {y}H{end-5}',2.5 if bold else 1.7)+(f'<path d="M{end} {y}L{end-18} {y-6}L{end-14} {y}L{end-18} {y+6}Z" fill="#252440"/>' if bold else line(f'M{end-9} {y-7}L{end} {y}L{end-9} {y+7}'))
b=arrow(235,31,335)+arrow(309,68,338)+arrow(273,143,387,True)+arrow(202,325,306)
for x,y,t in [(5,38,'(1)'),(52,38,'CH₄'),(126,38,'+'),(171,38,'Cl₂'),(358,38,'CH₃Cl'),(466,38,'+'),(499,38,'HCl'),(5,78,'(2)'),(52,78,'CH₂=CH₂'),(205,78,'+'),(246,78,'Br₂'),(358,78,'CH₂Br-CH₂Br'),(105,152,'n CH₂=CH₂'),(438,154,'CH₂–CH₂'),(5,249,'(3)'),(5,333,'(4)'),(65,333,'CH₃-CH₃'),(310,333,'CH₂=CH₂'),(465,333,'+'),(491,333,'H₂')]:b+=F.label(x,y,t,30,'start')
b+=F.label(285,25,'askt',18)
b+=F.label(264,126,'t',28,'start')+F.label(280,109,'0',18)+F.label(284,126,', xt, p',28,'start')
b+=F.label(235,313,'t',18,'start')+F.label(247,302,'0',12)+F.label(252,313,',xt',18,'start')
b+=line('M405 145H438 M581 145H607 M430 119Q410 145 430 179 M590 119Q609 145 590 178')+F.label(605,180,'n',26)
b+=F.label(100,204,'ethylene',30,'start')+F.label(410,230,'polyethylene (PE)',24.6,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="634" height="385" viewBox="0 0 634 385"><title>Bốn phản ứng theo nguồn</title>'+b+'</svg>').encode()
hh=hashlib.sha256(raw).hexdigest();fn='bon-phan-ung-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=687,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4reactions4RIGHTheads/askt/tSUP0-xt-p/tSUP0-xt/ethylene-polyethylene(PE)/parenthesesnsub/literal(3)BELOWLEFT/noextra coefficients-conditions-answer/DDHpath.')
(K/'cau-truc-bon-phan-ung-ddh-lo-252-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
