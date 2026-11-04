"""Giữ H/R và từng đầu mũi tên riêng của hai kiểu peptide công khai."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-peptide-chi-tiet-lo-135.json').read_text());rows=[]
def seg(x,y,xx,yy,w=1.1,c='#252440'):return f'<path d="M{x} {y}L{xx} {yy}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round"/>'
def lab(x,y,t,n):
 if t=='R′':return F.label(x,y,'R',n)+F.label(x+F.advance('R',n)/2+2,y-n*.45,"'",n*.7)
 return F.label(x,y,t,n)
def arrow(tip,tail):
 x,y=tip;xx,yy=tail;dx=x-xx;dy=y-yy;d=math.hypot(dx,dy);ux,uy=dx/d,dy/d;px,py=-uy,ux
 return seg(xx,yy,x,y,.8)+f'<path d="M{x} {y}L{x-5*ux+1.8*px} {y-5*uy+1.8*py}L{x-5*ux-1.8*px} {y-5*uy-1.8*py}Z" fill="#252440"/>'
for r in a:
 if r['i'] not in[200,330,1178,1100]:continue
 plain=r['i']!=1100;b=''
 if plain:
  w,h=1120,900;b='<g transform="translate(30 25) scale(4)">'
  bonds=[(25,124,43,114),(63,115,80,124),(80,124,108,110),(108,110,122,117),(143,120,161,110),(161,110,190,125),(190,125,206,118),(239,120,252,130),(53,101,53,91),(134,135,134,145),(80,124,80,141),(161,110,161,92),(105,108,105,93),(111,108,111,93),(187,127,187,145),(193,127,193,145)]
  for q in bonds:b+=seg(*q)
  for x,y,t in[(53,116,'N'),(134,130,'N'),(224,119,'NH'),(53,87,'H'),(134,161,'H'),(80,159,'R′'),(163,89,'R'),(108,87,'O'),(190,161,'O')]:b+=lab(x,y,t,14)
  geo=next(z for z in a if z['i']==200)['pixelGeometryApprox']
  for ar in geo['arrows']:b+=arrow(ar['tip'],ar['tail'])+lab(*ar['labelAt'],ar['label'],14)
 else:
  w,h=1660,780;b='<g transform="translate(35 25) scale(4)">'
  bonds=[(8,102,40,83),(67,83,98,102),(98,102,145,76),(145,76,176,94),(205,94,237,76),(237,76,283,102),(283,102,315,84),(344,83,376,102),(54,61,54,35),(191,117,191,136),(330,61,330,35),(98,102,98,139),(237,76,237,35),(141,74,141,35),(149,74,149,35),(279,104,279,138),(287,104,287,138)]
  for q in bonds:b+=seg(*q,1.4)
  for x,y,t in[(54,83,'N'),(191,109,'N'),(330,83,'N'),(54,27,'H'),(191,163,'H'),(330,27,'H'),(98,163,'R₁'),(237,27,'R₂'),(145,27,'O'),(283,163,'O')]:b+=lab(x,y,t,21)
  for ll in r['pixelGeometryApprox']['leaders']:
   b+=seg(*ll['start'],*ll['end'],.7,'#777')+lab(*ll['labelAt'],ll['label'],17)
 b+='</g>';raw=(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><title>Vị trí liên kết trong mạch peptide theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='peptide-nhan-ddh-'+hh+'.svg';(M/fn).write_bytes(raw);rows.append(dict(r,svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='200/330/1178NHphảigộp/Rprime+Rplain/arrowheads/mapping1..4;1100Hrời/R1R2/4leaderKHÔNGthêmhead/mappingkhác. Halphaẩn,2methylendpointẩn.'))
(M/'cau-truc-peptide-nhan-ddh-lo-135-ban-dung.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2))
