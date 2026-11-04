"""Ba đơn vị glucose nguồn695 với ngoặc7000, giữ H/OH tường minh."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];M=G/'docs/hinh-vector-0311/kiem';s=importlib.util.spec_from_file_location('phong',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());a=sorted(p['assets'],key=lambda x:x['hash'])[695];refs={r['where']:r for r in json.loads((G/'docs/hinh-vector-0311/nguon/vi-tri-cong-khai.json').read_text())['refs']}
def line(d,w=1.8):return f'<path d="{d}" fill="none" stroke="#252440" stroke-width="{w}"/>'
def label(x,y,t,size=24):return F.label(x,y,t,size)
def wedge(x1,y1,x2,y2):
 import math
 nx,ny=-(y2-y1),x2-x1;ll=math.hypot(nx,ny);nx/=ll;ny/=ll
 pts=[(x1+nx*.7,y1+ny*.7),(x2+nx*2.7,y2+ny*2.7),(x2-nx*2.7,y2-ny*2.7),(x1-nx*.7,y1-ny*.7)]
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#252440"/>'

b='<g transform="translate(20 15)">'
for j,(dx,dy) in enumerate([(0,0),(285,-79),(568,-159)]):
 b+=f'<g transform="translate({dx} {dy})">'+line('M103 294L152 246H207M232 258L269 294L220 343H151L103 294')+line('M151 343H220',4.5)+wedge(103,294,151,343)+wedge(269,294,220,343)+label(220,258,'O')
 b+=line('M152 246V220M152 246V269M103 294V259M151 343V323M151 343V365M220 343V317M220 343V367')
 for x,y,t in [(185,213,'CH₂OH'),(152,287,'H'),(103,255,'H'),(160,315,'OH'),(151,391,'H'),(220,311,'H'),(228,393,'OH')]:b+=label(x,y,t)
 if j==0:b+=line('M103 294V327')+label(112,355,'OH')
 if j==2:b+=line('M269 294V253M269 294V332')+label(278,249,'OH')+label(269,359,'H')
 else:b+=line('M269 294V332')+label(269,359,'H')
 b+='</g>'
b+=line('M269 294L311 263M340 247L388 215M554 215L597 183M626 166L671 135')+label(328,264,'O')+label(610,185,'O')
b+=line('M373 102H360V323H373M636 102H648V323H636')+label(680,330,'7 000',18)+'</g>'
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="980" height="450" viewBox="0 0 980 450"><title>Ba đơn vị glucose và ngoặc7000 theo nguồn</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polyglucose-ddh-'+hh+'.svg';(M/fn).write_bytes(raw)
qs=[]
for q in p['questions']:
 hs=[h for h in q['hinh']if h['hash']==a['hash']]
 if hs:qs.append({'qid':q['qid'],'de':q['de'],'refs':[{'where':h['where'],'viTri':refs[h['where']]['viTri']}for h in hs]})
r={'i':695,'hash':a['hash'],'fileNguon':a['file'],'questions':qs,'daMoNative':True,'svg':fn,'hashSvg':hh,'byteSvg':len(raw),'font':'DDH Rounded','hashPhong':F.HASH,'trangThai':'cho-soat-doc-lap','ghiChuDung':'3rings/3CH2OH/allH-OHexplicit/2bridgeO/ngoặcgiữagiữaunit2vàbridge/7 000literal/frontboldC3–C2ngang+2nêmfrontchéodàyvề2đỉnhdưới;khôngthêmn/sốC/ellipsis.'}
(M/'cau-truc-polyglucose-ddh-lo-166-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2))
