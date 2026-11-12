"""Ozone phân khử nguồn204: giữ R dạng số mũ, đỉnh C trần và nét đôi theo native."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-ozone379-lo-379.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(v):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+'" stroke="#202020" stroke-width="1" fill="none"/>'
def lab(x,y,t,z=20,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#202020')
def chem(x,y,parts,z=18):
 out=''
 for t,sub in parts:
  size=z*.7 if sub else z;out+=lab(x,y+4 if sub else y,t,size,'start');x+=F.advance(t,size)
 return out
for key in ['reactant','leftProduct','rightProduct']:
 a=g[key]
 for v in a['Rarms']+a.get('doubleCC',a.get('COparallelRays',[])):b+=path(v)
 for e in a['Rlabels']:
  x,y,u,w=e['bbox'];baseline=23 if y<30 else 70
  b+=lab(x,baseline,'R',20,'start')+lab(x+F.advance('R',20),baseline-9,str('¹²³⁴'.index(e['text'][-1])+1),12,'start')
 if 'Olabel'in a:
  x,y,u,w=a['Olabel']['bbox'];b+=lab((x+u)/2,45.3,'O',20)
b+=lab(465,42,'+',20)
a=g['arrow'];b+=path(a['shaft'])
b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in a['filledTriangle'])+'Z" fill="#202020"/>'
b+=chem(211,33,[('1. O',False),('3',True)])
b+=chem(194,62,[('2. (CH',False),('3',True),(')',False),('2',True),('S',False)])
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="591" height="75" viewBox="0 0 591 75"><title>Ozone phân khử theo nguồn204</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='ozone379-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=204,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='4knownBAREC2explicitO-8RgroupsUNKNOWNtotalC-EXCLconditionC/1CCdoubleMAINLOWERy40-ALL4RarmsCONTACT-upperSHORTy35.5FREEbothends/2COdouble2splitfeetCONTACTrespectiveRarms-WHITEgapbeforeexplicitO-NOcrossbar/LEFTC39938-RIGHTC53537-nonperiodicCOy36-40vs35-39/ALLregularUPRIGHT-8Rsup1234-NOprintedC/1FILLEDskinnyRIGHThead/EXACT1.O3-2.(CH3)2S-SUB3-2/0stereo-charge-caption/NOaddedH-Rvalues-alkenename-Tformula-yield-answer-alias')
(K/'cau-truc-ozone379-native-ddh-lo-379-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
