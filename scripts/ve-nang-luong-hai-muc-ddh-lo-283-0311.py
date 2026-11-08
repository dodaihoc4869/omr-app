"""Nguồn963: hai mức năng lượng tách rời, không thêm đường nối hay đáp án."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ad3cef1274df18a25b1c25e52253c784b9fa972d4a17e7d736ebfa012cc4f887';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=2.6):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b=line('M78 49V349H529 M70 64L78 44L86 64 M510 341L532 349L510 357 M78 119H287 M360 291H535',2.8)
b+=F.label(184,99,'C₆H₁₂O₆ + O₂',28,weight='dam')+F.label(447,277,'Sản phẩm',26,weight='dam')+F.label(447,327,'CO₂ + H₂O',27,weight='dam')+F.label(418,388,'Tiến trình phản ứng',24,weight='dam')
b+='<g transform="translate(62 210) rotate(-90)">'+F.label(0,0,'Năng lượng hoá học',24,weight='dam')+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="587" height="434" viewBox="0 0 587 434"><title>Sơ đồ năng lượng hoá học theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nang-luong-hai-muc-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=963,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2separatehorizontallevels/2openVaxisheads/NOcurve-stepconnector/5actualdamlabelblocks/C6H12O6+O2TOP/CO2+H2OBOTTOM/Sảnphẩm/Nănglượnghoáhọc/Tiếntrìnhphảnứng/noadded0-ticks-units-deltaH-answer.')
(K/'cau-truc-nang-luong-hai-muc-ddh-lo-283-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
