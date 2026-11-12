"""Nguồn210: giữ riêng từng đỉnh và hai đoạn nối ngang carbonyl bản in."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-polyamide210-lo-390.json').read_text());g=p['geometry'];h=p['hash'];b=''
def line(v,w=2):
 global b
 b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in v)+f'" fill="none" stroke="#303030" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,weight='de',anchor='start'):
 global b
 b+=F.label(x,y,t,z,weight=weight,anchor=anchor,fill='#303030')
def chem(x,y,t,z=26):
 xx=x
 for c in t:
  sub=c in '₂₃';char={'₂':'2','₃':'3'}.get(c,c);size=z*.7 if sub else z
  lab(xx,y+6 if sub else y,char,size);xx+=F.advance(char,size)
for key in ['leftNH','centralNH']:
 for bond in ['entryBond','exitBond']:line(g[key][bond],1.6)
for key in ['firstChainBonds','secondChainBonds']:
 for v in g[key]:line(v,1.6)
line(g['rightFreeBond'],1.6)
for key in ['COdown','COup']:
 r=g[key];line(r['nativeHorizontalJoin'],1.6)
 for v in r['rays']:line(v,1.6)
lab(33,104,'NH',26);lab(315,78,'NH',26)
lab(375,147,'O',26,anchor='middle');lab(573,31,'O',26,anchor='middle')
b+='<path d="M22 16 C13 53 12 94 22 135 M590 16 C599 53 601 94 590 135" fill="none" stroke="#303030" stroke-width="1.6"/>'
lab(599,127,'n',25)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="622" height="160" viewBox="0 0 622 160"><title>Đoạn mạch theo nguồn210</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='polyamide210-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=210,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='12visibleC2N2O-2NH/2COUPDOWN2separatedraysEACH/2SHORTnativeHORIZONTALjoins-NHarmLEFTchainRIGHT-COupchainLEFTfreeRIGHT/NOtheoryVfeet/2ROUND+nSUB/2freecutendsUNKNOWNnotextraC/ALLregularUPRIGHT-NHliteralgroupedges/individualnonperiodicvertices/0arrow-caption-charge-CCdouble/NOaddedH-name-formula-answer-noalias13581376')
(K/'cau-truc-polyamide210-native-ddh-lo-390-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
