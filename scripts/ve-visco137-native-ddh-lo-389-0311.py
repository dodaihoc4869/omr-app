"""Nguồn137: giữ công thức, caption nguyên văn và mép dưới cắt chữ."""
from pathlib import Path
import importlib.util,json,hashlib
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
p=json.loads((K/'doc-visco137-lo-389.json').read_text());g=p['geometry'];h=p['hash'];b=''
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
def italic(x,y,t,z=26):
 global b
 b+=f'<g transform="translate({x} {y}) skewX(-10)">'+F.label(0,0,t,z,anchor='start',fill='#303030')+'</g>'
for x,y in [(30,47),(1058,44)]:
 t='[C₆H₇O₂(OH)₃]';lab(x,y,t,26);lab(x+F.advance(t,26)+1,y+6,'n',18)
t='[C₆H₇O₂(OH)₂';lab(428,42,t,26)
for v in g['middleFormula']['horizontalSingleBonds']:line(v,1.7)
lab(625,42,'O',26,anchor='middle');lab(670,42,'C',26,anchor='middle')
lab(711,42,'SNa]',26);lab(711+F.advance('SNa]',26)+1,48,'n',18)
for v in g['middleFormula']['doubleSbranch']['twoShafts']:line(v,1.7)
lab(670,90,'S',26,anchor='middle')
for ar in g['arrows']:
 start,end=ar['shaft'];line([start,[end[0]-8,end[1]]],1.7)
 pts=ar['filledTriangle'];b+='<path d="M'+'L'.join(f'{x} {y}'for x,y in pts)+'Z" fill="#303030"/>'
lab(269,29,'1. NaOH',26);lab(269,70,'2. CS₂',26);lab(819,24,'+ H₂SO₄ (loãng)',26)
italic(71,112,'Cellulose',27);italic(484,121,'Cellulose xangtogenate',24);italic(1103,100,'Tơ visco',27)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="1269" height="116" viewBox="0 0 1269 116"><title>Sơ đồ theo nguồn137</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='visco137-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
r=dict(i=137,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung='3squarepairs3nSUB/LEFT-RIGHT[C6H7O2(OH)3]n-MID[C6H7O2(OH)2-O-C-SNa]n/explicitC=Sdown2separatedshaftsWHITEgapsNOTskeletalSplitFeet/2FILLEDrightheads/EXACT1.NaOH-2.CS2-+H2SO4(loãng)/ALLregularUPRIGHT-3regularITALICcaptionsEXACTCellulose-Cellulose xangtogenate-Tơ visco/MIDcaptionBOTTOMCROPnative116/NOcharges-byproducts-yieldanswer-namefix-noalias1365')
(K/'cau-truc-visco137-native-ddh-lo-389-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
