"""Saccharose nguồn292: hai vòng nét mảnh, giữ từng H và hướng nhóm chữ."""
from pathlib import Path
import json,hashlib,importlib.util
G=Path(__file__).resolve().parents[1];K=G/'docs/hinh-vector-0311/kiem'
s=importlib.util.spec_from_file_location('font',G/'scripts/phong-vector-0311.py');F=importlib.util.module_from_spec(s);s.loader.exec_module(F)
h='af863fc8bdccb12ee9d1cf1c12b7256f1a4322e7a3de0523a156e2cebe16fd8a';b=''
def path(d,w=1.5):
 global b
 b+=f'<path d="{d}" fill="none" stroke="#000000" stroke-width="{w}" stroke-linecap="butt" stroke-linejoin="round"/>'
def lab(x,y,t,z=26,anchor='middle'):
 global b
 b+=F.label(x,y,t,z,anchor=anchor,fill='#000000')
def arrow(x,y,e):
 global b
 path(f'M{x} {y}H{e-3}',2)
 b+=f'<path d="M{e} {y}L{e-17} {y-4}L{e-15} {y}L{e-17} {y+4}Z" fill="#000000"/>'
# Cac dinh va tia rieng, khong chuan hoa thanh da giac deu.
path('M13 71L50 49L88 71L126 49L163 71V115L126 136L88 115L50 136L13 115Z M88 71V115')
path('M23 74L49 59 M23 112L49 126 M81 77V108 M130 59L154 74 M130 125L154 111')
lab(216,106,'+');lab(264,106,'4O₂');arrow(300,95,485)
def condition(cx,top,bottom,percent):
 # Chu hoa chat thang; rieng phan tram nghieng nhu ban goc.
 lab(cx,top,'V₂O₅, t',26)
 lab(cx+50,top-12,'o',19)
 lab(cx-29,bottom,'H₁ =',26)
 global b
 b+=f'<g transform="translate({cx+41} {bottom}) skewX(-10)">'+F.label(0,0,percent,26,fill='#000000')+'</g>'
condition(385,83,125,'75%')
def anh(dx,dy):
 path(f'M{dx} {dy+21}L{dx+38} {dy}L{dx+76} {dy+21}V{dy+65}L{dx+38} {dy+86}L{dx} {dy+65}Z')
 path(f'M{dx+7} {dy+28}V{dy+58} M{dx+41} {dy+10}L{dx+67} {dy+25} M{dx+41} {dy+76}L{dx+67} {dy+61}')
 path(f'M{dx+76} {dy+21}L{dx+116} {dy+9}L{dx+132} {dy+30} M{dx+132} {dy+55}L{dx+116} {dy+77}L{dx+76} {dy+65}')
 # Hai tia carbonyl tiep xuc RIENG hai canh tai chan tinh tu giao diem.
 path(f'M{dx+112} {dy+5}L{dx+126} {dy-16} M{dx+118} {dy+11.625}L{dx+132} {dy-12}')
 path(f'M{dx+112} {dy+75.8}L{dx+121} {dy+108} M{dx+118} {dy+74.25}L{dx+127} {dy+105}')
 lab(dx+139,dy+49,'O');lab(dx+139,dy-22,'O');lab(dx+128,dy+127,'O')
anh(506,50)
lab(717,108,'+');lab(773,108,'2CO₂');lab(824,108,'+');lab(868,108,'H₂O')
anh(7,204)
lab(201,259,'+');lab(280,259,'2C₂H₅OH');arrow(351,253,535);condition(436,241,283,'85%')
path('M553 231L593 209L628 231V275L592 296L553 274Z M628 231L658 216 M628 275L658 286')
path('M560 237V267 M594 219L620 234 M594 286L620 271')
lab(660,217,'COOC₂H₅',26,'start');lab(660,300,'COOC₂H₅',26,'start');lab(796,301,'+');lab(846,301,'H₂O')
# Hai manh chu TOP bi cat: giu net thay duoc, khong phuc hoi chu.
path('M54 0V4 M52 4H58 M220 0Q219 4 224 4Q227 3 227 0',1.2)
raw=('<svg xmlns="http://www.w3.org/2000/svg" width="897" height="339" viewBox="0 0 897 339"><title>Hai phản ứng nguồn982</title>'+b+'</svg>').encode();hh=hashlib.sha256(raw).hexdigest();fn='dep982-native-ddh-'+hh+'.svg';(K/fn).write_bytes(raw)
iv=json.loads((G/'docs/hinh-vector-0311/nguon/kiem-ke.json').read_text());qs=[]
for q in iv['questions']:
 refs=[r for r in q['hinh']if r['hash']==h]
 if refs:qs.append(dict(qid=q['qid'],de=q['de'],refs=refs))
note='2literalreactions2FILLEDrightheads/BOTHV2O5,tSUPo-BOTHH1=75%85%/ALLregularUPRIGHT-onlypercentITALIC/2anhydrides4COsplitfeet-upperLEFTFREEgap-upperRIGHTcontact-lowerBOTHcontact/2condensedCOOC2H5FIRSTC/2TOPcroppedUNKNOWNretain/noaddedH-theoryfix-answer-alias729/nativeapproxNOTsubpixel'
r=dict(i=982,hash=h,fileNguon='anh/'+h+'.png',svg=fn,hashSvg=hh,byteSvg=len(raw),font='DDH Rounded',hashPhong=F.HASH,trangThai='cho-soat-doc-lap',questions=qs,ghiChuDung=note)
(K/'cau-truc-dep982-native-ddh-lo-423-ban-dung.json').write_text(json.dumps([r],ensure_ascii=False,indent=2)+'\n')
(K/'doc-dep982-lo-423.json').write_text(json.dumps(dict(hash=h,native=[897,339],questions=qs,ghiChu=note,rootSourceAudit='Root OWNnativeFULL1x2x/all1publicde. BothH1 retained despite stem H2 second. TwoTOPcroppedUNKNOWN retain. Noalias729.'),ensure_ascii=False,indent=2)+'\n');print(hh,len(raw))
