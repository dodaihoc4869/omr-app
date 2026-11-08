"""Nguồn866: bình điện phân, ống khí hở và dây điện là hai nét riêng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='9da19abcde1f9c707fd1cd0b5cdfe5ca10aec06e9d7f3632f6b0ef3e2c39362b';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round"/>'
b='<g transform="translate(20 20)">'+line('M178 174V412H402V174 M178 197H402 M320 279V132C320 115 332 102 348 102C364 102 377 115 377 132V136H399 M399 149H377V279 M215 134V71H253 M316 71H348V134')
b+='<rect x="253" y="53" width="63" height="36" fill="white" stroke="#252440" stroke-width="1.8"/>'
for x in [204,337]:b+=f'<rect x="{x}" y="134" width="23" height="246" fill="white" stroke="#252440" stroke-width="1.8"/><rect x="{x+3}" y="137" width="17" height="240" fill="#a8a8a8"/>'
b+=line('M137 269H202 M429 287H361 M431 143H404')
b+='<path d="M204 269L198 266L198 272Z M360 287L366 284L366 290Z M402 143L412 138L412 148Z" fill="#252440"/>'
b+=F.label(285,76,'Nguồn',18)+F.label(239,65,'+',18)+F.label(332,65,'−',18)+F.label(438,151,'CO₂(g)',18,'start')+F.label(285,402,'NaHCO₃(aq)',18)
for x,y,t in [(49,262,'Điện cực'),(49,289,'graphite'),(438,285,'Điện cực'),(438,311,'Cu-Zn')]:b+=F.label(x,y,t,20,'start')
b+='</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="605" height="505" viewBox="0 0 605 505"><title>Bình điện phân khí carbon dioxide theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dien-phan-co2-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=866,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2graybars/outeropenbeaker+liquidlevel/openbottomgascollector2sideportends/wireseparatecrossarch/Nguồn+LEFT−RIGHT/CO2(g)LEFTarrow/NaHCO3(aq)/Điện cực graphite-Cu-Zn/2leaderheads/noaddedcharge-gasproducts-voltage-ticks-answer.')
(K/'cau-truc-dien-phan-co2-ddh-lo-275-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(fn)
