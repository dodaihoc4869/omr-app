"""Đồ thị nguồn955: nội suy bảo toàn các mẫu pixel, không suy dữ liệu hóa học."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='ac8a47ca4fc7847140bf64a62b9ba38695f672a47559f1d98b64f5b3c60900a5';iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
g=json.loads((K/'doc-do-thi-hieu-suat955-lo-339.json').read_text())['geometry']
def path(d,w=3,c='#737373',extra=''):return f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{w}" stroke-linecap="round" stroke-linejoin="round" {extra}/>'
def smooth(pts):
 # PCHIP: extrema/local slightfalls from the source remain; no overshoot.
 x=[p[0]for p in pts];y=[p[1]for p in pts];n=len(x);hh=[x[i+1]-x[i]for i in range(n-1)];dd=[(y[i+1]-y[i])/hh[i]for i in range(n-1)];m=[0.]*n
 for i in range(1,n-1):
  if dd[i-1]*dd[i]>0:
   w1=2*hh[i]+hh[i-1];w2=hh[i]+2*hh[i-1];m[i]=(w1+w2)/(w1/dd[i-1]+w2/dd[i])
 def end(h0,h1,d0,d1):
  z=((2*h0+h1)*d0-h0*d1)/(h0+h1)
  if z*d0<=0:return 0
  return min(abs(z),3*abs(d0))*(1 if d0>0 else -1) if d0*d1<0 else z
 m[0]=end(hh[0],hh[1],dd[0],dd[1]);m[-1]=end(hh[-1],hh[-2],dd[-1],dd[-2]);d=f'M{x[0]} {y[0]}'
 for i in range(n-1):
  h3=hh[i]/3;d+=f'C{x[i]+h3:.4f} {y[i]+h3*m[i]:.4f} {x[i+1]-h3:.4f} {y[i+1]-h3*m[i+1]:.4f} {x[i+1]} {y[i+1]}'
 return d
b=''
for x in g['grid']['verticalX']:b+=path(f'M{x} 39V430',1.2,'#c4c4c4','stroke-dasharray=".6 3.2"')
for y in g['grid']['horizontalY']:b+=path(f'M95 {y}H561',1.2,'#c4c4c4','stroke-dasharray=".6 3.2"')
for c in g['curves']:
 b+=path(smooth(c['pixelSamples']))
 x,y=c['endpointCircle']['center'];b+=path(f'M516 {y}H556',2.6)
 b+=f'<circle cx="{x}" cy="{y}" r="4.5" fill="#fff" stroke="#8c8c8c" stroke-width="2"/>'
 b+=f'<path d="M565 {y-19}H645V{y+20}H565V{y+7}L555 {y}L565 {y-7}Z" fill="#636363" stroke="#888" stroke-width="1.2"/>'
 b+=F.label(605,y+7,c['temperatureLiteral'],20,fill='#fff',weight='dam')
b+=path('M95 36V430H562',3,'#626262')
b+='<path d="M90.5 40L95 32L99.5 40Z M558 425.5L566 430L558 434.5Z" fill="#626262"/>'
for r in g['xTicks']:
 b+=path(f"M{r['x']} 430V438",2.8,'#626262')+F.label(r['x'],462,r['text'],20,fill='#555',weight='dam')
for r in g['yTicks']:
 b+=path(f"M87 {r['y']}H95",2.8,'#626262')+F.label(83,r['y']+6,r['text'],20,anchor='end',fill='#555',weight='dam')
b+='<g transform="translate(45 230)rotate(-90)">'+F.label(0,0,'Hiệu suất (%)',24,fill='#555',weight='dam')+'</g>'
b+=F.label(579,462,'Áp suất (atm)',22,fill='#555',weight='dam')
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="687" height="504" viewBox="0 0 687 504"><title>Đồ thị hiệu suất theo nguồn955</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='do-thi-hieu-suat-native955-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
r=dict(i=955,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='5graycurves5HOLLOWcircles5temperaturetags350-400-450-500-550°C/9V7Hdottedgrid/2filledaxisheads/5X8Ynumbers2originzeros/no450Xtick/ALLtrueDAMupright/Hiệu suất (%)-Áp suất (atm)/pixelSamplesPCHIP-noaddedNH3-answer-noalias1095')
(K/'cau-truc-do-thi-hieu-suat-native955-ddh-lo-339-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
