"""Nguồn198: giữ công thức và nhãn sơ đồ công khai, không giải sản phẩm."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='217e990bbf1a2d2aaf4e51e61b533c23a213317b15db20293a124de516fc7e70';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2,fill='none'):return f'<path d="{d}" fill="{fill}" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=28,a='middle'):return F.label(x,y,t,z,a)
b=label(34,167,'Saccharose',28,'start')
b+=path('M194 159H389M389 86V239M389 86H437M389 239H438M480 86H699M482 241H699')
for x,y in [(437,86),(438,239),(699,86),(699,241)]:b+=path(f'M{x-18} {y-6}L{x} {y}L{x-18} {y+6}L{x-14} {y}Z',1,'#252440')
b+=label(283,140,'+ H₂O, H⁺, t⁰',27)+label(459,94,'X',29)+label(457,249,'Y',29)+label(728,87,'T',29)+label(724,251,'Z',29)
b+=label(576,63,'+ AgNO₃/NH₃',28)+label(583,227,'+ Br₂ + H₂O',28)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="773" height="295" viewBox="0 0 773 295"><title>Sơ đồ phản ứng saccharose theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='saccharose-so-do-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=198,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Saccharose→nhánhX/Y→T/Z/4RIGHTheads/H2O-Hsup+-tsup0/+AgNO3/NH3/+Br2+H2O/không giải X-Y-Z-T/DDHpath.')
(K/'cau-truc-saccharose-so-do-ddh-lo-216-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
