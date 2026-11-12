"""Hai giai đoạn điều chế styrene nguồn156; giữ nguyên nhãn và tọa độ từng vòng."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-styr380-lo-380.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(v,close=False):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+('Z'if close else'')+'" stroke="#202020" stroke-width="1.2" fill="none"/>'
def lab(x,y,t,z=16,anchor='middle'):return F.label(x,y,t,z,anchor=anchor,fill='#202020')
def chem(x,y,parts,z=16):
 out=''
 for t,kind in parts:
  size=z*.7 if kind in ('sub','sup') else z
  yy=y+4 if kind=='sub' else y-8 if kind=='sup' else y
  out+=lab(x,yy,t,size,'start');x+=F.advance(t,size)
 return out
for r in g['rings']:
 b+=path(r['vertices'],True)
 for v in r['innerDoubleRays']:b+=path(v)
for key in ['ethylBranch','vinylBranch']:b+=path(g[key]['bond'])
b+=chem(348-F.advance('C',16)/2,35,[('CH','normal'),('2','sub'),(' - CH','normal'),('3','sub')])
b+=chem(618-F.advance('C',16)/2,30,[('CH = CH','normal'),('2','sub')])
for a in g['arrows']:
 b+=path(a['shaft'])
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in a['filledTriangle'])+'Z" fill="#202020"/>'
b+=chem(154,104,[('+  CH','normal'),('2','sub'),(' = CH','normal'),('2','sub')])
for x,y in [(197,134),(462,102)]:b+=chem(x,y,[('xt, t','normal'),('o','sup')])
b+=chem(464,134,[('- H','normal'),('2','sub')])
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="172" viewBox="0 0 700 172"><title>Hai giai đoạn điều chế theo nguồn156</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='styr380-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=156,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='22structuralCEXCLreagentcondition/3Ph18bareC9innerCCdouble/2FILLEDrightheads/EXACTCH2 - CH3-firstC348-and-CH = CH2-firstC618-2verticalbranches/+CH2 = CH2/2literalxt,tSUPo/-H2lower/SUB23/ALLregularUPRIGHT/3ringsRIENGnativevertices-rays-nonperiodic/0stereo-captions-ringcircles/NOaddedp-90percent-h-yield-name-AB-answer-noalias845')
(K/'cau-truc-styr380-native-ddh-lo-380-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
