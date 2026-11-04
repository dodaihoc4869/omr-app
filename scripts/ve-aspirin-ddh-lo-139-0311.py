"""Giữ thứ tự OCO/OOC, kiểu vòng, điều kiện và caption đúng từng nguồn aspirin."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-molecule-lo-139.json').read_text());rows=[]
def p(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
def lab(x,y,t,n=28,anc='start'):return F.label(x,y,t,n,anc)
for r in a:
 if r['i']not in[727,1323,1284,202,211,1168]:continue
 swapped=r['i']in[727,1323];circle=r['i']==1284;number=r['i']==1323;b=''
 for dx,product in[(0,False),(650,True)]:
  b+=f'<g transform="translate({dx} 0)">'+p('M100 90L144 115V165L100 190L56 165V115Z')
  if circle:b+='<circle cx="100" cy="140" r="27" fill="none" stroke="#252440" stroke-width="2.2"/>'
  elif swapped:b+=p('M135 120V160M97 179L65 161M65 119L97 101')
  else:b+=p('M103 101L135 119M135 161L103 179M65 160V120')
  top='COOH' if swapped else 'OH' if product else 'OOCCH₃';side='OH' if swapped and product else 'OCOCH₃' if swapped else 'COOH'
  b+=p('M100 90V55M144 115L171 100')+lab(88,45,top)+lab(176,105,side)
  if r.get('captions'):b+=lab(100,242,r['captions'][1 if product else 0],27,'middle')
  b+='</g>'
 b+=lab(360,157,'+',32,'middle')+lab(405,157,'H₂O')+p('M510 145H620M510 158H620')+'<path d="M620 145L606 140L609 145Z M510 158L524 163L521 158Z" fill="#252440"/>'
 if r.get('overArrow'):b+=lab(565,121,r['overArrow'],24,'middle')
 b+=lab(970,157,'+',32,'middle')+lab(1020,157,'CH₃COOH')
 if number:b+=lab(1280,157,'(1)',28,'middle')
 w=1340 if number else 1220;raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="280" viewBox="0 0 {w} 280"><title>Phản ứng thủy phân theo từng nguồn aspirin</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='aspirin-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='727/1323COOHtop/OCOCH3side,3doubleđúngpatternsource/nocond/2caption/1323GIỮ(1);1284OOCCH3top/CIRCLE/H+,t°/2caption;2022111168OOCCH3top/3double/H+KHÔNGt°/chỉ1168CÓcaption. Khôngsửaliteraltheohóahọc.'))
(M/'cau-truc-aspirin-ddh-lo-139-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
