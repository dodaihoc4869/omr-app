"""Bốn phản ứng literal nguồn1379, giữ cả sản phẩm sai-looking của đề."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
r=next(r for r in json.loads((M/'doc-chi-tiet-con-lai-lo-155.json').read_text())if r['i']==1379)
b='';size=32
rows=[('a)','H₂NCH₂COOH + CH₃CH₂OH','H₂NCH₂CH₂COOCH₃ + H₂O','H₂SO₄, t'),('b)','HCl + H₂NCH(CH₃)COOH','ClH₃NCH(CH₃)COOH',''),('c)','H₂NCH(CH₃)COOH + NaOH','H₂NCH(CH₃)COONa + H₂O',''),('d)','nH₂N[CH₂]₅COOH','','xt, t')]
for j,(cap,left,right,cond) in enumerate(rows):
 y=90+j*110;b+=F.label(30,y,cap,size,'start')+F.label(95,y,left,size,'start');x=95+F.advance(left,size)+25;ln=175 if cond else 100;end=x+ln
 b+=f'<path d="M{x} {y-8}H{end}m-12 -7l12 7l-12 7" fill="none" stroke="#252440" stroke-width="2"/>'
 if cond:
  cx=(x+end)/2;b+=F.label(cx,y-28,cond,23)
  xx=cx+F.advance(cond,23)/2;b+=F.label(xx,y-39,'0',15,'start')
  if j==3:b+=F.label(xx+F.advance('0',15),y-28,', p',23,'start')
 if j<3:b+=F.label(end+25,y,right,size,'start')
 else:
  px=end+40;inside='HN–[CH₂]₅–CO';w=F.advance(inside,size);b+=F.label(px,y,inside,size,'start');b+=f'<path d="M{px-18} {y-8}H{px}M{px+w} {y-8}H{px+w+22}M{px-2} {y-28}q-12 17 0 35M{px+w+5} {y-28}q12 17 0 35" fill="none" stroke="#252440" stroke-width="2"/>';b+=F.label(px+w+25,y+14,'n',22,'start')+F.label(px+w+62,y,'+ nH₂O',size,'start')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1250" height="470" viewBox="0 0 1250 470"><title>Bốn phản ứng theo nguồn, giữ nguyên từng công thức</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='phan-ung-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='4rowsa-d;productaH2NCH2CH2COOCH3literal/productbClH3NCH(CH3)COOHnochargethêm;polymerHN[CH2]5CO/ngoặcn/stubs/+nH2O,conditionsH2SO4t0 vàxtt0p.')
(M/'cau-truc-phan-ung-ddh-lo-159-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
