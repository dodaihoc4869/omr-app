"""Hai nguyên tử nguồn50: giữ chấm đen, mép cắt và nét đứt native riêng."""
from pathlib import Path
import importlib.util,json,hashlib,math
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-nguyen-tu-xy50-lo-351.json').read_text());h=p['hash'];b=''
for a in p['geometry']['panels']:
 for o in a['solidOrbits']:
  x,y=o['center'];b+=f'<ellipse cx="{x}" cy="{y}" rx="{o["rx"]}" ry="{o["ry"]}" fill="none" stroke="#333333" stroke-width="2.3"/>'
 o=a['dashedNucleus'];x,y=o['center'];rx,ry=o['rx'],o['ry']
 for lo,hi in o['anglesClockwiseDegreesFromRight']:
  t,u=math.radians(lo),math.radians(hi);x0,y0=x+rx*math.cos(t),y+ry*math.sin(t);x1,y1=x+rx*math.cos(u),y+ry*math.sin(u)
  b+=f'<path d="M{x0:.3f} {y0:.3f}A{rx} {ry} 0 0 1 {x1:.3f} {y1:.3f}" fill="none" stroke="#333333" stroke-width="2" stroke-linecap="round"/>'
 c=a['letter'];x0,y0,x1,y1=c['bbox'];b+=F.label((x0+x1)/2,y1,c['text'],28,fill='#000000')
 for o in a['innerDots']+a['outerDots']:
  x,y=o['center'];b+=f'<circle cx="{x}" cy="{y}" r="{o["radius"]}" fill="#000000"/>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="510" height="172" viewBox="0 0 510 172"><title>Hai nguyên tử X và Y theo nguồn50</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='nguyen-tu-xy-native50-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh'] if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=50,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='2atomsX-YregularUPRIGHT/4solidellipses2dashednuclei19visibleirregularrunsEACH-longupperleft/12BLACKdotsX9=2inner7outer-Y3=2inner1outer/2XTOPdotsCROPPEDnativeedge0/dotsOVERorbits/0charge0arrows/noaddedatomicnumber-name-shelllabels-solution-noeven20dashnormalize')
(K/'cau-truc-nguyen-tu-xy-native50-ddh-lo-351-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
