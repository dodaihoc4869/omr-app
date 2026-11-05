"""Nguồn36: ống phóng điện và mạch nguồn, giữ cực/nhãn/tia nguyên ảnh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='0730f7837bde8a5f413205fe4ca422ad495c4bc8a2da8a01b9aca5ef493427f7';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def path(d,fill='none',stroke='#41443b',w=2):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{w}" stroke-linejoin="round"/>'
b='<defs><linearGradient id="gas" x2="0" y2="1"><stop stop-color="#fff5b5"/><stop offset="1" stop-color="#fff0a5"/></linearGradient></defs>'
b+=path('M184 90H442C467 90 487 110 487 134S467 178 442 178H184C159 178 139 158 139 134S159 90 184 90Z','url(#gas)','#4f5144',2.5)
b+=path('M203 132H106V259H297V277M429 132H525V259H333V277',w=2.5)+path('M203 104V165M429 104V165',w=2.8)
for y in [124,134,144]:b+=path(f'M209 {y}H421',stroke='#969785',w=1.3)+path(f'M421 {y}l-9 -3v6Z','#777b72','none')
b+=F.label(128,134,'−',31,weight='dam')+F.label(500,129,'+',30,fill='#85232a',weight='dam')+'<rect x="280" y="277" width="65" height="34" fill="#a42635" stroke="#41443b" stroke-width="2"/>'+F.label(299,306,'−',28,fill='#f8f5dc',weight='dam')+F.label(327,306,'+',28,fill='#f8f5dc',weight='dam')
b+=F.label(55,64,'Ống phóng điện',25,'start')+path('M150 79L178 90',stroke='#9b9b86',w=1.2)+F.label(125,221,'Cực âm',25,'start')+path('M148 187L201 146',stroke='#7d8070',w=1.3)+F.label(397,214,'Cực dương',22,'start')+path('M466 184L430 151',stroke='#7d8070',w=1.3)+F.label(69,310,'Hiệu điện thế cao',22,'start')+path('M266 299L280 294',stroke='#9b9b86',w=1.2)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="365" viewBox="0 0 600 365"><title>Ống phóng điện theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ong-phong-dien-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=36,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='Capsuleyellow/2electrodes/3raysRIGHT/−LEFT+RIGHT/sourceboxred−LEFT+RIGHT/2wires/4labelsleaders/noelectrondots/noVnumber/DDHpath.');(K/'cau-truc-ong-phong-dien-ddh-lo-194-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
