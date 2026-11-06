"""Nguồn176: phản ứng theo đúng nhãn in, không sửa thứ tự OOCCH₃ theo lý thuyết."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='1e4c07809750802525d6d91583a40f7ea072e611dec648e2c579f1a799d93021';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,w=2.7):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def label(x,y,t,z=33,a='middle'):return F.label(x,y,t,z,a)
def first(x,y,t,z=33):return F.label(x-F.advance(t[0],z)/2,y,t,z,'start')
b=path('M8 122L57 94L106 121V177L57 205L8 177Z M742 112L791 85L841 112V168L792 196L742 168Z')
b+='<circle cx="57" cy="150" r="27" fill="none" stroke="#252440" stroke-width="2.7"/><circle cx="792" cy="141" r="27" fill="none" stroke="#252440" stroke-width="2.7"/>'
b+=path('M57 94V57M106 121L143 100M791 85V49M841 112L878 91')
b+=first(57,45,'OOCCH₃')+label(148,100,'COOH',33,'start')+first(791,36,'OH')+label(884,91,'COOH',33,'start')
b+=label(324,145,'+')+label(369,148,'H₂O',33,'start')+label(1044,140,'+')+label(1082,145,'CH₃COOH',33,'start')
b+=path('M519 136H642L634 127M643 146H519L528 155',1.8)
b+=label(564,130,'H',18)+label(574,122,'+',11)+label(582,130,',',18)+label(598,130,'t°',18)
b+=label(103,266,'Aspirin',33)+label(807,266,'Salicylic acid',33)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1300" height="290" viewBox="0 0 1300 290"><title>Phản ứng aspirin theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aspirin-phan-ung-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=176,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2orthohexagons2aromaticcircles/OOCCH3literal-C2O2/2COOH/OH/+H2O⇌CH3COOH/Hsup+-t°/2captionsAspirin-Salicylicacid/noextra-byproducts-charges/DDHpath.');(K/'cau-truc-aspirin-phan-ung-ddh-lo-215-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
