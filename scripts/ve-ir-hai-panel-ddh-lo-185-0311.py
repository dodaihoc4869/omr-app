"""Nguồn1033: hai đường phổ theo tâm nét ảnh nguồn; chữ DDH path."""
from pathlib import Path
import importlib.util,json,hashlib
from PIL import Image
import numpy as np
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='b93c0cabc6f6f1a6010f25ce35464cc4f11faa7a2015a8b8b107b1c1487ef0f1';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[v for v in q['hinh']if v['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
im=np.array(Image.open(G/'docs/hinh-vector-0311/nguon/anh'/f'{h}.png').convert('L'))
def line(d,w=1.4):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}" stroke-linejoin="round"/>'
b='';traces=[]
for left,right,top,bottom,lab in [(90,727,43,364,'E'),(805,1434,49,367,'F')]:
 pts=[]
 for x in range(left+3,right-2):
  ys=np.where(im[top+5:bottom-3,x]<165)[0]+top+5
  # Nhãn panel không thuộc đường phổ.
  if lab=='E':ys=ys[~((282<=x<=311)&(ys>=227)&(ys<=261))]
  else:ys=ys[~((997<=x<=1025)&(ys>=232)&(ys<=264))]
  if len(ys):pts.append([x,round(float(np.median(ys)),2)])
 # Đầu mút đỉnh hẹp đọc native/zoom độc lập; median cột làm nông tip.
 tips={'E':[(218,237),(402,348),(474,234),(487,139),(528,343),(535,288),(542,342),(574,158),(602,264),(637,201)],'F':[(880,337),(934,294),(943,273),(1110,353),(1195,320),(1227,350),(1266,331),(1276,343),(1297,210),(1314,263),(1381,235),(1406,201)]}[lab]
 vals=dict(pts)
 for tx,ty in tips:
  vals[tx]=ty
  for step in [-1,1]:
   if tx+step in vals:vals[tx+step]=round((vals[tx+step]+ty)/2,2)
 pts=sorted([[x,y]for x,y in vals.items()])
 traces.append(dict(panel=lab,points=pts,manualTips=tips))
 b+=line(f'M{left} {top}H{right}V{bottom}H{left}Z',1.5)+line('M'+'L'.join(f'{x} {y}'for x,y in pts),1.7)
 for j in range(11):
  y=bottom-(bottom-top)*j/10;b+=line(f'M{left} {y}H{left-(7 if j%2==0 else 4)}',1)
  if j%2==0:b+=F.label(left-9,y+5,str(j*10),17,'end')
 dx=(right-left)/26
 for j in range(27):
  x=left+dx*j;b+=line(f'M{x} {bottom}V{bottom+(7 if j in [0,5,10,15,20,25]else 4)}',1)
 for j,t in zip([0,5,10,15,20,25],['4000','3000','2000','1500','1000','500']):b+=F.label(left+dx*j,bottom+30,t,17)
 b+=F.label((left+right)/2,bottom+57,'Số sóng (cm⁻¹)',20)
 b+=f'<g transform="translate({left-51} {(top+bottom)/2}) rotate(-90)">'+F.label(0,0,'Độ truyền qua (%)',20)+'</g>'+F.label(297 if lab=='E'else 1010,258,lab,29)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1490" height="445" viewBox="0 0 1490 445"><title>Hai phổ IR theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ir-hai-panel-ddh-'+hh+'.svg';(K/fn).write_bytes(raw);r=dict(i=1033,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,curveGeometry=traces,ghiChuDung='2IRpanelsE/F/4frames/sourcecenterlinepoints/noinferredchemistry/Xmajor4000..500literalspacing/minor/Y0..100/2titlesmỗiPanel/DDHpath. Tâmnéttríchđểdựnglại,chưađạtđếnkhisoátnguồn+renderđộclập.');(K/'cau-truc-ir-hai-panel-ddh-lo-185-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
