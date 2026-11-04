"""Giữ hai lộ trình và kiểu vòng khác nhau; NH3Cl literal không tự thêm điện tích."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-molecule-lo-139.json').read_text());rows=[]
def p(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
def lab(x,y,t,n=28,anchor='middle'):return F.label(x,y,t,n,anchor)
def ring(cx,circle):
 b=p(f'M{cx} 100L{cx+44} 125V175L{cx} 200L{cx-44} 175V125Z')
 if circle:b+=f'<circle cx="{cx}" cy="150" r="33" fill="none" stroke="#252440" stroke-width="2.2"/>'
 else:b+=p(f'M{cx+35} 130V170M{cx-3} 189L{cx-35} 171M{cx-35} 129L{cx-3} 111')
 return b
def arrow(x,xx):return p(f'M{x} 150H{xx}')+f'<path d="M{xx} 150L{xx-14} 145L{xx-11} 150L{xx-14} 155Z" fill="#252440"/>'
for r in a:
 if r['i']not in[984,1292]:continue
 b=''
 if r['i']==984:
  w=1560
  for cx,group in[(80,None),(360,'NO₂'),(860,'NH₃Cl'),(1360,'NH₂')]:
   b+=ring(cx,False)
   if group:b+=p(f'M{cx+44} 125L{cx+71} 110')+lab(cx+76,115,group,28,'start')
  b+=arrow(145,290)+arrow(565,785)+arrow(1110,1285)+lab(675,126,'Zn + HCl(aq)',27)+lab(1197,126,'NaOH(aq)',27)
 else:
  w=1360
  for cx,group in[(80,None),(670,'NO₂'),(1260,'NH₂')]:
   b+=ring(cx,True)
   if group:b+=p(f'M{cx} 100V65')+lab(cx,55,group)
  b+=arrow(180,570)+arrow(790,1150)+lab(375,126,'+ HNO₃ đặc')+lab(970,126,'+ Fe/HCl')
  # Superscript zero is set with the app's Latin 0 path, without a fallback font.
  t='xt, t';ww=F.advance(t,26)+F.advance('0',18);left=375-ww/2;b+=lab(left,191,t,26,'start')+lab(left+F.advance(t,26),181,'0',18,'start')
 raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="260" viewBox="0 0 {w} 260"><title>Lộ trình phản ứng theo nguồn aniline</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aniline-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='9844vòng3double/NO2,NH3Cl,NH2side/arrow1bare/arrow2Zn+HCl(aq)/arrow3NaOH(aq)/KHÔNGcharges;12923CIRCLE/NO2NH2top/+HNO3đặctrên/xt,t0supdưới/+Fe/HCl/khôngcaption.'))
(M/'cau-truc-aniline-ddh-lo-140-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
