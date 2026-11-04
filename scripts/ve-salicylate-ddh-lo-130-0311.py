"""Hai nguồn ester hoá ortho được mở riêng; giữ vòng 3 đôi và H+ trên cân bằng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
def p(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
def lab(x,y,t,n=27,a='start'):return F.label(x,y,t,n,a)
b=''
for dx,ester in [(0,False),(605,True)]:
 b+=f'<g transform="translate({dx} 0)">'+p('M65 110L105 85L145 110V160L105 185L65 160Z')+p('M73 115V155M108 94L137 112M137 157L108 175')
 b+=p('M145 110L185 85M181 85V49M189 85V49M185 85L211 100M145 160L170 175')+lab(185,42,'O',27,'middle')+lab(175,197,'OH')
 if ester:b+=lab(218,120,'O')+p('M242 99L255 91')+lab(259,96,'CH₃')
 else:b+=lab(216,120,'OH')
 b+='</g>'
b+=lab(308,150,'+',33,'middle')+lab(350,153,'CH₃OH')+lab(544,105,'H⁺',26,'middle')
b+=p('M489 134H590M489 147H590')+'<path d="M590 134L577 129L580 134Z M489 147L502 152L499 147Z" fill="#252440"/>'
b+=lab(962,150,'+',33,'middle')+lab(1000,153,'H₂O')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1110" height="260" viewBox="0 0 1110 260"><title>Ester hoá salicylic acid với methanol</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='salicylate-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
j=json.loads((M/'doc-molecule-lo-130.json').read_text());rows=[]
for r in j:
 if r['i'] in [1393,264]:rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='Hai vòng ortho với3đôi KHÔNGcircle;OHphenol/C=Otrên/OHhoặcOCH3;CH3OH⇌/H+/H2O. Mỗi nguồn cần soát riêng dù dùng chung SVG.'))
(M/'cau-truc-salicylate-ddh-lo-130-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
