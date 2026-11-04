"""Giữ ba vòng para, ba caption và NH amide tường minh theo nguồn."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-molecule-lo-139.json').read_text());rows=[]
def p(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
def lab(x,y,t,n=28,anc='middle'):return F.label(x,y,t,n,anc)
b=''
for cx,group in[(140,'NO₂'),(570,'NH₂'),(1000,None)]:
 b+=p(f'M{cx} 90L{cx+44} 115V165L{cx} 190L{cx-44} 165V115Z')+p(f'M{cx+35} 120V160M{cx-3} 179L{cx-35} 161M{cx-35} 119L{cx-3} 101')
 b+=p(f'M{cx-44} 165L{cx-71} 182M{cx+44} 115L{cx+71} 100')+lab(cx-72,205,'HO',28,'end')
 if group:b+=lab(cx+78,105,group,28,'start')
b+=lab(1085,105,'N')+lab(1085,137,'H')+p('M1101 102L1145 116M1141 118V149M1149 118V149M1145 116L1184 102')+lab(1145,181,'O')+lab(1190,108,'CH₃',28,'start')
for x,xx in[(315,430),(745,860)]:b+=p(f'M{x} 140H{xx}')+f'<path d="M{xx} 140L{xx-14} 135L{xx-11} 140L{xx-14} 145Z" fill="#252440"/>'
for x,t in[(140,'p-nitrophenol'),(570,'p-aminophenol'),(1090,'Paracetamol')]:b+=lab(x,265,t,27)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1310" height="305" viewBox="0 0 1310 305"><title>Ba chất và hai bước theo nguồn paracetamol</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='paracetamol-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
for r in a:
 if r['i']in[604,927,603]:rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='3vòng3double/HOdướitrái/NO2NH2NHCOCH3para;2arrowKHÔNGcond/byproduct/charge;NHamideHhiệnxếpdướiNtheosource/C=Oxuống/CH3text;đủ3caption,p-prefix/ParacetamolPcapital.'))
(M/'cau-truc-paracetamol-ddh-lo-142-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
