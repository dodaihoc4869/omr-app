"""Hai bước điều chế DEP: giữ cả hai H₁ và khe trắng chân carbonyl theo nguồn729."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-naph377-lo-377.json').read_text());g=p['geometry'];h=p['hash'];b=''
def path(v,close=False):
 return '<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+('Z'if close else'')+'" stroke="#202020" stroke-width="1.5" fill="none"/>'
def lab(x,y,t,z=26,anchor='middle'):
 return F.label(x,y,t,z,anchor=anchor,fill='#202020')
def chem(x,y,parts,z=26):
 out=''
 for t,kind in parts:
  size=z*.7 if kind in ('sub','sup') else z
  yy=y+5 if kind=='sub' else y-11 if kind=='sup' else y
  if kind=='italic':out+=f'<g transform="translate({x} {yy}) skewX(-12)">'+lab(0,0,t,size,'start')+'</g>'
  else:out+=lab(x,yy,t,size,'start')
  x+=F.advance(t,size)
 return out
n=g['naphthalene'];b+=path(n['leftHex'],True)
# Vòng phải dùng cạnh chung đã có, không vẽ đè cạnh chung.
b+=path(n['rightHex'])
for v in n['innerDoubleRays']:b+=path(v)
for key in ['anhydrideTop','anhydrideBottom']:
 a=g[key];b+=path(a['phenylVertices'],True)
 for v in a['phenylInnerDouble']+a['pentagonMainBonds']:b+=path(v)
 for v in [a['upperCO']['leftFreeRay'],a['upperCO']['rightContactRay']]+a['lowerCO']['rays']:b+=path(v)
 for labelkey,baseline in [('upperCO',22 if key=='anhydrideTop' else 177),('lowerCO',171 if key=='anhydrideTop' else 326)]:
  x1,y1,x2,y2=a[labelkey]['OlabelBBox'];b+=lab((x1+x2)/2,baseline,'O',27)
 x1,y1,x2,y2=a['ringOlabelBBox'];b+=lab((x1+x2)/2,95 if key=='anhydrideTop' else 250,'O',27)
d=g['diethylProduct'];b+=path(d['phenylVertices'],True)
for v in d['innerDoubleRays']:b+=path(v)
for e,yy in zip(d['esterLabels'],[211,295]):
 b+=path(e['bond'])+chem(661,yy,[('COOC','normal'),('2','sub'),('H','normal'),('5','sub')],26)
for a,xx,yy,pct in zip(g['arrows'],[340,393],[78,236],['75','85']):
 b+=path(a['shaft'])
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in a['filledTriangle'])+'Z" fill="#202020"/>'
 b+=chem(xx,yy,[('V','normal'),('2','sub'),('O','normal'),('5','sub'),(', t','normal'),('o','sup')],26)
 b+=chem(xx-8 if pct=='75' else xx-12,yy+42,[('H','normal'),('1','sub'),(' = ','normal'),(pct,'italic'),('%','normal')],26)
b+=chem(208,100,[('+  4O','normal'),('2','sub')],26)
b+=chem(709,102,[('+  2CO','normal'),('2','sub'),(' + H','normal'),('2','sub'),('O','normal')],26)
b+=chem(193,254,[('+  2C','normal'),('2','sub'),('H','normal'),('5','sub'),('OH','normal')],26)
b+=chem(789,260,[('+  H','normal'),('2','sub'),('O','normal')],26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="897" height="329" viewBox="0 0 897 329"><title>Hai bước điều chế DEP theo nguồn729</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='naph377-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=729,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='38C10OstructuresONLYEXCLreagentsconditions/5sixrings14innerCCdouble2anhydridefiveRings/4COdouble-upperLEFTfeetWHITEgap-upperRIGHTcontact-bottomBOTHcontact/2FILLEDrightheads/EXACTbothV2O5-tSUPo-bothH1-75%-85%/SUB125-regularUPRIGHTchemconditions-ONLY75-85regularITALIC/2literalCOOC2H5FIRSTCanchors-NOexpandedproductCO/0stereo-captions/NOH2normalize-catalystfix-yieldanswer-noalias982')
(K/'cau-truc-naph377-native-ddh-lo-377-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
