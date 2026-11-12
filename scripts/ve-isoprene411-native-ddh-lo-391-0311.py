"""Nguồn411: giữ H₂C bên trái, hai số riêng và nhánh CH₃ theo bản in."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-isoprene411-lo-391.json').read_text());g=p['geometry'];h=p['hash'];b=''
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
for key in ['left','right']:
 for v in g[key]['singleBonds']:line(v,1.7)
 for pair in g[key]['doubleBonds']:
  for v in pair:line(v,1.7)
lab(11,63,'n',28);lab(84,63,'H₂C',28,anchor='end')
lab(137,63,'C',28,anchor='middle');lab(190,63,'CH',28);lab(275,63,'CH₂',28);lab(126,112,'CH₃',28)
lab(110,30,'(1)',26,anchor='middle');lab(257,35,'(2)',26,anchor='middle')
lab(573,69,'CH₂',28);lab(677,69,'C',28,anchor='middle');lab(729,69,'CH',28);lab(803,69,'CH₂',28);lab(666,118,'CH₃',28)
b+='<path d="M562 36 C550 50 550 70 562 86 M873 36 C886 50 886 70 873 86" fill="none" stroke="#303030" stroke-width="1.7"/>'
lab(886,90,'n',26)
line([[351,60],[491,60]],1.7)
b+='<path d="M501 60 L483 55 L486 60 L483 65 Z" fill="#303030"/>'
lab(384,48,'xt, t',26);lab(439,35,'o',16);lab(450,48,', p',26)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="920" height="135" viewBox="0 0 920 135"><title>Phản ứng theo nguồn411</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='isoprene411-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=411,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='LEFTn-H2C=C(CH3)-CH=CH2-RIGHTCH2-C(CH3)=CH-CH2/10printedC-16printedH-UNKNOWNn/2CCdoubleLEFT1RIGHT2raysEACH/2CH3DOWN-FIRSTCanchors137676/2ROUND+nSUB/1FILLEDrightheadconcavebase/EXACTxt,tSUPo,p/2nums(1)(2)differentbaseline30-35/ALLregularUPRIGHT-SUB23-leftnBASELINE/0stereo-charge-caption/NOaddedH-name-answer-conditions-alias')
(K/'cau-truc-isoprene411-native-ddh-lo-391-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
