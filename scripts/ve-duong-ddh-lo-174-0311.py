"""Nguồn990 và1138: giữ hướng OH và từng hàng Fischer theo nguồn, không giải bài."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
a=json.loads((M/'doc-molecule-lo-169.json').read_text());out=[]
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
def wedge(p,q):
 x1,y1=p;x2,y2=q;nx,ny=-(y2-y1),x2-x1;ll=math.hypot(nx,ny);nx/=ll;ny/=ll;pts=[(x1+nx*.8,y1+ny*.8),(x2+nx*3.6,y2+ny*3.6),(x2-nx*3.6,y2-ny*3.6),(x1-nx*.8,y1-ny*.8)];return '<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#252440"/>'
for i in [990,1138]:
 r=dict(next(r for r in a if r['i']==i));r.pop('chiLaDuLieuDungChuaSoatRender',None);b='<g transform="translate(15 15)">'
 if i==990:
  b+=line('M65 127L158 102M195 102L279 127L241 167H108L65 127')+wedge((65,127),(108,167))+line('M108 167H241',7)+wedge((279,127),(241,167))
  b+=line('M65 127V84M65 127V171M108 167V214M241 167V103M279 127V182')
  for x,y,t in [(176,106,'O'),(108,77,'CH₂OH'),(78,199,'OH'),(118,242,'OH'),(255,95,'OH'),(323,210,'CH₂OH')]:b+=F.label(x,y,t,27)
  w,h=455,320
 else:
  for cx,top,caption in [(123,'CHO','glucose'),(534,'CH₂OH','sorbitol')]:
   b+=line(f'M{cx} 76V237',1.7)
   for j,(left,right) in enumerate([('H','OH'),('HO','H'),('H','OH'),('H','OH')]):
    y=97+j*40;b+=line(f'M{cx-22} {y}H{cx+22}',1.7)+F.label(cx-26,y+8,left,28,'end')+F.label(cx+26,y+8,right,28,'start')
   for yy,t in [(64,top),(267,'CH₂OH')]:b+=F.label(cx-F.advance('C',28)/2,yy,t,28,'start')
   b+=F.label(cx+13,307,caption,25)
  b+=F.label(285,167,'+ H₂',29)+line('M335 160H440m-10 -5l10 5l-10 5',1.7)+F.label(388,143,'Ni, t°',23)
  w,h=750,380
 b+='</g>';raw=('<svg xmlns="http://www.w3.org/2000/svg" width="%s" height="%s" viewBox="0 0 %s %s"><title>Công thức theo dữ liệu nguồn</title>'%(w,h,w,h)+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='duong-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
 r.update(svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',ghiChuDung='990leftC4bondCH2OHup+OHdown/rightCH2OHdown/lowleftOHdown/lowrightOHup/nofixedCnumbersH;1138Fischer2x4rowsRLRR/topCHO→CH2OH/bottomCH2OH/+H2/Nitdegree/2lowercasecaptions;khôngtựđảostereo/giảibài.')
 out.append(r)
(M/'cau-truc-duong-ddh-lo-174-ban-dung.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
