"""Triglyceride nguồn939: ba mạch 16/18/18 carbon, chữ đậm WOFF2 thật."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='a9c2db29d2d6fefd1b709ac048312be0fe9217b8e88c0b4518d7fb80eabab54a';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
def line(d):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>'
rows=[[(170,85),(202,120),(237,85),(272,120),(306,85),(340,120),(375,85),(409,120),(443,85),(478,120),(512,85),(546,120),(581,85),(615,120),(650,85),(684,120)],[(170,181),(202,215),(237,181),(272,215),(306,181),(340,215),(375,181),(409,215),(443,181),(492,181),(527,215),(561,181),(595,215),(630,181),(665,215),(699,181),(733,215),(767,181)],[(170,278),(202,312),(237,278),(272,312),(306,278),(340,312),(375,278),(409,312),(443,278),(492,278),(527,312),(561,278),(610,278),(644,312),(678,278),(727,278),(761,312),(796,278)]]
b=''
for pts in rows:b+=line('M'+'L'.join(f'{x} {y}'for x,y in pts))
for y,base in [(85,120),(181,215),(278,312)]:
 b+=line(f'M94 {base}H119 M146 {y+23}L170 {y} M165 {y+5}V{y-21} M174 {y+4}V{y-21}')
 b+=F.label(134,base+10,'O',30,weight='dam')+F.label(169,y-26,'O',30,weight='dam')
for d in ['M79 142V197 M79 235V290','M447 191H488','M447 288H488','M565 288H606','M682 288H723']:b+=line(d)
for y,sub in [(130,True),(225,False),(322,True)]:
 b+=F.label(79,y,'C',30,weight='dam')
 if sub:b+=F.label(47,y,'H',30,weight='dam')+F.label(63,y+6,'2',21,weight='dam')
 else:b+=F.label(58,y,'H',30,weight='dam')
for x,y,t in [(850,108,'(1)'),(855,204,'(2)'),(858,302,'(3)')]:b+=F.label(x,y,t,32,weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="915" height="376" viewBox="0 0 915 376"><title>Triglyceride theo nguồn939</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='triglyceride-native939-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=939,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3acyl16-18-18C+3glycerolC=55C6O/0-1-3CCdouble/3COsplitfeet/explicitH2C-HC-H2C-Canchors/3trueDAMcaptions1-2-3/ALLtrueDAMchemical/noaddedH-CH3-stereo-answer/noalias490-801')
(K/'cau-truc-triglyceride-native939-ddh-lo-336-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
